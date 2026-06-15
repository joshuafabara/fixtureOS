/**
 * Conflict detection tests.
 * Covers: court overlaps, team overlaps, locked match modifications.
 *
 * Run: npm test -- __tests__/conflicts.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  detectCourtOverlaps,
  detectTeamOverlaps,
  detectLockedMatchModifications,
} from "@/lib/fixture-engine/conflicts";
import type { ScheduledMatch } from "@/lib/fixture-engine/conflicts";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

let _id = 0;
function makeMatch(overrides: Partial<ScheduledMatch> & { categoryId: string }): ScheduledMatch {
  return {
    id: `m${++_id}`,
    courtId: "court-a",
    scheduledDate: "2026-07-05",
    startTime: "09:00",
    endTime: "10:00",
    homeTeamId: "t1",
    awayTeamId: "t2",
    isLocked: false,
    ...overrides,
  };
}

// ─── COURT OVERLAPS ───────────────────────────────────────────────────────────

describe("detectCourtOverlaps", () => {
  it("no detecta conflicto cuando partidos son en fechas distintas", () => {
    const matches = [
      makeMatch({ categoryId: "c1", scheduledDate: "2026-07-05", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c1", scheduledDate: "2026-07-06", startTime: "09:00", endTime: "10:00" }),
    ];
    expect(detectCourtOverlaps(matches)).toHaveLength(0);
  });

  it("no detecta conflicto cuando partidos son en canchas distintas", () => {
    const matches = [
      makeMatch({ categoryId: "c1", courtId: "court-a", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c1", courtId: "court-b", startTime: "09:00", endTime: "10:00" }),
    ];
    expect(detectCourtOverlaps(matches)).toHaveLength(0);
  });

  it("no detecta conflicto cuando partidos son consecutivos (sin solapamiento)", () => {
    const matches = [
      makeMatch({ categoryId: "c1", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c2", startTime: "10:00", endTime: "11:00" }),
    ];
    expect(detectCourtOverlaps(matches)).toHaveLength(0);
  });

  it("detecta COURT_OVERLAP cuando dos partidos se solapan en misma cancha y fecha", () => {
    const matches = [
      makeMatch({ categoryId: "c1", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c2", startTime: "09:30", endTime: "10:30" }),
    ];
    const conflicts = detectCourtOverlaps(matches);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("COURT_OVERLAP");
    expect(conflicts[0].severity).toBe("error");
  });

  it("detecta conflicto cuando un partido contiene a otro completamente", () => {
    const matches = [
      makeMatch({ categoryId: "c1", startTime: "09:00", endTime: "12:00" }),
      makeMatch({ categoryId: "c2", startTime: "10:00", endTime: "11:00" }),
    ];
    const conflicts = detectCourtOverlaps(matches);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("COURT_OVERLAP");
  });

  it("no detecta conflicto si courtId es null", () => {
    const matches = [
      makeMatch({ categoryId: "c1", courtId: null, startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c2", courtId: null, startTime: "09:00", endTime: "10:00" }),
    ];
    expect(detectCourtOverlaps(matches)).toHaveLength(0);
  });

  it("detecta múltiples conflictos cuando 3 partidos se solapan en la misma cancha", () => {
    const matches = [
      makeMatch({ categoryId: "c1", startTime: "09:00", endTime: "10:30" }),
      makeMatch({ categoryId: "c2", startTime: "09:30", endTime: "11:00" }),
      makeMatch({ categoryId: "c3", startTime: "10:00", endTime: "11:30" }),
    ];
    const conflicts = detectCourtOverlaps(matches);
    expect(conflicts.length).toBeGreaterThanOrEqual(2);
  });

  it("retorna array vacío cuando no hay partidos", () => {
    expect(detectCourtOverlaps([])).toHaveLength(0);
  });
});

// ─── TEAM OVERLAPS ────────────────────────────────────────────────────────────

describe("detectTeamOverlaps", () => {
  it("no detecta conflicto cuando los equipos son distintos", () => {
    const matches = [
      makeMatch({ categoryId: "c1", homeTeamId: "t1", awayTeamId: "t2", courtId: "court-a", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c2", homeTeamId: "t3", awayTeamId: "t4", courtId: "court-b", startTime: "09:00", endTime: "10:00" }),
    ];
    expect(detectTeamOverlaps(matches)).toHaveLength(0);
  });

  it("no detecta conflicto cuando un equipo juega en fechas distintas", () => {
    const matches = [
      makeMatch({ categoryId: "c1", homeTeamId: "t1", scheduledDate: "2026-07-05", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c1", homeTeamId: "t1", scheduledDate: "2026-07-06", startTime: "09:00", endTime: "10:00" }),
    ];
    expect(detectTeamOverlaps(matches)).toHaveLength(0);
  });

  it("detecta TEAM_OVERLAP cuando mismo equipo en dos partidos simultáneos", () => {
    const matches = [
      makeMatch({ categoryId: "c1", homeTeamId: "t1", awayTeamId: "t2", courtId: "court-a", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c2", homeTeamId: "t1", awayTeamId: "t3", courtId: "court-b", startTime: "09:00", endTime: "10:00" }),
    ];
    const conflicts = detectTeamOverlaps(matches);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("TEAM_OVERLAP");
    expect(conflicts[0].severity).toBe("error");
  });

  it("detecta solapamiento cuando el equipo está como visitante en ambos", () => {
    const matches = [
      makeMatch({ categoryId: "c1", homeTeamId: "t2", awayTeamId: "t1", courtId: "court-a", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c2", homeTeamId: "t3", awayTeamId: "t1", courtId: "court-b", startTime: "09:30", endTime: "10:30" }),
    ];
    const conflicts = detectTeamOverlaps(matches);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("TEAM_OVERLAP");
  });

  it("no detecta conflicto cuando el equipo juega en horarios consecutivos", () => {
    const matches = [
      makeMatch({ categoryId: "c1", homeTeamId: "t1", awayTeamId: "t2", courtId: "court-a", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c2", homeTeamId: "t1", awayTeamId: "t3", courtId: "court-b", startTime: "10:00", endTime: "11:00" }),
    ];
    expect(detectTeamOverlaps(matches)).toHaveLength(0);
  });

  it("ignora partidos sin scheduledDate o startTime", () => {
    const matches = [
      makeMatch({ categoryId: "c1", homeTeamId: "t1", scheduledDate: null }),
      makeMatch({ categoryId: "c2", homeTeamId: "t1", startTime: null }),
    ];
    expect(detectTeamOverlaps(matches)).toHaveLength(0);
  });
});

// ─── LOCKED MATCH MODIFICATIONS ───────────────────────────────────────────────

describe("detectLockedMatchModifications", () => {
  it("no detecta conflicto cuando partido bloqueado no fue modificado", () => {
    const base = makeMatch({ categoryId: "c1", isLocked: true, courtId: "court-a", scheduledDate: "2026-07-05", startTime: "09:00" });
    const proposed = { ...base };
    expect(detectLockedMatchModifications([base], [proposed])).toHaveLength(0);
  });

  it("detecta LOCKED_MATCH_MODIFIED cuando se cambia la cancha", () => {
    const base = makeMatch({ categoryId: "c1", isLocked: true, courtId: "court-a" });
    const proposed = { ...base, courtId: "court-b" };
    const conflicts = detectLockedMatchModifications([base], [proposed]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("LOCKED_MATCH_MODIFIED");
  });

  it("detecta LOCKED_MATCH_MODIFIED cuando se cambia la fecha", () => {
    const base = makeMatch({ categoryId: "c1", isLocked: true, scheduledDate: "2026-07-05" });
    const proposed = { ...base, scheduledDate: "2026-07-06" };
    const conflicts = detectLockedMatchModifications([base], [proposed]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe("LOCKED_MATCH_MODIFIED");
  });

  it("detecta LOCKED_MATCH_MODIFIED cuando se cambia la hora de inicio", () => {
    const base = makeMatch({ categoryId: "c1", isLocked: true, startTime: "09:00" });
    const proposed = { ...base, startTime: "10:00" };
    const conflicts = detectLockedMatchModifications([base], [proposed]);
    expect(conflicts).toHaveLength(1);
  });

  it("partido no bloqueado puede modificarse sin conflicto", () => {
    const base = makeMatch({ categoryId: "c1", isLocked: false, courtId: "court-a" });
    const proposed = { ...base, courtId: "court-b" };
    expect(detectLockedMatchModifications([base], [proposed])).toHaveLength(0);
  });

  it("partido propuesto sin equivalente en base no genera conflicto", () => {
    const base = makeMatch({ categoryId: "c1", isLocked: true });
    const proposed = makeMatch({ categoryId: "c1", isLocked: false });
    expect(detectLockedMatchModifications([base], [proposed])).toHaveLength(0);
  });

  it("retorna conflictos múltiples cuando varios partidos bloqueados son modificados", () => {
    const base1 = makeMatch({ categoryId: "c1", isLocked: true, courtId: "court-a" });
    const base2 = makeMatch({ categoryId: "c1", isLocked: true, courtId: "court-a" });
    const proposed1 = { ...base1, courtId: "court-b" };
    const proposed2 = { ...base2, scheduledDate: "2026-07-10" };
    const conflicts = detectLockedMatchModifications([base1, base2], [proposed1, proposed2]);
    expect(conflicts).toHaveLength(2);
  });
});

// ─── INTEGRACIÓN: detectores combinados ───────────────────────────────────────

describe("detectores combinados", () => {
  it("misma lista puede tener conflicto de cancha Y de equipo simultáneamente", () => {
    const matches = [
      makeMatch({ categoryId: "c1", courtId: "court-a", homeTeamId: "t1", awayTeamId: "t2", startTime: "09:00", endTime: "10:00" }),
      makeMatch({ categoryId: "c2", courtId: "court-a", homeTeamId: "t1", awayTeamId: "t3", startTime: "09:00", endTime: "10:00" }),
    ];
    const courtConflicts = detectCourtOverlaps(matches);
    const teamConflicts = detectTeamOverlaps(matches);
    expect(courtConflicts.length).toBeGreaterThan(0);
    expect(teamConflicts.length).toBeGreaterThan(0);
  });
});
