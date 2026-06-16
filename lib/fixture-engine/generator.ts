/**
 * Fixture dry-run generator.
 * Orchestrates: eligibility → slots → schedule → conflict detection → persist.
 */

import { db } from "@/lib/db";
import {
  categories, teams, courts, courtAvailabilityRules, gameModes,
  contextVersions, dryRuns, dryRunChanges, tournaments,
} from "@/lib/db/schema";
import { eq, and, count, desc, inArray } from "drizzle-orm";
import { validateAllCategories } from "./eligibility";
import { generateSlotsForDateRange, dayNameToNumber, addWeeks, type AvailabilityRule } from "./slots";
import { scheduleMatches, type SchedulerCategory, type TeamTimeConstraint } from "./scheduler";
import { detectCourtOverlaps, detectTeamOverlaps, type ScheduledMatch } from "./conflicts";

const DEFAULT_MATCH_DURATION = 60;
const DEFAULT_WEEKS_AHEAD = 10;
// Fine-grained slot grid so any match duration (60m, 75m, 90m) can be scheduled
// without court overlaps. Matches block all 15-min sub-slots they occupy.
const SLOT_GRID_MINUTES = 15;

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

  // 4. Load teams for eligible categories (include name for constraint matching)
  const eligibleTeams = await db
    .select({ id: teams.id, name: teams.name, categoryId: teams.categoryId, clubId: teams.clubId })
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

  // 6. Load all context versions at once (org, tournament, category)
  const eligibleCatIdList = [...eligibleCatIds];

  const allContextRows = await db
    .select({
      scope: contextVersions.scope,
      scopeId: contextVersions.scopeId,
      parsedConstraints: contextVersions.parsedConstraints,
      versionNumber: contextVersions.versionNumber,
    })
    .from(contextVersions)
    .where(eq(contextVersions.organizationId, orgId))
    .orderBy(desc(contextVersions.versionNumber));

  // Latest org context
  const orgContextRow = allContextRows.find((r) => r.scope === "organization");
  const orgConstraints = (orgContextRow?.parsedConstraints ?? {}) as Record<string, unknown>;

  // Latest tournament context
  const tournamentContextRow = allContextRows.find(
    (r) => r.scope === "tournament" && r.scopeId === tournamentId
  );
  const tournamentConstraints = (tournamentContextRow?.parsedConstraints ?? {}) as Record<string, unknown>;

  // Latest category context per category (keep first = highest version due to desc order)
  const catConstraintsMap = new Map<string, Record<string, unknown>>();
  for (const row of allContextRows) {
    if (
      row.scope === "category" &&
      row.scopeId &&
      eligibleCatIdList.includes(row.scopeId) &&
      !catConstraintsMap.has(row.scopeId)
    ) {
      catConstraintsMap.set(row.scopeId, (row.parsedConstraints ?? {}) as Record<string, unknown>);
    }
  }

  // Org-level scheduling params (these drive the slot grid)
  const matchDuration =
    (orgConstraints.defaultMatchDurationMinutes as number | undefined) ?? DEFAULT_MATCH_DURATION;
  const playDayNames = (orgConstraints.playDays as string[] | undefined) ?? ["friday", "saturday", "sunday"];
  const playDayNumbers = playDayNames.map(dayNameToNumber).filter((d) => d >= 0);
  const clubGrouping = (orgConstraints.clubGrouping as { enabled?: boolean } | undefined)?.enabled ?? false;

  // Collect timeRestrictions from org + tournament level (category-level merged per-category below)
  type TimeRestriction = { target: string; afterTime?: string; beforeTime?: string };
  const orgTimeRestrictions = (orgConstraints.timeRestrictions as TimeRestriction[] | undefined) ?? [];
  const tournamentTimeRestrictions = (tournamentConstraints.timeRestrictions as TimeRestriction[] | undefined) ?? [];

  // org-wide minDaysBetweenMatches (can be overridden per tournament/category)
  const orgMinDays = orgConstraints.minDaysBetweenMatches as number | undefined;
  const tournamentMinDays = tournamentConstraints.minDaysBetweenMatches as number | undefined;

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

  // 9. Generate slots at fine grid resolution so any match duration is handled correctly.
  // The scheduler blocks all 15-min sub-slots a match occupies (using category duration),
  // so courts never double-book regardless of whether categories use 60m, 75m, or 90m.
  const slots = generateSlotsForDateRange(
    earliestStart,
    endDate,
    orgCourts,
    availRules as AvailabilityRule[],
    SLOT_GRID_MINUTES,
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

    // Merge constraints: org → tournament → category (category wins for scalars)
    const catConstraints = catConstraintsMap.get(catId);
    const catDuration =
      (catConstraints?.matchDurationMinutes as number | undefined) ??
      ((catConstraints?.matchDurationByPhase as Record<string, number> | undefined)?.regular) ??
      (tournamentConstraints.matchDurationMinutes as number | undefined) ??
      matchDuration;

    // minDaysBetweenMatches: category > tournament > org
    const minDaysBetweenMatches =
      (catConstraints?.minDaysBetweenMatches as number | undefined) ??
      tournamentMinDays ??
      orgMinDays;

    // Effective play days: category > tournament > org
    const catPlayDayNames =
      (catConstraints?.playDays as string[] | undefined) ??
      (tournamentConstraints.playDays as string[] | undefined) ??
      playDayNames;
    const catAllowedDays = catPlayDayNames.map(dayNameToNumber).filter((d) => d >= 0);

    // Effective time window: category > tournament > org
    const catTimeWindow =
      (catConstraints?.timeWindow as { start: string; end: string } | undefined) ??
      (tournamentConstraints.timeWindow as { start: string; end: string } | undefined) ??
      (orgConstraints.timeWindow as { start: string; end: string } | undefined);

    // Merge timeRestrictions from all three levels (additive — all apply)
    const catTimeRestrictions = (catConstraints?.timeRestrictions as TimeRestriction[] | undefined) ?? [];
    const allTimeRestrictions = [...orgTimeRestrictions, ...tournamentTimeRestrictions, ...catTimeRestrictions];

    // Resolve restriction targets to team IDs via case-insensitive name match
    const teamTimeConstraints: TeamTimeConstraint[] = [];
    if (allTimeRestrictions.length > 0) {
      for (const team of catTeams) {
        let strictestAfter: string | null = null;
        let strictestBefore: string | null = null;
        for (const restriction of allTimeRestrictions) {
          if (team.name.toLowerCase().includes(restriction.target.toLowerCase())) {
            const af = restriction.afterTime as string | undefined;
            const bf = restriction.beforeTime as string | undefined;
            if (af && (!strictestAfter || af > strictestAfter)) strictestAfter = af;
            // strictest beforeTime = earliest deadline
            if (bf && (!strictestBefore || bf < strictestBefore)) strictestBefore = bf;
          }
        }
        if (strictestAfter || strictestBefore) {
          teamTimeConstraints.push({
            teamId: team.id,
            afterTime: strictestAfter ?? undefined,
            beforeTime: strictestBefore ?? undefined,
          });
        }
      }
    }

    schedulerCategories.push({
      id: catId,
      name: cat.name,
      startDate: cat.startDate,
      gameModeType,
      teams: catTeams.map((t) => ({ id: t.id, clubId: t.clubId })),
      matchDurationMinutes: catDuration,
      teamTimeConstraints: teamTimeConstraints.length > 0 ? teamTimeConstraints : undefined,
      minDaysBetweenMatches,
      allowedDays: catAllowedDays.length > 0 ? catAllowedDays : undefined,
      timeWindow: catTimeWindow,
    });
  }

  // 11. Run scheduler
  const { matches: scheduledMatches, warnings, unscheduledPairs } = scheduleMatches(
    schedulerCategories,
    slots,
    { clubGrouping }
  );

  // 11b. Knockout placeholder matches (TBD vs TBD) for bracket rounds
  type PlaceholderMatch = {
    categoryId: string;
    homeTeamId: null;
    awayTeamId: null;
    date: null;
    startTime: null;
    endTime: null;
    courtId: null;
    courtName: null;
    phase: string;
    roundIndex: number;
    isPlaceholder: true;
  };

  const ROUND_MATCH_COUNTS: Record<string, number> = {
    quarterfinal: 4,
    semifinal: 2,
    final: 1,
    "3rd_place": 1,
  };

  const placeholderMatches: PlaceholderMatch[] = [];
  for (const catId of eligibleCats) {
    const gm = gameModeMap.get(catId);
    if (!gm) continue;
    const gmType = (gm.type as string | undefined) ?? "";
    const playoffs = (gm.playoffs as string[] | undefined) ?? [];

    let rounds: string[] = [];
    if (gmType === "playoffs") {
      // pure playoffs — derive rounds from team count
      const catTeams = teamsByCategory.get(catId) ?? [];
      const n = catTeams.length;
      if (n >= 8) rounds = ["quarterfinal", "semifinal", "final"];
      else if (n >= 4) rounds = ["semifinal", "final"];
      else if (n >= 2) rounds = ["final"];
    } else if (gmType === "groups" && playoffs.length > 0) {
      rounds = playoffs;
    }

    for (const round of rounds) {
      const matchCount = ROUND_MATCH_COUNTS[round] ?? 1;
      for (let i = 0; i < matchCount; i++) {
        placeholderMatches.push({
          categoryId: catId,
          homeTeamId: null,
          awayTeamId: null,
          date: null,
          startTime: null,
          endTime: null,
          courtId: null,
          courtName: null,
          phase: round,
          roundIndex: i,
          isPlaceholder: true,
        });
      }
    }
  }

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
    placeholderMatches: placeholderMatches.length,
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
    // Placeholder knockout matches
    ...placeholderMatches.map((m) => {
      const cat = catsRaw.find((c) => c.id === m.categoryId);
      const roundLabel: Record<string, string> = { quarterfinal: "Cuartos de final", semifinal: "Semifinal", final: "Final", "3rd_place": "Tercer puesto" };
      return {
        dryRunId: dryRun.id,
        changeType: "add",
        entityType: "match",
        entityId: null,
        beforeJson: null,
        afterJson: m as unknown as Record<string, unknown>,
        severity: "info" as const,
        explanation: `Placeholder: ${roundLabel[m.phase] ?? m.phase} (match ${m.roundIndex + 1}) · ${cat?.name ?? "Categoría"}`,
      };
    }),
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
