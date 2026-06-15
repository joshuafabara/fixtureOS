/**
 * Court time-slot generator tests.
 * Covers: date range generation, day filtering, specific-date rules,
 * unavailability rules, and multi-court generation.
 *
 * Run: npm test -- __tests__/slots.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  generateSlotsForDate,
  generateSlotsForDateRange,
  dayNameToNumber,
  addWeeks,
} from "@/lib/fixture-engine/slots";
import type { AvailabilityRule } from "@/lib/fixture-engine/slots";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

const COURT_A = { id: "court-a", name: "Cancha A" };
const COURT_B = { id: "court-b", name: "Cancha B" };

function saturdayRule(courtId: string, start = "08:00:00", end = "18:00:00"): AvailabilityRule {
  return { courtId, dayOfWeek: 6, specificDate: null, startTime: start, endTime: end, isAvailable: true };
}

function sundayRule(courtId: string, start = "08:00:00", end = "16:00:00"): AvailabilityRule {
  return { courtId, dayOfWeek: 0, specificDate: null, startTime: start, endTime: end, isAvailable: true };
}

function fridayRule(courtId: string, start = "18:00:00", end = "21:00:00"): AvailabilityRule {
  return { courtId, dayOfWeek: 5, specificDate: null, startTime: start, endTime: end, isAvailable: true };
}

function specificDateRule(courtId: string, date: string, available: boolean): AvailabilityRule {
  return { courtId, dayOfWeek: null, specificDate: date, startTime: "08:00:00", endTime: "20:00:00", isAvailable: available };
}

// ─── generateSlotsForDate ─────────────────────────────────────────────────────

describe("generateSlotsForDate — reglas básicas", () => {
  it("genera slots para una cancha con regla de día de semana", () => {
    // 2026-07-04 is a Saturday
    const slots = generateSlotsForDate("2026-07-04", [COURT_A], [saturdayRule(COURT_A.id)], 60);
    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].courtId).toBe(COURT_A.id);
    expect(slots[0].date).toBe("2026-07-04");
  });

  it("no genera slots para un día sin regla aplicable", () => {
    // 2026-07-06 is a Monday — no Monday rule
    const slots = generateSlotsForDate("2026-07-06", [COURT_A], [saturdayRule(COURT_A.id)], 60);
    expect(slots.length).toBe(0);
  });

  it("regla specific-date de disponibilidad tiene precedencia sobre dayOfWeek", () => {
    // Saturday + specific date rule that IS available → use specific rule
    const specificAvail: AvailabilityRule = {
      courtId: COURT_A.id,
      dayOfWeek: null,
      specificDate: "2026-07-04",
      startTime: "10:00:00",
      endTime: "12:00:00",
      isAvailable: true,
    };
    const slots = generateSlotsForDate(
      "2026-07-04",
      [COURT_A],
      [saturdayRule(COURT_A.id), specificAvail],
      60
    );
    // Specific-date rule: 10:00–12:00 = 2 slots of 60 min (10:00, 11:00 → 12:00)
    expect(slots.length).toBe(2);
    expect(slots[0].startTime).toBe("10:00");
  });

  it("Sistema: regla specific-date UNAVAILABLE bloquea la cancha", () => {
    const closureRule: AvailabilityRule = {
      courtId: COURT_A.id,
      dayOfWeek: null,
      specificDate: "2026-07-04",
      startTime: "08:00:00",
      endTime: "20:00:00",
      isAvailable: false,
    };
    const slots = generateSlotsForDate(
      "2026-07-04",
      [COURT_A],
      [saturdayRule(COURT_A.id), closureRule],
      60
    );
    expect(slots.length).toBe(0);
  });

  it("genera slots correctos para múltiples canchas en una fecha", () => {
    const rules = [saturdayRule(COURT_A.id), saturdayRule(COURT_B.id)];
    const slots = generateSlotsForDate("2026-07-04", [COURT_A, COURT_B], rules, 60);
    const courtASlots = slots.filter((s) => s.courtId === COURT_A.id);
    const courtBSlots = slots.filter((s) => s.courtId === COURT_B.id);
    expect(courtASlots.length).toBeGreaterThan(0);
    expect(courtBSlots.length).toBeGreaterThan(0);
    expect(courtASlots.length).toBe(courtBSlots.length);
  });

  it("slots tienen startTime y endTime correctos para duración de 60 min", () => {
    // 08:00-10:00 window = 2 slots of 60 min (08:00-09:00, 09:00-10:00)
    const rule: AvailabilityRule = {
      courtId: COURT_A.id,
      dayOfWeek: 6,
      specificDate: null,
      startTime: "08:00:00",
      endTime: "10:00:00",
      isAvailable: true,
    };
    const slots = generateSlotsForDate("2026-07-04", [COURT_A], [rule], 60);
    expect(slots.length).toBe(2);
    expect(slots[0].startTime).toBe("08:00");
    expect(slots[0].endTime).toBe("09:00");
    expect(slots[1].startTime).toBe("09:00");
    expect(slots[1].endTime).toBe("10:00");
  });
});

// ─── generateSlotsForDateRange ────────────────────────────────────────────────

describe("generateSlotsForDateRange", () => {
  it("Complejo 5: viernes 18:00-21:00 y sábados 08:00-18:00", () => {
    const rules: AvailabilityRule[] = [
      fridayRule(COURT_A.id, "18:00:00", "21:00:00"),
      saturdayRule(COURT_A.id, "08:00:00", "18:00:00"),
    ];
    // 2026-07-03 = Friday, 2026-07-04 = Saturday
    const slots = generateSlotsForDateRange("2026-07-03", "2026-07-05", [COURT_A], rules, 60, [5, 6]);

    const friSlots = slots.filter((s) => s.date === "2026-07-03");
    const satSlots = slots.filter((s) => s.date === "2026-07-04");
    const sunSlots = slots.filter((s) => s.date === "2026-07-05");

    expect(friSlots.length).toBe(3); // 18:00, 19:00, 20:00
    expect(satSlots.length).toBe(10); // 08:00–18:00 = 10 slots
    expect(sunSlots.length).toBe(0); // Sunday not in allowed days
  });

  it("filtro de días de la semana excluye días no permitidos", () => {
    const rules = [saturdayRule(COURT_A.id), sundayRule(COURT_A.id)];
    // Span 7 days: only saturdays and sundays allowed
    const slots = generateSlotsForDateRange("2026-07-01", "2026-07-07", [COURT_A], rules, 60, [6, 0]);

    const dates = [...new Set(slots.map((s) => s.date))];
    for (const d of dates) {
      const dow = new Date(d + "T12:00:00").getDay();
      expect([6, 0]).toContain(dow);
    }
  });

  it("Torneo Ej 1: fechas de blackout bloquean cancha específica", () => {
    const rules: AvailabilityRule[] = [
      saturdayRule(COURT_A.id),
      sundayRule(COURT_A.id),
      // 2026-08-10 and 2026-08-11 are blackout (Monday/Tuesday, but test the concept with specific dates)
      { courtId: COURT_A.id, dayOfWeek: null, specificDate: "2026-07-04", startTime: "08:00:00", endTime: "18:00:00", isAvailable: false },
    ];
    const slots = generateSlotsForDateRange("2026-07-01", "2026-07-07", [COURT_A], rules, 60, [6, 0]);
    const blackoutSlots = slots.filter((s) => s.date === "2026-07-04");
    expect(blackoutSlots.length).toBe(0);
  });

  it("Complejo 6: sábados y domingos 08:00-16:00 en dos canchas", () => {
    const rules: AvailabilityRule[] = [
      saturdayRule(COURT_A.id, "08:00:00", "16:00:00"),
      saturdayRule(COURT_B.id, "08:00:00", "16:00:00"),
      sundayRule(COURT_A.id, "08:00:00", "16:00:00"),
      sundayRule(COURT_B.id, "08:00:00", "16:00:00"),
    ];
    const slots = generateSlotsForDateRange(
      "2026-07-04", "2026-07-05", // Saturday + Sunday
      [COURT_A, COURT_B], rules, 60, [6, 0]
    );
    // 2 courts × 2 days × 8 slots/day (08:00-16:00)
    expect(slots.length).toBe(32);
    for (const s of slots) {
      expect(s.startTime >= "08:00" && s.startTime < "16:00").toBe(true);
    }
  });

  it("sin allowedDaysOfWeek genera slots para todos los días con regla", () => {
    const rules = [saturdayRule(COURT_A.id), sundayRule(COURT_A.id)];
    // No day filter — any day with a rule gets slots
    const slots = generateSlotsForDateRange("2026-07-01", "2026-07-07", [COURT_A], rules, 60);
    const dates = [...new Set(slots.map((s) => s.date))];
    // Expect at least Saturday (6) and Sunday (0) to have slots
    const dows = dates.map((d) => new Date(d + "T12:00:00").getDay());
    expect(dows).toContain(6);
    expect(dows).toContain(0);
  });
});

// ─── SLOT GRID (15 minutos) ───────────────────────────────────────────────────

describe("Slot grid de 15 minutos (para scheduler)", () => {
  it("genera slots en incrementos de 15 minutos", () => {
    const rule: AvailabilityRule = {
      courtId: COURT_A.id,
      dayOfWeek: 6,
      specificDate: null,
      startTime: "08:00:00",
      endTime: "09:00:00",
      isAvailable: true,
    };
    const slots = generateSlotsForDate("2026-07-04", [COURT_A], [rule], 15);
    expect(slots.length).toBe(4); // 08:00, 08:15, 08:30, 08:45
    expect(slots[0].startTime).toBe("08:00");
    expect(slots[1].startTime).toBe("08:15");
    expect(slots[2].startTime).toBe("08:30");
    expect(slots[3].startTime).toBe("08:45");
  });

  it("slot que no cabe entero al final de la ventana no se genera", () => {
    // Window: 08:00-08:50, duration 60 min → no slot fits (60 > 50 remaining)
    const rule: AvailabilityRule = {
      courtId: COURT_A.id,
      dayOfWeek: 6,
      specificDate: null,
      startTime: "08:00:00",
      endTime: "08:50:00",
      isAvailable: true,
    };
    const slots = generateSlotsForDate("2026-07-04", [COURT_A], [rule], 60);
    expect(slots.length).toBe(0);
  });
});

// ─── dayNameToNumber ──────────────────────────────────────────────────────────

describe("dayNameToNumber", () => {
  it.each([
    ["sunday", 0],
    ["monday", 1],
    ["tuesday", 2],
    ["wednesday", 3],
    ["thursday", 4],
    ["friday", 5],
    ["saturday", 6],
  ])("%s → %i", (day, expected) => {
    expect(dayNameToNumber(day)).toBe(expected);
  });

  it("retorna -1 para día inválido", () => {
    expect(dayNameToNumber("lunes")).toBe(-1);
  });
});

// ─── addWeeks ─────────────────────────────────────────────────────────────────

describe("addWeeks", () => {
  it("suma 1 semana correctamente", () => {
    expect(addWeeks("2026-07-01", 1)).toBe("2026-07-08");
  });

  it("suma 10 semanas correctamente", () => {
    expect(addWeeks("2026-07-01", 10)).toBe("2026-09-09");
  });

  it("suma 0 semanas retorna la misma fecha", () => {
    expect(addWeeks("2026-07-01", 0)).toBe("2026-07-01");
  });
});
