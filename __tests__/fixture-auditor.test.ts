/**
 * AI Fixture Auditor unit tests.
 * Tests the mock auditor (deterministic fallback) directly — no API key required.
 *
 * Run: npm test -- __tests__/fixture-auditor.test.ts
 */

import { describe, it, expect } from "vitest";
import {
  mockAuditFixture,
  canApproveWithAudit,
  type AuditInput,
  type ProposedMatch,
  type LockedMatch,
  type AuditReport,
} from "@/lib/ai/fixture-auditor";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeInput(overrides: Partial<AuditInput> = {}): AuditInput {
  return {
    organizationContextPrompt: "",
    tournamentContextPrompt: "",
    categoryContextPrompts: [],
    dateContextPrompts: [],
    parsedConstraints: {},
    constraintHierarchy: ["locked_match", "manual_override", "date", "category", "tournament", "organization"],
    proposedMatches: [],
    teamNames: {},
    lockedMatches: [],
    manualOverrides: [],
    dryRunChanges: [],
    ...overrides,
  };
}

function makeMatch(overrides: Partial<ProposedMatch> = {}): ProposedMatch {
  return {
    id: "match-1",
    categoryId: "cat-1",
    homeTeamId: "team-home",
    awayTeamId: "team-away",
    scheduledDate: "2026-07-05",
    startTime: "10:00",
    endTime: "11:00",
    courtId: "court-1",
    courtName: "Cancha A",
    phase: "regular",
    ...overrides,
  };
}

// ─── Test 1: Wrong bracket (bye seeds flagged as missing interpretation) ───────

describe("Auditor — Caso 1: llaves de torneo con byes", () => {
  it("agrega missing_interpretation cuando hay byeSeeds en parsedConstraints", () => {
    const input = makeInput({
      parsedConstraints: {
        gameMode: {
          type: "single_elimination",
          byeSeeds: [1, 2],
          bracketRounds: { quarterfinal: ["3 vs 6", "4 vs 5"] },
        },
      },
      // Fixture has seeds 1 and 2 playing quarterfinals (wrong — they should have byes)
      proposedMatches: [
        makeMatch({ id: "m-qf-1", phase: "quarterfinal", homeTeamId: "team-seed-1", awayTeamId: "team-seed-4" }),
        makeMatch({ id: "m-qf-2", phase: "quarterfinal", homeTeamId: "team-seed-2", awayTeamId: "team-seed-3" }),
      ],
      teamNames: {
        "team-seed-1": "Real Madrid Sub-17",
        "team-seed-2": "Barcelona Sub-17",
        "team-seed-4": "Atletico Sub-17",
        "team-seed-3": "Valencia Sub-17",
      },
    });

    const report = mockAuditFixture(input);

    expect(report.missing_interpretations.length).toBeGreaterThan(0);
    const byeInterpretation = report.missing_interpretations.find(
      (m) => m.prompt_excerpt.toLowerCase().includes("bye") || m.issue_es.toLowerCase().includes("bye")
    );
    expect(byeInterpretation).toBeDefined();
    expect(byeInterpretation?.suggested_question_es).toBeTruthy();
  });

  it("el status no es fail por ambigüedad de bracket (solo missing_interpretation)", () => {
    const input = makeInput({
      parsedConstraints: {
        gameMode: { type: "single_elimination", byeSeeds: [1, 2] },
      },
      proposedMatches: [makeMatch({ phase: "quarterfinal" })],
    });

    const report = mockAuditFixture(input);
    // byeSeeds alone causes missing_interpretation but not a hard error
    const byeViolation = report.violations.find((v) => v.type === "bad_game_mode");
    expect(byeViolation).toBeUndefined();
    expect(report.missing_interpretations.length).toBeGreaterThan(0);
  });
});

// ─── Test 2: Locked match changed ─────────────────────────────────────────────

describe("Auditor — Caso 2: partido bloqueado modificado", () => {
  it("detecta cuando un partido bloqueado cambia de cancha", () => {
    const locked: LockedMatch = {
      id: "match-locked-1",
      courtId: "court-A",
      scheduledDate: "2026-07-05",
      startTime: "10:00",
    };
    const proposed = makeMatch({
      id: "match-locked-1",
      courtId: "court-B", // changed!
      scheduledDate: "2026-07-05",
      startTime: "10:00",
    });

    const input = makeInput({
      lockedMatches: [locked],
      proposedMatches: [proposed],
    });

    const report = mockAuditFixture(input);

    const violation = report.violations.find((v) => v.type === "locked_match_changed");
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe("error");
    expect(violation?.affected_match_ids).toContain("match-locked-1");
  });

  it("detecta cuando un partido bloqueado cambia de fecha", () => {
    const locked: LockedMatch = {
      id: "match-locked-2",
      courtId: "court-A",
      scheduledDate: "2026-07-05",
      startTime: "14:00",
    };
    const proposed = makeMatch({
      id: "match-locked-2",
      courtId: "court-A",
      scheduledDate: "2026-07-06", // changed!
      startTime: "14:00",
    });

    const input = makeInput({
      lockedMatches: [locked],
      proposedMatches: [proposed],
    });

    const report = mockAuditFixture(input);
    const violation = report.violations.find((v) => v.type === "locked_match_changed");
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe("error");
    expect(report.status).toBe("fail");
  });

  it("NO detecta violación si el partido bloqueado no fue modificado", () => {
    const locked: LockedMatch = {
      id: "match-locked-3",
      courtId: "court-A",
      scheduledDate: "2026-07-05",
      startTime: "10:00",
    };
    const proposed = makeMatch({
      id: "match-locked-3",
      courtId: "court-A",
      scheduledDate: "2026-07-05",
      startTime: "10:00",
    });

    const input = makeInput({
      lockedMatches: [locked],
      proposedMatches: [proposed],
    });

    const report = mockAuditFixture(input);
    const violation = report.violations.find((v) => v.type === "locked_match_changed");
    expect(violation).toBeUndefined();
    const lockedConstraint = report.approved_constraints.find((c) => c.constraint_id === "locked_matches");
    expect(lockedConstraint?.status).toBe("satisfied");
  });

  it("resultado es fail con machine_recommendation.action=none para partidos bloqueados", () => {
    const locked: LockedMatch = {
      id: "match-locked-4",
      courtId: "court-A",
      scheduledDate: "2026-07-05",
      startTime: "09:00",
    };

    const input = makeInput({
      lockedMatches: [locked],
      proposedMatches: [makeMatch({ id: "match-locked-4", courtId: "court-B", scheduledDate: "2026-07-05", startTime: "09:00" })],
    });

    const report = mockAuditFixture(input);
    const violation = report.violations.find((v) => v.type === "locked_match_changed");
    expect(violation?.machine_recommendation.action).toBe("none");
  });
});

// ─── Test 3: Time restriction — Crossover before 13:00 ────────────────────────

describe("Auditor — Caso 3: restricción de horario (afterTime)", () => {
  it("detecta partido Crossover programado antes de las 13:00", () => {
    const input = makeInput({
      parsedConstraints: {
        timeRestrictions: [{ target: "Crossover", afterTime: "13:00" }],
      },
      proposedMatches: [
        makeMatch({
          id: "crossover-match",
          homeTeamId: "team-crossover",
          awayTeamId: "team-rival",
          startTime: "11:30", // before 13:00 — violation!
          categoryId: "cat-crossover",
        }),
      ],
      teamNames: {
        "team-crossover": "Crossover FC",
        "team-rival": "Rival FC",
      },
    });

    const report = mockAuditFixture(input);

    const violation = report.violations.find((v) => v.type === "constraint_conflict");
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe("error");
    expect(violation?.affected_match_ids).toContain("crossover-match");
    expect(violation?.machine_recommendation.action).toBe("change_time");
    expect(violation?.machine_recommendation.patch).toMatchObject({ newStartTime: "13:00" });
  });

  it("NO detecta violación si Crossover está programado después de las 13:00", () => {
    const input = makeInput({
      parsedConstraints: {
        timeRestrictions: [{ target: "Crossover", afterTime: "13:00" }],
      },
      proposedMatches: [
        makeMatch({
          id: "crossover-ok",
          homeTeamId: "team-crossover",
          startTime: "14:00", // OK
        }),
      ],
      teamNames: { "team-crossover": "Crossover FC" },
    });

    const report = mockAuditFixture(input);
    const violation = report.violations.find((v) => v.type === "constraint_conflict");
    expect(violation).toBeUndefined();
  });

  it("detecta restricción beforeTime — equipo debe jugar antes de las 12:00", () => {
    const input = makeInput({
      parsedConstraints: {
        timeRestrictions: [{ target: "Junior", beforeTime: "12:00" }],
      },
      proposedMatches: [
        makeMatch({
          id: "junior-late",
          awayTeamId: "team-junior",
          startTime: "13:00", // after 12:00 — violation!
        }),
      ],
      teamNames: { "team-junior": "Junior FC U12" },
    });

    const report = mockAuditFixture(input);
    const violation = report.violations.find(
      (v) => v.type === "constraint_conflict" && v.affected_match_ids.includes("junior-late")
    );
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe("error");
  });

  it("matches parciales del nombre del equipo (case insensitive)", () => {
    const input = makeInput({
      parsedConstraints: {
        timeRestrictions: [{ target: "crossover", afterTime: "13:00" }],
      },
      proposedMatches: [
        makeMatch({
          id: "m-partial",
          homeTeamId: "t1",
          startTime: "10:00",
        }),
      ],
      teamNames: { t1: "Club Crossover Seniors" }, // partial match
    });

    const report = mockAuditFixture(input);
    const violation = report.violations.find((v) => v.affected_match_ids.includes("m-partial"));
    expect(violation).toBeDefined();
  });
});

// ─── Test 4: Soft club grouping warning ───────────────────────────────────────

describe("Auditor — Caso 4: agrupación de clubes soft", () => {
  it("emite warning cuando clubGrouping es soft", () => {
    const input = makeInput({
      parsedConstraints: {
        clubGrouping: { enabled: true, type: "soft" },
      },
      proposedMatches: [makeMatch(), makeMatch({ id: "match-2", homeTeamId: "team-b" })],
    });

    const report = mockAuditFixture(input);

    const warning = report.violations.find(
      (v) => v.type === "schedule_preference_unmet" && v.severity === "warning"
    );
    expect(warning).toBeDefined();
    expect(warning?.context_source).toBe("organization");
    expect(warning?.machine_recommendation.action).toBe("ask_user");
    expect(report.status).toBe("warning");
    expect(report.requires_user_confirmation).toBe(true);
  });

  it("emite error cuando clubGrouping es hard", () => {
    const input = makeInput({
      parsedConstraints: {
        clubGrouping: { enabled: true, type: "hard" },
      },
      proposedMatches: [makeMatch()],
    });

    const report = mockAuditFixture(input);
    const violation = report.violations.find(
      (v) => v.type === "constraint_conflict" && v.context_source === "organization"
    );
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe("error");
    expect(report.status).toBe("fail");
  });

  it("NO emite advertencia cuando clubGrouping está desactivado", () => {
    const input = makeInput({
      parsedConstraints: { clubGrouping: { enabled: false } },
      proposedMatches: [makeMatch()],
    });

    const report = mockAuditFixture(input);
    const warning = report.violations.find((v) => v.type === "schedule_preference_unmet");
    expect(warning).toBeUndefined();
  });
});

// ─── Test 5: Approval gating logic ────────────────────────────────────────────

describe("canApproveWithAudit — gating de aprobación", () => {
  const passReport: AuditReport = {
    status: "pass", confidence: 0.95, summary_es: "OK",
    violations: [], missing_interpretations: [], approved_constraints: [],
    requires_user_confirmation: false,
  };
  const warnReport: AuditReport = {
    status: "warning", confidence: 0.8, summary_es: "Advertencias",
    violations: [{ severity: "warning", type: "schedule_preference_unmet", context_source: "organization",
      human_prompt_excerpt: "", affected_match_ids: [], affected_category_ids: [],
      explanation_es: "", recommended_fix_es: "", machine_recommendation: { action: "ask_user", patch: null } }],
    missing_interpretations: [], approved_constraints: [],
    requires_user_confirmation: true,
  };
  const failReport: AuditReport = {
    status: "fail", confidence: 0.9, summary_es: "Error crítico",
    violations: [{ severity: "error", type: "locked_match_changed", context_source: "locked_match",
      human_prompt_excerpt: "", affected_match_ids: ["m1"], affected_category_ids: ["c1"],
      explanation_es: "", recommended_fix_es: "", machine_recommendation: { action: "none", patch: null } }],
    missing_interpretations: [], approved_constraints: [],
    requires_user_confirmation: true,
  };

  it("permite aprobar si no hay auditoría (null)", () => {
    expect(canApproveWithAudit(null, false)).toBe(true);
  });

  it("permite aprobar si la auditoría pasa", () => {
    expect(canApproveWithAudit(passReport, false)).toBe(true);
  });

  it("BLOQUEA aprobación si la auditoría falla (fail)", () => {
    expect(canApproveWithAudit(failReport, false)).toBe(false);
    // override no tiene efecto en fail
    expect(canApproveWithAudit(failReport, true)).toBe(false);
  });

  it("BLOQUEA aprobación con warning SIN override del usuario", () => {
    expect(canApproveWithAudit(warnReport, false)).toBe(false);
  });

  it("PERMITE aprobación con warning cuando el usuario acepta las advertencias", () => {
    expect(canApproveWithAudit(warnReport, true)).toBe(true);
  });

  it("status fail tiene requires_user_confirmation=true", () => {
    expect(failReport.requires_user_confirmation).toBe(true);
  });

  it("status warning tiene requires_user_confirmation=true", () => {
    expect(warnReport.requires_user_confirmation).toBe(true);
  });

  it("status pass tiene requires_user_confirmation=false", () => {
    expect(passReport.requires_user_confirmation).toBe(false);
  });
});

// ─── Integration: combined violations ─────────────────────────────────────────

describe("Auditor — múltiples violaciones combinadas", () => {
  it("reporta errores Y advertencias en el mismo resultado", () => {
    const locked: LockedMatch = { id: "lm-1", courtId: "A", scheduledDate: "2026-07-01", startTime: "10:00" };
    const input = makeInput({
      parsedConstraints: {
        clubGrouping: { enabled: true, type: "soft" },
        timeRestrictions: [{ target: "Estrella", afterTime: "14:00" }],
      },
      lockedMatches: [locked],
      proposedMatches: [
        makeMatch({ id: "lm-1", courtId: "B", scheduledDate: "2026-07-01", startTime: "10:00" }), // locked changed
        makeMatch({ id: "m-estrella", homeTeamId: "t-estrella", startTime: "11:00" }), // time violation
      ],
      teamNames: { "t-estrella": "Deportivo Estrella" },
    });

    const report = mockAuditFixture(input);
    const errors = report.violations.filter((v) => v.severity === "error");
    const warnings = report.violations.filter((v) => v.severity === "warning");

    expect(errors.length).toBeGreaterThan(0);
    expect(warnings.length).toBeGreaterThan(0);
    expect(report.status).toBe("fail"); // fail takes precedence over warning
  });

  it("retorna pass sin restricciones y sin partidos bloqueados modificados", () => {
    const input = makeInput({
      proposedMatches: [makeMatch(), makeMatch({ id: "m2" })],
    });

    const report = mockAuditFixture(input);
    expect(report.status).toBe("pass");
    expect(report.violations.filter((v) => v.severity === "error")).toHaveLength(0);
  });

  it("blackout date genera error", () => {
    const input = makeInput({
      parsedConstraints: {
        blackoutDates: ["2026-07-05"],
      },
      proposedMatches: [makeMatch({ scheduledDate: "2026-07-05" })],
    });

    const report = mockAuditFixture(input);
    const violation = report.violations.find((v) => v.human_prompt_excerpt.includes("2026-07-05"));
    expect(violation).toBeDefined();
    expect(violation?.severity).toBe("error");
    expect(report.status).toBe("fail");
  });

  it("el campo confidence está entre 0 y 1", () => {
    const report = mockAuditFixture(makeInput());
    expect(report.confidence).toBeGreaterThanOrEqual(0);
    expect(report.confidence).toBeLessThanOrEqual(1);
  });

  it("summary_es no está vacío", () => {
    const report = mockAuditFixture(makeInput());
    expect(report.summary_es.length).toBeGreaterThan(0);
  });
});

// ─── hashAuditInput utility ───────────────────────────────────────────────────

describe("hashAuditInput", () => {
  it("retorna una cadena hexadecimal de 16 caracteres", async () => {
    const { hashAuditInput } = await import("@/lib/ai/fixture-auditor");
    const input = makeInput({ proposedMatches: [makeMatch()] });
    const hash = hashAuditInput(input);
    expect(hash).toMatch(/^[0-9a-f]{16}$/);
  });

  it("mismo input genera mismo hash", async () => {
    const { hashAuditInput } = await import("@/lib/ai/fixture-auditor");
    const input = makeInput({ proposedMatches: [makeMatch()] });
    expect(hashAuditInput(input)).toBe(hashAuditInput(input));
  });

  it("inputs distintos generan hashes distintos", async () => {
    const { hashAuditInput } = await import("@/lib/ai/fixture-auditor");
    const a = makeInput({ proposedMatches: [makeMatch({ id: "m1" })] });
    const b = makeInput({ proposedMatches: [makeMatch({ id: "m2" })] });
    expect(hashAuditInput(a)).not.toBe(hashAuditInput(b));
  });
});
