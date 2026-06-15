/**
 * Fixture dry-run generator.
 * Orchestrates: eligibility → slots → schedule → conflict detection → persist.
 */

import { db } from "@/lib/db";
import {
  categories, teams, courts, courtAvailabilityRules, gameModes,
  contextVersions, dryRuns, dryRunChanges, tournaments,
} from "@/lib/db/schema";
import { eq, and, count, desc } from "drizzle-orm";
import { validateAllCategories } from "./eligibility";
import { generateSlotsForDateRange, dayNameToNumber, addWeeks, type AvailabilityRule } from "./slots";
import { scheduleMatches, type SchedulerCategory } from "./scheduler";
import { detectCourtOverlaps, detectTeamOverlaps, type ScheduledMatch } from "./conflicts";

const DEFAULT_MATCH_DURATION = 60;
const DEFAULT_WEEKS_AHEAD = 10;

export type GeneratorOptions = {
  weeksAhead?: number;
};

export type GeneratorResult = {
  dryRunId: string;
  summary: {
    categoriesEligible: number;
    categoriesSkipped: number;
    matchesScheduled: number;
    matchesUnscheduled: number;
    conflicts: number;
    warnings: number;
  };
};

export async function generateFixtureDryRun(
  orgId: string,
  userId: string,
  tournamentId: string,
  options: GeneratorOptions = {}
): Promise<GeneratorResult> {
  const weeksAhead = options.weeksAhead ?? DEFAULT_WEEKS_AHEAD;

  // 1. Load tournament
  const [tournament] = await db
    .select()
    .from(tournaments)
    .where(and(eq(tournaments.id, tournamentId), eq(tournaments.organizationId, orgId)))
    .limit(1);

  if (!tournament) throw new Error("Torneo no encontrado");

  // 2. Load categories with team counts
  const catsRaw = await db
    .select({
      id: categories.id,
      name: categories.name,
      startDate: categories.startDate,
      gameModeId: categories.gameModeId,
      isActiveForFixture: categories.isActiveForFixture,
      colorHex: categories.colorHex,
    })
    .from(categories)
    .where(and(eq(categories.tournamentId, tournamentId), eq(categories.organizationId, orgId)));

  const teamCountRows = await db
    .select({ categoryId: teams.categoryId, count: count() })
    .from(teams)
    .where(eq(teams.organizationId, orgId))
    .groupBy(teams.categoryId);

  const countMap = Object.fromEntries(teamCountRows.map((r) => [r.categoryId, r.count]));

  const categoriesWithCount = catsRaw.map((c) => ({
    ...c,
    teamCount: countMap[c.id] ?? 0,
  }));

  // 3. Validate eligibility
  const eligibilityResults = validateAllCategories(categoriesWithCount);
  const eligibleCatIds = new Set(
    eligibilityResults.filter((r) => r.eligible).map((r) => r.categoryId)
  );

  // 4. Load teams for eligible categories
  const eligibleTeams = await db
    .select({ id: teams.id, categoryId: teams.categoryId, clubId: teams.clubId })
    .from(teams)
    .where(and(eq(teams.organizationId, orgId), eq(teams.status, "active")));

  const teamsByCategory = new Map<string, typeof eligibleTeams>();
  for (const team of eligibleTeams) {
    if (!eligibleCatIds.has(team.categoryId)) continue;
    if (!teamsByCategory.has(team.categoryId)) teamsByCategory.set(team.categoryId, []);
    teamsByCategory.get(team.categoryId)!.push(team);
  }

  // 5. Load game modes for eligible categories
  const gameModeRows = await db
    .select({ categoryId: gameModes.categoryId, modeJson: gameModes.modeJson })
    .from(gameModes)
    .where(eq(gameModes.organizationId, orgId));

  const gameModeMap = new Map<string, Record<string, unknown>>();
  for (const gm of gameModeRows) {
    if (gm.categoryId) gameModeMap.set(gm.categoryId, gm.modeJson as Record<string, unknown>);
  }

  // 6. Load org context for constraints
  const [orgContext] = await db
    .select()
    .from(contextVersions)
    .where(and(eq(contextVersions.organizationId, orgId), eq(contextVersions.scope, "organization")))
    .orderBy(desc(contextVersions.versionNumber))
    .limit(1);

  const orgConstraints = (orgContext?.parsedConstraints ?? {}) as Record<string, unknown>;
  const matchDuration =
    (orgConstraints.defaultMatchDurationMinutes as number | undefined) ?? DEFAULT_MATCH_DURATION;
  const playDayNames = (orgConstraints.playDays as string[] | undefined) ?? ["friday", "saturday", "sunday"];
  const playDayNumbers = playDayNames.map(dayNameToNumber).filter((d) => d >= 0);
  const clubGrouping = (orgConstraints.clubGrouping as { enabled?: boolean } | undefined)?.enabled ?? false;

  // 7. Load courts + availability rules
  const orgCourts = await db
    .select({ id: courts.id, name: courts.name })
    .from(courts)
    .where(and(eq(courts.organizationId, orgId), eq(courts.isActive, true)));

  const availRules = await db
    .select({
      courtId: courtAvailabilityRules.courtId,
      dayOfWeek: courtAvailabilityRules.dayOfWeek,
      specificDate: courtAvailabilityRules.specificDate,
      startTime: courtAvailabilityRules.startTime,
      endTime: courtAvailabilityRules.endTime,
      isAvailable: courtAvailabilityRules.isAvailable,
    })
    .from(courtAvailabilityRules);

  // 8. Compute date range
  const eligibleCats = [...eligibleCatIds];
  const catStartDates = catsRaw
    .filter((c) => eligibleCatIds.has(c.id) && c.startDate)
    .map((c) => c.startDate!);

  const earliestStart = catStartDates.sort()[0] ?? new Date().toISOString().slice(0, 10);
  const endDate = addWeeks(earliestStart, weeksAhead);

  // 9. Generate slots
  const slots = generateSlotsForDateRange(
    earliestStart,
    endDate,
    orgCourts,
    availRules as AvailabilityRule[],
    matchDuration,
    playDayNumbers
  );

  // 10. Build scheduler input
  const schedulerCategories: SchedulerCategory[] = [];
  for (const catId of eligibleCats) {
    const cat = catsRaw.find((c) => c.id === catId);
    if (!cat || !cat.startDate) continue;
    const catTeams = teamsByCategory.get(catId) ?? [];
    if (catTeams.length < 2) continue;

    const gm = gameModeMap.get(catId);
    const gameModeType = (gm?.type as string | undefined) ?? "single_round_robin";

    schedulerCategories.push({
      id: catId,
      name: cat.name,
      startDate: cat.startDate,
      gameModeType,
      teams: catTeams.map((t) => ({ id: t.id, clubId: t.clubId })),
      matchDurationMinutes: matchDuration,
    });
  }

  // 11. Run scheduler
  const { matches: scheduledMatches, warnings, unscheduledPairs } = scheduleMatches(
    schedulerCategories,
    slots,
    { clubGrouping }
  );

  // 12. Conflict detection
  const scheduledForConflict: ScheduledMatch[] = scheduledMatches.map((m) => ({
    id: `${m.categoryId}-${m.homeTeamId}-${m.awayTeamId}`, // temp id
    courtId: m.courtId,
    scheduledDate: m.date,
    startTime: m.startTime,
    endTime: m.endTime,
    homeTeamId: m.homeTeamId,
    awayTeamId: m.awayTeamId,
    isLocked: false,
    categoryId: m.categoryId,
  }));

  const courtConflicts = detectCourtOverlaps(scheduledForConflict);
  const teamConflicts = detectTeamOverlaps(scheduledForConflict);
  const allConflicts = [...courtConflicts, ...teamConflicts];

  // 13. Build summary
  const summary = {
    categoriesEligible: eligibleCatIds.size,
    categoriesSkipped: categoriesWithCount.length - eligibleCatIds.size,
    matchesScheduled: scheduledMatches.length,
    matchesUnscheduled: unscheduledPairs.length,
    conflicts: allConflicts.length,
    warnings: warnings.length,
    eligibilityReasons: eligibilityResults
      .filter((r) => !r.eligible)
      .map((r) => ({ name: r.categoryName, reasons: r.reasons })),
  };

  // 14. Persist dry run
  const [dryRun] = await db
    .insert(dryRuns)
    .values({
      organizationId: orgId,
      tournamentId,
      status: "ready",
      reason: `Fixture generado · ${tournament.name}`,
      summary,
      createdBy: userId,
    })
    .returning();

  // 15. Persist dry run changes
  const changesToInsert = [
    // Scheduled matches as "add" changes
    ...scheduledMatches.map((m) => ({
      dryRunId: dryRun.id,
      changeType: "add",
      entityType: "match",
      entityId: null,
      beforeJson: null,
      afterJson: m as unknown as Record<string, unknown>,
      severity: "info" as const,
      explanation: `Partido nuevo en ${m.date} ${m.startTime} · ${m.courtName}`,
    })),
    // Warnings
    ...warnings.map((w) => ({
      dryRunId: dryRun.id,
      changeType: "warning",
      entityType: "match",
      entityId: null,
      beforeJson: null,
      afterJson: null,
      severity: "warning" as const,
      explanation: w.message,
    })),
    // Unscheduled pairs
    ...unscheduledPairs.map((p) => ({
      dryRunId: dryRun.id,
      changeType: "warning",
      entityType: "match",
      entityId: null,
      beforeJson: null,
      afterJson: p as unknown as Record<string, unknown>,
      severity: "warning" as const,
      explanation: `Partido no programado por falta de slots disponibles`,
    })),
    // Conflicts
    ...allConflicts.map((c) => ({
      dryRunId: dryRun.id,
      changeType: "conflict",
      entityType: "match",
      entityId: null,
      beforeJson: null,
      afterJson: null,
      severity: "error" as const,
      explanation: c.message,
    })),
  ];

  if (changesToInsert.length > 0) {
    await db.insert(dryRunChanges).values(changesToInsert);
  }

  return { dryRunId: dryRun.id, summary };
}
