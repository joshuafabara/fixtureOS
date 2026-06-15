/**
 * Conflict detection for fixture scheduling.
 * All checks are deterministic — no AI involvement.
 */

export type ScheduledMatch = {
  id: string;
  courtId: string | null;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  homeTeamId: string | null;
  awayTeamId: string | null;
  isLocked: boolean;
  categoryId: string;
};

export type ConflictType =
  | "COURT_OVERLAP"
  | "TEAM_OVERLAP"
  | "LOCKED_MATCH_MODIFIED"
  | "BEFORE_START_DATE"
  | "COURT_UNAVAILABLE";

export type Conflict = {
  type: ConflictType;
  matchId: string;
  otherMatchId?: string;
  severity: "error" | "warning";
  message: string;
};

/** Returns true if two time ranges [a1,a2) and [b1,b2) overlap */
function timesOverlap(a1: string, a2: string, b1: string, b2: string): boolean {
  return a1 < b2 && b1 < a2;
}

/** Detect court double-bookings */
export function detectCourtOverlaps(matches: ScheduledMatch[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const withCourt = matches.filter(
    (m) => m.courtId && m.scheduledDate && m.startTime && m.endTime
  );

  for (let i = 0; i < withCourt.length; i++) {
    for (let j = i + 1; j < withCourt.length; j++) {
      const a = withCourt[i];
      const b = withCourt[j];
      if (
        a.courtId === b.courtId &&
        a.scheduledDate === b.scheduledDate &&
        timesOverlap(a.startTime!, a.endTime!, b.startTime!, b.endTime!)
      ) {
        conflicts.push({
          type: "COURT_OVERLAP",
          matchId: a.id,
          otherMatchId: b.id,
          severity: "error",
          message: `Conflicto de cancha: dos partidos asignados a la misma cancha y horario en ${a.scheduledDate}.`,
        });
      }
    }
  }
  return conflicts;
}

/** Detect team double-bookings (same team in two matches at the same time) */
export function detectTeamOverlaps(matches: ScheduledMatch[]): Conflict[] {
  const conflicts: Conflict[] = [];
  const withTime = matches.filter(
    (m) => m.scheduledDate && m.startTime && m.endTime
  );

  for (let i = 0; i < withTime.length; i++) {
    for (let j = i + 1; j < withTime.length; j++) {
      const a = withTime[i];
      const b = withTime[j];
      if (a.scheduledDate !== b.scheduledDate) continue;

      const teamsA = [a.homeTeamId, a.awayTeamId].filter(Boolean) as string[];
      const teamsB = [b.homeTeamId, b.awayTeamId].filter(Boolean) as string[];
      const overlap = teamsA.filter((t) => teamsB.includes(t));

      if (
        overlap.length > 0 &&
        timesOverlap(a.startTime!, a.endTime!, b.startTime!, b.endTime!)
      ) {
        conflicts.push({
          type: "TEAM_OVERLAP",
          matchId: a.id,
          otherMatchId: b.id,
          severity: "error",
          message: `Conflicto de equipo: un equipo tiene dos partidos al mismo tiempo en ${a.scheduledDate}.`,
        });
      }
    }
  }
  return conflicts;
}

/** Check that no locked match was modified (compare base vs proposed) */
export function detectLockedMatchModifications(
  baseMatches: ScheduledMatch[],
  proposedMatches: ScheduledMatch[]
): Conflict[] {
  const conflicts: Conflict[] = [];
  const baseMap = new Map(baseMatches.map((m) => [m.id, m]));

  for (const proposed of proposedMatches) {
    const base = baseMap.get(proposed.id);
    if (!base || !base.isLocked) continue;

    if (
      base.courtId !== proposed.courtId ||
      base.scheduledDate !== proposed.scheduledDate ||
      base.startTime !== proposed.startTime
    ) {
      conflicts.push({
        type: "LOCKED_MATCH_MODIFIED",
        matchId: proposed.id,
        severity: "error",
        message: `El partido ${proposed.id} está bloqueado y no puede ser modificado.`,
      });
    }
  }
  return conflicts;
}
