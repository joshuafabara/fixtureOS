/**
 * Category eligibility validation tests.
 * Covers: required fields, team count thresholds, active flag,
 * and batch validation across multiple categories.
 *
 * Run: npm test -- __tests__/eligibility.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  validateCategoryEligibility,
  validateAllCategories,
} from "@/lib/fixture-engine/eligibility";
import type { CategoryInput } from "@/lib/fixture-engine/eligibility";

// ─── HELPERS ──────────────────────────────────────────────────────────────────

function makeCategory(overrides: Partial<CategoryInput> = {}): CategoryInput {
  return {
    id: "cat-1",
    name: "U17 Masculino",
    startDate: "2026-07-05",
    gameModeId: "gm-1",
    isActiveForFixture: true,
    teamCount: 4,
    ...overrides,
  };
}

// ─── validateCategoryEligibility ─────────────────────────────────────────────

describe("validateCategoryEligibility — categoría elegible", () => {
  it("retorna eligible=true cuando todos los campos están presentes y ≥2 equipos", () => {
    const result = validateCategoryEligibility(makeCategory());
    expect(result.eligible).toBe(true);
    expect(result.reasons).toHaveLength(0);
  });

  it("resultado incluye el categoryId correcto", () => {
    const result = validateCategoryEligibility(makeCategory({ id: "cat-abc" }));
    expect(result.categoryId).toBe("cat-abc");
  });

  it("resultado incluye el nombre de categoría correcto", () => {
    const result = validateCategoryEligibility(makeCategory({ name: "U15 Femenino" }));
    expect(result.categoryName).toBe("U15 Femenino");
  });
});

describe("validateCategoryEligibility — falta startDate", () => {
  it("retorna eligible=false si startDate es null", () => {
    const result = validateCategoryEligibility(makeCategory({ startDate: null }));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Falta fecha de inicio");
  });
});

describe("validateCategoryEligibility — falta gameModeId", () => {
  it("retorna eligible=false si gameModeId es null", () => {
    const result = validateCategoryEligibility(makeCategory({ gameModeId: null }));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Falta modo de juego");
  });
});

describe("validateCategoryEligibility — equipos insuficientes", () => {
  it("retorna eligible=false con 0 equipos", () => {
    const result = validateCategoryEligibility(makeCategory({ teamCount: 0 }));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Se necesitan al menos 2 equipos");
  });

  it("retorna eligible=false con 1 equipo", () => {
    const result = validateCategoryEligibility(makeCategory({ teamCount: 1 }));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toContain("Se necesitan al menos 2 equipos");
  });

  it("retorna eligible=true con exactamente 2 equipos", () => {
    const result = validateCategoryEligibility(makeCategory({ teamCount: 2 }));
    expect(result.eligible).toBe(true);
  });

  it("retorna eligible=true con 10 equipos", () => {
    const result = validateCategoryEligibility(makeCategory({ teamCount: 10 }));
    expect(result.eligible).toBe(true);
  });
});

describe("validateCategoryEligibility — múltiples razones", () => {
  it("reporta todas las razones de inelegibilidad simultáneamente", () => {
    const result = validateCategoryEligibility(makeCategory({
      startDate: null,
      gameModeId: null,
      teamCount: 0,
    }));
    expect(result.eligible).toBe(false);
    expect(result.reasons).toHaveLength(3);
    expect(result.reasons).toContain("Falta fecha de inicio");
    expect(result.reasons).toContain("Falta modo de juego");
    expect(result.reasons).toContain("Se necesitan al menos 2 equipos");
  });

  it("solo reporta razones aplicables (no agrega razones falsas)", () => {
    const result = validateCategoryEligibility(makeCategory({ startDate: null }));
    expect(result.reasons).toHaveLength(1);
    expect(result.reasons).toContain("Falta fecha de inicio");
    expect(result.reasons).not.toContain("Falta modo de juego");
  });
});

// ─── validateAllCategories ────────────────────────────────────────────────────

describe("validateAllCategories", () => {
  it("retorna un resultado por categoría", () => {
    const cats = [
      makeCategory({ id: "cat-1" }),
      makeCategory({ id: "cat-2", startDate: null }),
      makeCategory({ id: "cat-3", gameModeId: null, teamCount: 1 }),
    ];
    const results = validateAllCategories(cats);
    expect(results).toHaveLength(3);
  });

  it("mezcla de elegibles e inelegibles — cada una tiene el resultado correcto", () => {
    const cats = [
      makeCategory({ id: "eligible-1" }),
      makeCategory({ id: "no-date", startDate: null }),
      makeCategory({ id: "eligible-2", teamCount: 6 }),
      makeCategory({ id: "no-teams", teamCount: 0 }),
    ];
    const results = validateAllCategories(cats);
    const byId = Object.fromEntries(results.map((r) => [r.categoryId, r]));

    expect(byId["eligible-1"].eligible).toBe(true);
    expect(byId["no-date"].eligible).toBe(false);
    expect(byId["eligible-2"].eligible).toBe(true);
    expect(byId["no-teams"].eligible).toBe(false);
  });

  it("retorna array vacío para input vacío", () => {
    expect(validateAllCategories([])).toHaveLength(0);
  });

  it("categorías inactivas (isActiveForFixture=false) no son filtradas por la función de validación", () => {
    // The eligibility function validates data requirements, not active status.
    // Active-status filtering happens at the generator level.
    const cat = makeCategory({ isActiveForFixture: false });
    const result = validateCategoryEligibility(cat);
    expect(result.eligible).toBe(true); // still eligible by data requirements
  });
});

// ─── Casos reales del documento ───────────────────────────────────────────────

describe("Escenarios de elegibilidad del documento", () => {
  it("Complejo 1: fecha 2026-07-05, 6 equipos con modo de juego → elegible", () => {
    const result = validateCategoryEligibility(makeCategory({
      startDate: "2026-07-05",
      teamCount: 6,
    }));
    expect(result.eligible).toBe(true);
  });

  it("Avanzado 5: categoría con < 6 equipos — sigue siendo elegible (el formato lo maneja el motor)", () => {
    // The eligibility check doesn't know about the "minimum 6 teams for group format" rule.
    // That's a business rule handled upstream when choosing the game mode type.
    const result = validateCategoryEligibility(makeCategory({ teamCount: 4 }));
    expect(result.eligible).toBe(true);
  });

  it("categoría sin startDate → inelegible (emite razón clara)", () => {
    const result = validateCategoryEligibility(makeCategory({
      id: "cat-sin-fecha",
      name: "U12 Mixta",
      startDate: null,
    }));
    expect(result.eligible).toBe(false);
    expect(result.reasons.some((r) => r.toLowerCase().includes("fecha"))).toBe(true);
  });
});
