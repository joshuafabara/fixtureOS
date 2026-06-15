/**
 * Scheduler constraint enforcement tests.
 * Validates every hard constraint the scheduler must respect:
 *   - Category startDate
 *   - Time restrictions (afterTime / beforeTime per team)
 *   - minDaysBetweenMatches
 *   - Court occupancy (no double-booking)
 *   - Team occupancy (one match per team per day)
 *   - Match duration recorded correctly
 *   - Priority ordering between categories
 *
 * Run: npm test -- __tests__/scheduler.test.ts
 */

import { describe, it, expect } from "vitest";
import { scheduleMatches } from "@/lib/fixture-engine/scheduler";
import type { SchedulerCategory, SchedulerTeam, TeamTimeConstraint } from "@/lib/fixture-engine/scheduler";
import type { TimeSlot } from "@/lib/fixture-engine/slots";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function toMin(t: string): number {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
}

function fromMin(m: number): string {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

/**
 * Generates 15-minute grid slots for given courts, dates and hour range.
 * Scheduler uses a 15-minute grid internally.
 */
function buildSlots(
  dates: string[],
  courts: { id: string; name: string }[],
  startHour = 8,
  endHour = 22
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (const date of dates) {
    for (const court of courts) {
      for (let h = startHour; h < endHour; h++) {
        for (let m = 0; m < 60; m += 15) {
          const startTime = fromMin(h * 60 + m);
          const endTime = fromMin(h * 60 + m + 15);
          slots.push({ date, courtId: court.id, courtName: court.name, startTime, endTime });
        }
      }
    }
  }
  return slots;
}

function makeDates(startISO: string, count: number): string[] {
  const dates: string[] = [];
  const d = new Date(startISO + "T12:00:00");
  for (let i = 0; i < count; i++) {
    dates.push(d.toISOString().slice(0, 10));
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

function makeTeams(ids: string[], clubId = "club-a"): SchedulerTeam[] {
  return ids.map((id) => ({ id, clubId }));
}

function makeCategory(overrides: Partial<SchedulerCategory> & { id: string; teams: SchedulerTeam[] }): SchedulerCategory {
  return {
    name: overrides.id,
    startDate: "2026-07-01",
    gameModeType: "single_round_robin",
    matchDurationMinutes: 60,
    ...overrides,
  };
}

const COURT_A = { id: "court-a", name: "Cancha A" };
const COURT_B = { id: "court-b", name: "Cancha B" };

// ─── CATEGORY START DATE ──────────────────────────────────────────────────────

describe("Restricción: category.startDate", () => {
  it("no programa partidos antes del startDate", () => {
    const cat = makeCategory({
      id: "cat1",
      teams: makeTeams(["t1", "t2"]),
      startDate: "2026-07-10",
    });
    // Slots span before and after the start date
    const slots = buildSlots(makeDates("2026-07-05", 10), [COURT_A]);
    const { matches } = scheduleMatches([cat], slots);

    for (const m of matches) {
      expect(m.date >= "2026-07-10").toBe(true);
    }
  });

  it("programa partidos el mismo día del startDate", () => {
    const cat = makeCategory({
      id: "cat1",
      teams: makeTeams(["t1", "t2"]),
      startDate: "2026-07-05",
    });
    const slots = buildSlots(["2026-07-05"], [COURT_A]);
    const { matches } = scheduleMatches([cat], slots);
    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0].date).toBe("2026-07-05");
  });
});

// ─── TIME RESTRICTIONS — afterTime ────────────────────────────────────────────

describe("Restricción: teamTimeConstraints.afterTime", () => {
  it("Sistema Ej / Complejo 3: equipo Crossover no juega antes de las 13:00", () => {
    const teams = makeTeams(["crossover", "rival"]);
    const cat = makeCategory({
      id: "cat-crossover",
      teams,
      teamTimeConstraints: [{ teamId: "crossover", afterTime: "13:00" }],
    });
    const slots = buildSlots(makeDates("2026-07-05", 7), [COURT_A], 8, 20);
    const { matches } = scheduleMatches([cat], slots);

    for (const m of matches) {
      if (m.homeTeamId === "crossover" || m.awayTeamId === "crossover") {
        expect(m.startTime >= "13:00").toBe(true);
      }
    }
    expect(matches.length).toBeGreaterThan(0);
  });

  it("Fecha Ej 1: Blue Devils solo después de las 18:00", () => {
    const teams = makeTeams(["blue-devils", "rival"]);
    const cat = makeCategory({
      id: "cat-bd",
      teams,
      teamTimeConstraints: [{ teamId: "blue-devils", afterTime: "18:00" }],
    });
    const slots = buildSlots(makeDates("2026-07-05", 7), [COURT_A], 8, 22);
    const { matches } = scheduleMatches([cat], slots);

    for (const m of matches) {
      if (m.homeTeamId === "blue-devils" || m.awayTeamId === "blue-devils") {
        expect(m.startTime >= "18:00").toBe(true);
      }
    }
    expect(matches.length).toBeGreaterThan(0);
  });

  it("Complejo 8: Programar Blue Devils desde las 19:00 en adelante", () => {
    const teams = makeTeams(["blue-devils", "rival"]);
    const cat = makeCategory({
      id: "cat-bd2",
      teams,
      teamTimeConstraints: [{ teamId: "blue-devils", afterTime: "19:00" }],
    });
    const slots = buildSlots(makeDates("2026-07-05", 7), [COURT_A], 8, 22);
    const { matches } = scheduleMatches([cat], slots);

    for (const m of matches) {
      if (m.homeTeamId === "blue-devils" || m.awayTeamId === "blue-devils") {
        expect(m.startTime >= "19:00").toBe(true);
      }
    }
  });

  it("sin slots después de afterTime → partidos quedan sin programar", () => {
    const teams = makeTeams(["late-team", "rival"]);
    const cat = makeCategory({
      id: "cat-late",
      teams,
      teamTimeConstraints: [{ teamId: "late-team", afterTime: "22:00" }],
    });
    // Only slots up to 20:00
    const slots = buildSlots(["2026-07-05"], [COURT_A], 8, 20);
    const { matches, unscheduledPairs } = scheduleMatches([cat], slots);
    expect(matches.length).toBe(0);
    expect(unscheduledPairs.length).toBeGreaterThan(0);
  });

  it("múltiples equipos con afterTime diferentes", () => {
    const teams = makeTeams(["t1", "t2", "t3"]);
    const cat = makeCategory({
      id: "cat-multi",
      teams,
      teamTimeConstraints: [
        { teamId: "t1", afterTime: "13:00" },
        { teamId: "t2", afterTime: "15:00" },
      ],
    });
    const slots = buildSlots(makeDates("2026-07-05", 14), [COURT_A], 8, 20);
    const { matches } = scheduleMatches([cat], slots);

    for (const m of matches) {
      if (m.homeTeamId === "t1" || m.awayTeamId === "t1") {
        expect(m.startTime >= "13:00").toBe(true);
      }
      if (m.homeTeamId === "t2" || m.awayTeamId === "t2") {
        expect(m.startTime >= "15:00").toBe(true);
      }
    }
  });
});

// ─── TIME RESTRICTIONS — beforeTime ───────────────────────────────────────────

describe("Restricción: teamTimeConstraints.beforeTime", () => {
  it("Fecha Ej 4: Crossover U17 Masculino debe jugar antes de las 12:00", () => {
    const teams = makeTeams(["crossover-u17", "rival"]);
    const cat = makeCategory({
      id: "cat-crossover-u17",
      teams,
      teamTimeConstraints: [{ teamId: "crossover-u17", beforeTime: "12:00" }],
    });
    const slots = buildSlots(makeDates("2026-07-05", 7), [COURT_A], 8, 20);
    const { matches } = scheduleMatches([cat], slots);

    for (const m of matches) {
      if (m.homeTeamId === "crossover-u17" || m.awayTeamId === "crossover-u17") {
        expect(m.startTime < "12:00").toBe(true);
      }
    }
    expect(matches.length).toBeGreaterThan(0);
  });

  it("sin slots antes de beforeTime → partidos sin programar", () => {
    const teams = makeTeams(["early-team", "rival"]);
    const cat = makeCategory({
      id: "cat-early",
      teams,
      teamTimeConstraints: [{ teamId: "early-team", beforeTime: "09:00" }],
    });
    // Only slots from 10:00 onwards
    const slots = buildSlots(["2026-07-05"], [COURT_A], 10, 20);
    const { unscheduledPairs } = scheduleMatches([cat], slots);
    expect(unscheduledPairs.length).toBeGreaterThan(0);
  });

  it("afterTime y beforeTime combinados crean ventana estrecha", () => {
    const teams = makeTeams(["window-team", "rival"]);
    const cat = makeCategory({
      id: "cat-window",
      teams,
      teamTimeConstraints: [{ teamId: "window-team", afterTime: "10:00", beforeTime: "12:00" }],
    });
    const slots = buildSlots(makeDates("2026-07-05", 7), [COURT_A], 8, 18);
    const { matches } = scheduleMatches([cat], slots);

    for (const m of matches) {
      if (m.homeTeamId === "window-team" || m.awayTeamId === "window-team") {
        expect(m.startTime >= "10:00").toBe(true);
        expect(m.startTime < "12:00").toBe(true);
      }
    }
  });
});

// ─── MIN DAYS BETWEEN MATCHES ─────────────────────────────────────────────────

describe("Restricción: minDaysBetweenMatches", () => {
  it("Complejo 4: un partido cada 6 días — mismo equipo no juega en menos de 6 días", () => {
    // 4 teams → 6 matches (round robin); each team plays 3 times
    const teams = makeTeams(["t1", "t2", "t3", "t4"]);
    const cat = makeCategory({
      id: "cat-rest6",
      teams,
      minDaysBetweenMatches: 6,
    });
    // Provide 30 days of slots
    const slots = buildSlots(makeDates("2026-07-01", 30), [COURT_A], 8, 20);
    const { matches } = scheduleMatches([cat], slots);

    // Build last-played date per team and verify gap
    const lastPlayed = new Map<string, string>();
    for (const m of matches.sort((a, b) => a.date.localeCompare(b.date))) {
      for (const teamId of [m.homeTeamId, m.awayTeamId]) {
        const prev = lastPlayed.get(teamId);
        if (prev) {
          const gap = (new Date(m.date).getTime() - new Date(prev).getTime()) / (1000 * 60 * 60 * 24);
          expect(gap).toBeGreaterThanOrEqual(6);
        }
        lastPlayed.set(teamId, m.date);
      }
    }
  });

  it("Avanzado 2: sin descanso (minDaysBetweenMatches=0) → todos los partidos programados", () => {
    const teams = makeTeams(["t1", "t2"]);
    const cat = makeCategory({
      id: "cat-norest",
      teams,
      minDaysBetweenMatches: 0,
    });
    const slots = buildSlots(["2026-07-01"], [COURT_A], 8, 20);
    const { matches } = scheduleMatches([cat], slots);
    expect(matches.length).toBe(1); // 2 teams = 1 match
  });
});

// ─── COURT OCCUPANCY ─────────────────────────────────────────────────────────

describe("Restricción: no double-booking de cancha", () => {
  it("mismo horario en la misma cancha → solo un partido programado", () => {
    // 3 teams → 3 matches, only 1 court slot available (exactly 60 min on 1 day)
    const teams = makeTeams(["t1", "t2", "t3"]);
    const cat = makeCategory({ id: "cat1", teams });
    // Single 60-minute window: 4 consecutive 15-min slots (08:00–09:00)
    const singleDaySlots = buildSlots(["2026-07-01"], [COURT_A], 8, 9);
    const { matches } = scheduleMatches([cat], singleDaySlots);
    // Only 1 match fits in the 60-min window
    expect(matches.length).toBe(1);
  });

  it("dos canchas → el doble de partidos simultáneos posibles", () => {
    const teams = makeTeams(["t1", "t2", "t3", "t4"]);
    const cat = makeCategory({ id: "cat1", teams });
    // 1 hour of slots on 2 courts on 1 day
    const slots = buildSlots(["2026-07-01"], [COURT_A, COURT_B], 8, 9);
    const { matches } = scheduleMatches([cat], slots);
    // 2 courts × 1 time window = max 2 matches in 1 hour
    expect(matches.length).toBeGreaterThanOrEqual(2);
  });

  it("no produce solapamientos de cancha", () => {
    const teams = makeTeams(["t1", "t2", "t3", "t4", "t5", "t6"]);
    const cat = makeCategory({ id: "cat1", teams, matchDurationMinutes: 60 });
    const slots = buildSlots(makeDates("2026-07-01", 7), [COURT_A, COURT_B], 8, 22);
    const { matches } = scheduleMatches([cat], slots);

    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const a = matches[i];
        const b = matches[j];
        if (a.courtId === b.courtId && a.date === b.date) {
          // They must not overlap: a ends before b starts, or b ends before a starts
          const aEnd = toMin(a.startTime) + (a.matchDurationMinutes ?? 60);
          const bStart = toMin(b.startTime);
          const bEnd = toMin(b.startTime) + (b.matchDurationMinutes ?? 60);
          const aStart = toMin(a.startTime);
          const overlap = aStart < bEnd && bStart < aEnd;
          expect(overlap).toBe(false);
        }
      }
    }
  });
});

// ─── TEAM OCCUPANCY ───────────────────────────────────────────────────────────

describe("Restricción: un equipo juega máximo una vez por día", () => {
  it("Sistema Ej 5: mismo equipo no aparece en dos partidos el mismo día", () => {
    const teams = makeTeams(["t1", "t2", "t3"]);
    const cat = makeCategory({ id: "cat1", teams });
    const slots = buildSlots(makeDates("2026-07-01", 14), [COURT_A, COURT_B], 8, 20);
    const { matches } = scheduleMatches([cat], slots);

    const teamDateMap = new Map<string, Set<string>>();
    for (const m of matches) {
      for (const teamId of [m.homeTeamId, m.awayTeamId]) {
        if (!teamDateMap.has(teamId)) teamDateMap.set(teamId, new Set());
        const dates = teamDateMap.get(teamId)!;
        expect(dates.has(m.date)).toBe(false); // no duplicate date for same team
        dates.add(m.date);
      }
    }
  });
});

// ─── MATCH DURATION ───────────────────────────────────────────────────────────

describe("Duración de partido en resultado", () => {
  it("endTime = startTime + matchDurationMinutes (60 min)", () => {
    const cat = makeCategory({
      id: "cat1",
      teams: makeTeams(["t1", "t2"]),
      matchDurationMinutes: 60,
    });
    const slots = buildSlots(["2026-07-01"], [COURT_A], 8, 20);
    const { matches } = scheduleMatches([cat], slots);
    expect(matches.length).toBe(1);
    const m = matches[0];
    expect(toMin(m.endTime) - toMin(m.startTime)).toBe(60);
  });

  it("Complejo 2: duración 75 minutos — endTime correcto", () => {
    const cat = makeCategory({
      id: "cat-75",
      teams: makeTeams(["t1", "t2"]),
      matchDurationMinutes: 75,
    });
    const slots = buildSlots(["2026-07-01"], [COURT_A], 8, 20);
    const { matches } = scheduleMatches([cat], slots);
    expect(matches.length).toBe(1);
    expect(toMin(matches[0].endTime) - toMin(matches[0].startTime)).toBe(75);
  });

  it("Complejo 2: duración 90 minutos — endTime correcto", () => {
    const cat = makeCategory({
      id: "cat-90",
      teams: makeTeams(["t1", "t2"]),
      matchDurationMinutes: 90,
    });
    const slots = buildSlots(makeDates("2026-07-01", 3), [COURT_A], 8, 20);
    const { matches } = scheduleMatches([cat], slots);
    expect(matches.length).toBe(1);
    expect(toMin(matches[0].endTime) - toMin(matches[0].startTime)).toBe(90);
  });

  it("75-min match no solapa con siguiente partido en la misma cancha 60 min después", () => {
    // 4 teams on 1 court, 75-min matches — verify no overlap
    const teams = makeTeams(["t1", "t2", "t3", "t4"]);
    const cat = makeCategory({ id: "cat-75no", teams, matchDurationMinutes: 75 });
    const slots = buildSlots(makeDates("2026-07-01", 10), [COURT_A], 8, 22);
    const { matches } = scheduleMatches([cat], slots);

    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const a = matches[i];
        const b = matches[j];
        if (a.courtId === b.courtId && a.date === b.date) {
          const overlap =
            toMin(a.startTime) < toMin(b.endTime) &&
            toMin(b.startTime) < toMin(a.endTime);
          expect(overlap).toBe(false);
        }
      }
    }
  });
});

// ─── PRIORITY ────────────────────────────────────────────────────────────────

describe("Restricción: priority ordering", () => {
  it("categoría con priority mayor se programa primero (consigue más partidos)", () => {
    const teamsA = makeTeams(["a1", "a2", "a3", "a4"]); // 6 matches
    const teamsB = makeTeams(["b1", "b2", "b3", "b4"]); // 6 matches
    const catHigh = makeCategory({ id: "cat-high", teams: teamsA, priority: 10 });
    const catLow = makeCategory({ id: "cat-low", teams: teamsB, priority: 1 });

    // Severely limited slots: only room for ~6 matches total
    const slots = buildSlots(makeDates("2026-07-01", 3), [COURT_A], 8, 14); // 3 days × 6h × 4 slots = 72 grid slots
    const { matches } = scheduleMatches([catHigh, catLow], slots);

    const highCount = matches.filter((m) => m.categoryId === "cat-high").length;
    const lowCount = matches.filter((m) => m.categoryId === "cat-low").length;
    expect(highCount).toBeGreaterThanOrEqual(lowCount);
  });
});

// ─── CLUB GROUPING ────────────────────────────────────────────────────────────

describe("Soft constraint: clubGrouping", () => {
  it("todos los partidos quedan programados incluso con club grouping activo", () => {
    // 4 teams: 2 clubs of 2
    const teams: SchedulerTeam[] = [
      { id: "t1", clubId: "club-x" },
      { id: "t2", clubId: "club-x" },
      { id: "t3", clubId: "club-y" },
      { id: "t4", clubId: "club-y" },
    ];
    const cat = makeCategory({ id: "cat-club", teams });
    const slots = buildSlots(makeDates("2026-07-01", 14), [COURT_A, COURT_B], 8, 20);
    const { matches, unscheduledPairs } = scheduleMatches([cat], slots, { clubGrouping: true });

    // With enough slots, all 6 matches should be scheduled
    expect(matches.length + unscheduledPairs.length).toBe(6);
    expect(matches.length).toBe(6);
  });
});

// ─── ROUND ROBIN COMPLETENESS ─────────────────────────────────────────────────

describe("Completitud del round robin", () => {
  it("4 equipos → 6 partidos únicos (todos contra todos)", () => {
    const teams = makeTeams(["t1", "t2", "t3", "t4"]);
    const cat = makeCategory({ id: "cat1", teams });
    const slots = buildSlots(makeDates("2026-07-01", 14), [COURT_A, COURT_B], 8, 22);
    const { matches } = scheduleMatches([cat], slots);

    // Verify each pair appears exactly once
    const pairs = new Set<string>();
    for (const m of matches) {
      const key = [m.homeTeamId, m.awayTeamId].sort().join("|");
      expect(pairs.has(key)).toBe(false); // no duplicate match
      pairs.add(key);
    }
    expect(matches.length).toBe(6);
  });

  it("6 equipos → 15 partidos únicos", () => {
    const teams = makeTeams(["t1", "t2", "t3", "t4", "t5", "t6"]);
    const cat = makeCategory({ id: "cat1", teams });
    const slots = buildSlots(makeDates("2026-07-01", 30), [COURT_A, COURT_B], 8, 22);
    const { matches } = scheduleMatches([cat], slots);
    expect(matches.length).toBe(15);
  });

  it("double round robin → 2× los partidos del simple", () => {
    const teams = makeTeams(["t1", "t2", "t3", "t4"]);
    const catSimple = makeCategory({ id: "simple", teams, gameModeType: "single_round_robin" });
    const catDouble = makeCategory({ id: "double", teams: [...teams], gameModeType: "double_round_robin" });
    const slots = buildSlots(makeDates("2026-07-01", 60), [COURT_A, COURT_B], 8, 22);

    const resSimple = scheduleMatches([catSimple], [...slots]);
    const resDouble = scheduleMatches([catDouble], [...slots]);
    expect(resDouble.matches.length).toBe(resSimple.matches.length * 2);
  });

  it("categoría con menos de 2 equipos emite warning y no programa partidos", () => {
    const cat = makeCategory({ id: "cat1", teams: makeTeams(["lonely"]) });
    const slots = buildSlots(["2026-07-01"], [COURT_A]);
    const { matches, warnings } = scheduleMatches([cat], slots);
    expect(matches.length).toBe(0);
    expect(warnings.some((w) => w.categoryId === "cat1")).toBe(true);
  });
});

// ─── INSUFFICIENT SLOTS WARNING ───────────────────────────────────────────────

describe("Warning: slots insuficientes", () => {
  it("emite warning cuando no hay slots para todos los partidos", () => {
    const teams = makeTeams(["t1", "t2", "t3"]); // 3 matches
    const cat = makeCategory({ id: "cat1", teams });
    // Only 1 slot → 1 match fits, 2 unscheduled
    const slots = buildSlots(["2026-07-01"], [COURT_A], 8, 9); // 60 min
    const { matches, warnings, unscheduledPairs } = scheduleMatches([cat], slots);

    expect(matches.length).toBe(1);
    expect(unscheduledPairs.length).toBe(2);
    expect(warnings.some((w) => w.type === "insufficient_slots")).toBe(true);
  });
});

// ─── CONCURRENT CATEGORIES ────────────────────────────────────────────────────

describe("Múltiples categorías: no solapes entre categorías", () => {
  it("Torneo Ej 5: mismo equipo no aparece en dos categorías al mismo tiempo", () => {
    // "team-shared" appears in both categories
    const teamsA: SchedulerTeam[] = [{ id: "shared", clubId: "club-a" }, { id: "t2", clubId: "club-b" }];
    const teamsB: SchedulerTeam[] = [{ id: "shared", clubId: "club-a" }, { id: "t3", clubId: "club-c" }];
    const catA = makeCategory({ id: "catA", teams: teamsA });
    const catB = makeCategory({ id: "catB", teams: teamsB });

    const slots = buildSlots(makeDates("2026-07-01", 14), [COURT_A, COURT_B], 8, 20);
    const { matches } = scheduleMatches([catA, catB], slots);

    for (let i = 0; i < matches.length; i++) {
      for (let j = i + 1; j < matches.length; j++) {
        const a = matches[i];
        const b = matches[j];
        if (a.date !== b.date) continue;
        const teamsA2 = [a.homeTeamId, a.awayTeamId];
        const teamsB2 = [b.homeTeamId, b.awayTeamId];
        const shared = teamsA2.filter((t) => teamsB2.includes(t));
        if (shared.length > 0) {
          // Shared team must not overlap in time
          const overlap =
            toMin(a.startTime) < toMin(b.endTime) &&
            toMin(b.startTime) < toMin(a.endTime);
          expect(overlap).toBe(false);
        }
      }
    }
  });
});
