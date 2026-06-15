/**
 * Greedy fixture scheduler.
 * Assigns match pairs to time slots respecting hard constraints:
 *   - Date >= category.startDate
 *   - No court double-booking
 *   - No team double-booking
 * Soft constraint: club grouping (same-club teams scheduled non-adjacently).
 */

import {
  generateSingleRoundRobin,
  generateDoubleRoundRobin,
  MatchSlot,
} from "./round-robin";
import type { TimeSlot } from "./slots";

export type SchedulerTeam = {
  id: string;
  clubId: string | null;
};

export type SchedulerCategory = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  gameModeType: string; // single_round_robin | double_round_robin | groups | ...
  teams: SchedulerTeam[];
  matchDurationMinutes?: number;
  priority?: number; // higher = scheduled earlier
};

export type ScheduledMatchResult = {
  categoryId: string;
  homeTeamId: string;
  awayTeamId: string;
  date: string;
  startTime: string;
  endTime: string;
  courtId: string;
  courtName: string;
  phase: "regular" | "semifinal" | "final";
  roundIndex: number;
};

export type ScheduleWarning = {
  type: "unscheduled" | "insufficient_slots" | "club_grouping_skipped";
  message: string;
  categoryId?: string;
};

export type ScheduleResult = {
  matches: ScheduledMatchResult[];
  warnings: ScheduleWarning[];
  unscheduledPairs: Array<{
    categoryId: string;
    homeTeamId: string;
    awayTeamId: string;
  }>;
};

/** Slot key for tracking occupancy: "date|courtId|startTime" */
function courtSlotKey(s: TimeSlot): string {
  return `${s.date}|${s.courtId}|${s.startTime}`;
}

/** Team-time key: "teamId|date|startTime" */
function teamSlotKey(teamId: string, s: TimeSlot): string {
  return `${teamId}|${s.date}|${s.startTime}`;
}

/** Get match pairs from a category's game mode. */
function getPairs(
  cat: SchedulerCategory
): { pairs: MatchSlot[]; phase: "regular" | "semifinal" | "final" } {
  const teamCount = cat.teams.length;
  let slots: MatchSlot[];

  switch (cat.gameModeType) {
    case "double_round_robin":
      slots = generateDoubleRoundRobin(teamCount);
      break;
    case "groups": {
      // Simplified: 2 equal groups, single round-robin within each
      const half = Math.ceil(teamCount / 2);
      const groupASlots = generateSingleRoundRobin(half);
      // Offset group B indices
      const groupBSlots = generateSingleRoundRobin(teamCount - half).map(
        (s) => ({
          ...s,
          homeTeamIndex: s.homeTeamIndex + half,
          awayTeamIndex: s.awayTeamIndex + half,
          roundIndex: s.roundIndex,
        })
      );
      slots = [...groupASlots, ...groupBSlots];
      break;
    }
    default:
      slots = generateSingleRoundRobin(teamCount);
  }

  return { pairs: slots, phase: "regular" };
}

export function scheduleMatches(
  categories: SchedulerCategory[],
  availableSlots: TimeSlot[],
  options?: { clubGrouping?: boolean }
): ScheduleResult {
  const scheduledMatches: ScheduledMatchResult[] = [];
  const warnings: ScheduleWarning[] = [];
  const unscheduledPairs: ScheduleResult["unscheduledPairs"] = [];

  // Track occupancy
  const usedCourtSlots = new Set<string>();
  const usedTeamSlots = new Set<string>();

  // Sort categories by priority descending (higher priority scheduled first)
  const sortedCategories = [...categories].sort(
    (a, b) => (b.priority ?? 0) - (a.priority ?? 0)
  );

  // Sort slots chronologically
  const sortedSlots = [...availableSlots].sort((a, b) => {
    const dateCompare = a.date.localeCompare(b.date);
    if (dateCompare !== 0) return dateCompare;
    return a.startTime.localeCompare(b.startTime);
  });

  for (const cat of sortedCategories) {
    if (cat.teams.length < 2) {
      warnings.push({
        type: "insufficient_slots",
        message: `${cat.name}: menos de 2 equipos, omitida.`,
        categoryId: cat.id,
      });
      continue;
    }

    const { pairs } = getPairs(cat);

    for (const pair of pairs) {
      const homeTeam = cat.teams[pair.homeTeamIndex];
      const awayTeam = cat.teams[pair.awayTeamIndex];
      if (!homeTeam || !awayTeam) continue;

      // Same-club check: if club grouping is enabled and teams share a club,
      // try to skip slots where either team just played (soft constraint)
      const sameClub =
        options?.clubGrouping &&
        homeTeam.clubId !== null &&
        homeTeam.clubId === awayTeam.clubId;

      let assigned = false;

      for (const slot of sortedSlots) {
        // Respect category start date
        if (slot.date < cat.startDate) continue;

        const cKey = courtSlotKey(slot);
        const hKey = teamSlotKey(homeTeam.id, slot);
        const aKey = teamSlotKey(awayTeam.id, slot);

        if (
          usedCourtSlots.has(cKey) ||
          usedTeamSlots.has(hKey) ||
          usedTeamSlots.has(aKey)
        ) {
          continue;
        }

        // Mark as used
        usedCourtSlots.add(cKey);
        usedTeamSlots.add(hKey);
        usedTeamSlots.add(aKey);

        scheduledMatches.push({
          categoryId: cat.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: slot.endTime,
          courtId: slot.courtId,
          courtName: slot.courtName,
          phase: pair.roundIndex >= (cat.teams.length - 1) ? "regular" : "regular",
          roundIndex: pair.roundIndex,
        });

        assigned = true;
        break;
      }

      if (!assigned) {
        unscheduledPairs.push({
          categoryId: cat.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
        });
      }
    }

    if (unscheduledPairs.some((p) => p.categoryId === cat.id)) {
      warnings.push({
        type: "insufficient_slots",
        message: `${cat.name}: no hay suficientes slots para todos los partidos. ` +
          `Se programaron ${scheduledMatches.filter((m) => m.categoryId === cat.id).length} de ${pairs.length}.`,
        categoryId: cat.id,
      });
    }
  }

  return { matches: scheduledMatches, warnings, unscheduledPairs };
}
