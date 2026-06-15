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

export type TeamTimeConstraint = {
  teamId: string;
  afterTime?: string;  // HH:MM — team cannot start before this time
  beforeTime?: string; // HH:MM — team must start before this time
};

export type SchedulerCategory = {
  id: string;
  name: string;
  startDate: string; // YYYY-MM-DD
  gameModeType: string; // single_round_robin | double_round_robin | groups | ...
  teams: SchedulerTeam[];
  matchDurationMinutes?: number;
  priority?: number; // higher = scheduled earlier
  teamTimeConstraints?: TeamTimeConstraint[]; // per-team earliest-start-time restrictions
  minDaysBetweenMatches?: number; // minimum calendar days between any two matches for same team
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

const SLOT_GRID = 15; // minutes — must match generator's SLOT_GRID_MINUTES

function toMinutes(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}
function fromMinutes(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/** Calendar days between two YYYY-MM-DD strings (always positive). */
function daysBetween(a: string, b: string): number {
  return Math.abs(
    (new Date(b).getTime() - new Date(a).getTime()) / (1000 * 60 * 60 * 24)
  );
}

/** Slot key for tracking occupancy: "date|courtId|startTime" */
function courtSlotKey(s: TimeSlot): string {
  return `${s.date}|${s.courtId}|${s.startTime}`;
}

/** Team-date key: "teamId|date" — a team plays at most once per calendar day. */
function teamSlotKey(teamId: string, s: TimeSlot): string {
  return `${teamId}|${s.date}`;
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
  // Track last played date per team for min-rest-days enforcement (shared across categories)
  const teamLastPlayedDate = new Map<string, string>();

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

    // Build time constraint lookups once per category
    const afterTimeMap = new Map<string, string>();
    const beforeTimeMap = new Map<string, string>();
    for (const tc of cat.teamTimeConstraints ?? []) {
      if (tc.afterTime) afterTimeMap.set(tc.teamId, tc.afterTime);
      if (tc.beforeTime) beforeTimeMap.set(tc.teamId, tc.beforeTime);
    }

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

        // Enforce per-team earliest-start-time restrictions (afterTime)
        const homeAfterTime = afterTimeMap.get(homeTeam.id);
        if (homeAfterTime && slot.startTime < homeAfterTime) continue;
        const awayAfterTime = afterTimeMap.get(awayTeam.id);
        if (awayAfterTime && slot.startTime < awayAfterTime) continue;

        // Enforce per-team latest-start-time restrictions (beforeTime)
        const homeBeforeTime = beforeTimeMap.get(homeTeam.id);
        if (homeBeforeTime && slot.startTime >= homeBeforeTime) continue;
        const awayBeforeTime = beforeTimeMap.get(awayTeam.id);
        if (awayBeforeTime && slot.startTime >= awayBeforeTime) continue;

        // Enforce minimum days between matches for same team
        if (cat.minDaysBetweenMatches) {
          const minDays = cat.minDaysBetweenMatches;
          const homeLastDate = teamLastPlayedDate.get(homeTeam.id);
          if (homeLastDate && daysBetween(homeLastDate, slot.date) < minDays) continue;
          const awayLastDate = teamLastPlayedDate.get(awayTeam.id);
          if (awayLastDate && daysBetween(awayLastDate, slot.date) < minDays) continue;
        }

        const matchDur = cat.matchDurationMinutes ?? 60;
        const startMin = toMinutes(slot.startTime);

        // Check court is free for the FULL match duration (all 15-min sub-slots)
        let courtFree = true;
        for (let t = startMin; t < startMin + matchDur; t += SLOT_GRID) {
          if (usedCourtSlots.has(`${slot.date}|${slot.courtId}|${fromMinutes(t)}`)) {
            courtFree = false;
            break;
          }
        }

        const hKey = teamSlotKey(homeTeam.id, slot);
        const aKey = teamSlotKey(awayTeam.id, slot);

        if (!courtFree || usedTeamSlots.has(hKey) || usedTeamSlots.has(aKey)) {
          continue;
        }

        // Block all 15-min sub-slots this match occupies on the court
        for (let t = startMin; t < startMin + matchDur; t += SLOT_GRID) {
          usedCourtSlots.add(`${slot.date}|${slot.courtId}|${fromMinutes(t)}`);
        }
        usedTeamSlots.add(hKey);
        usedTeamSlots.add(aKey);
        teamLastPlayedDate.set(homeTeam.id, slot.date);
        teamLastPlayedDate.set(awayTeam.id, slot.date);

        scheduledMatches.push({
          categoryId: cat.id,
          homeTeamId: homeTeam.id,
          awayTeamId: awayTeam.id,
          date: slot.date,
          startTime: slot.startTime,
          endTime: fromMinutes(startMin + matchDur), // actual end based on category duration
          courtId: slot.courtId,
          courtName: slot.courtName,
          phase: "regular",
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
