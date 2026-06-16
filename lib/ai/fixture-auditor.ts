import OpenAI from "openai";
import crypto from "crypto";

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditViolationSeverity = "info" | "warning" | "error";
export type AuditViolationType =
  | "context_missed"
  | "constraint_conflict"
  | "bad_game_mode"
  | "court_conflict"
  | "team_conflict"
  | "locked_match_changed"
  | "manual_override_ignored"
  | "schedule_preference_unmet"
  | "ambiguous_context";
export type AuditContextSource =
  | "system"
  | "organization"
  | "tournament"
  | "category"
  | "date"
  | "manual_override"
  | "locked_match";
export type MachineAction =
  | "none"
  | "move_match"
  | "swap_match"
  | "change_court"
  | "change_time"
  | "mark_forfeit"
  | "ask_user"
  | "regenerate";

export type AuditViolation = {
  severity: AuditViolationSeverity;
  type: AuditViolationType;
  context_source: AuditContextSource;
  human_prompt_excerpt: string;
  affected_match_ids: string[];
  affected_category_ids: string[];
  explanation_es: string;
  recommended_fix_es: string;
  machine_recommendation: {
    action: MachineAction;
    patch: Record<string, unknown> | null;
  };
};

export type MissingInterpretation = {
  prompt_excerpt: string;
  issue_es: string;
  suggested_question_es: string;
};

export type ApprovedConstraint = {
  constraint_id: string;
  status: "satisfied" | "partially_satisfied" | "not_applicable";
  explanation_es: string;
};

export type AuditReport = {
  status: "pass" | "warning" | "fail";
  confidence: number; // 0–1
  summary_es: string;
  violations: AuditViolation[];
  missing_interpretations: MissingInterpretation[];
  approved_constraints: ApprovedConstraint[];
  requires_user_confirmation: boolean;
};

export type ProposedMatch = {
  id: string;
  categoryId: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  courtId: string | null;
  courtName?: string | null;
  phase?: string;
};

export type LockedMatch = {
  id: string;
  courtId: string | null;
  scheduledDate: string | null;
  startTime: string | null;
};

export type ManualOverride = {
  id: string;
  overrideType: string;
  overrideJson: Record<string, unknown>;
};

export type AuditInput = {
  organizationContextPrompt: string;
  tournamentContextPrompt: string;
  categoryContextPrompts: Array<{ categoryId: string; categoryName: string; prompt: string }>;
  dateContextPrompts: Array<{ date: string; prompt: string }>;
  parsedConstraints: Record<string, unknown>;
  constraintHierarchy: string[];
  proposedMatches: ProposedMatch[];
  teamNames: Record<string, string>; // teamId → teamName
  lockedMatches: LockedMatch[];
  manualOverrides: ManualOverride[];
  dryRunChanges: Array<{ changeType: string; severity: string; explanation?: string | null }>;
};

// ─── OpenAI client ────────────────────────────────────────────────────────────

let _client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

// ─── System prompt ────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres FixtureOS AI Auditor. Tu función es AUDITAR — nunca modificar directamente fixtures.

Recibirás:
1. Prompts de contexto (organización, torneo, categoría, fecha) con las reglas definidas
2. Las restricciones parseadas en formato estructurado
3. Los partidos propuestos por el motor determinista
4. Partidos bloqueados (locked) y overrides manuales activos

JERARQUÍA DE RESTRICCIONES (mayor → menor prioridad):
1. Locked matches — NUNCA deben cambiar
2. Manual overrides — respetar siempre
3. Restricciones de Fecha
4. Restricciones de Categoría
5. Restricciones de Torneo
6. Restricciones de Organización
7. Restricciones del Sistema

REGLAS DE CLASIFICACIÓN:
- "fail": partido bloqueado modificado, conflicto de cancha/equipo, restricción de horario violada (severity="error")
- "warning": preferencias soft no satisfechas, contextos ambiguos, reglas blandas no aplicadas
- "pass": todas las restricciones críticas respetadas

RESTRICCIONES QUE DEBES VERIFICAR:
- timeRestrictions: afterTime y beforeTime por equipo
- minDaysBetweenMatches: días mínimos entre partidos del mismo equipo
- blackoutDates: fechas prohibidas
- timeWindow: horario global del torneo
- matchDurationByPhase: duración correcta por fase
- courts: partidos solo en canchas permitidas
- locked matches: sin cambios de cancha/fecha/hora
- manual overrides: respetados en la propuesta
- clubGrouping: agrupación de clubes (soft=warning, hard=error)
- gameMode/bracketRounds: formato y llaves del torneo

FORMATO DE RESPUESTA (JSON puro, sin markdown):
{
  "status": "pass" | "warning" | "fail",
  "confidence": número entre 0 y 1,
  "summary_es": "resumen en español",
  "violations": [...],
  "missing_interpretations": [...],
  "approved_constraints": [...],
  "requires_user_confirmation": boolean
}

Todos los textos explicativos deben estar en español. Sé específico con los IDs de partidos y categorías afectados.`;

// ─── Mock auditor (deterministic fallback) ────────────────────────────────────

export function mockAuditFixture(input: AuditInput): AuditReport {
  const violations: AuditViolation[] = [];
  const approved_constraints: ApprovedConstraint[] = [];
  const missing_interpretations: MissingInterpretation[] = [];

  const constraints = input.parsedConstraints;

  // 1. Check locked matches
  const lockedById = new Map(input.lockedMatches.map((m) => [m.id, m]));
  for (const match of input.proposedMatches) {
    const locked = lockedById.get(match.id);
    if (!locked) continue;
    const changed =
      locked.courtId !== match.courtId ||
      locked.scheduledDate !== match.scheduledDate ||
      locked.startTime !== match.startTime;
    if (changed) {
      violations.push({
        severity: "error",
        type: "locked_match_changed",
        context_source: "locked_match",
        human_prompt_excerpt: "Partido bloqueado",
        affected_match_ids: [match.id],
        affected_category_ids: [match.categoryId],
        explanation_es: `El partido bloqueado ${match.id} fue modificado en la propuesta (cancha, fecha o hora difieren del original).`,
        recommended_fix_es: "Revertir los cambios al partido bloqueado. Los partidos bloqueados no pueden ser reprogramados.",
        machine_recommendation: { action: "none", patch: null },
      });
    }
  }
  if (input.lockedMatches.length > 0 && violations.filter((v) => v.type === "locked_match_changed").length === 0) {
    approved_constraints.push({
      constraint_id: "locked_matches",
      status: "satisfied",
      explanation_es: `${input.lockedMatches.length} partido(s) bloqueado(s) no fueron modificados.`,
    });
  }

  // 2. Check time restrictions (afterTime / beforeTime)
  const timeRestrictions = (constraints.timeRestrictions as Array<{
    target: string;
    afterTime?: string;
    beforeTime?: string;
  }> | null) ?? [];

  for (const restriction of timeRestrictions) {
    let matched = false;
    for (const match of input.proposedMatches) {
      if (!match.startTime) continue;
      const homeName = match.homeTeamId ? (input.teamNames[match.homeTeamId] ?? "") : "";
      const awayName = match.awayTeamId ? (input.teamNames[match.awayTeamId] ?? "") : "";
      const target = restriction.target.toLowerCase();
      if (!homeName.toLowerCase().includes(target) && !awayName.toLowerCase().includes(target)) continue;
      matched = true;

      if (restriction.afterTime && match.startTime < restriction.afterTime) {
        violations.push({
          severity: "error",
          type: "constraint_conflict",
          context_source: "category",
          human_prompt_excerpt: `${restriction.target} después de las ${restriction.afterTime}`,
          affected_match_ids: [match.id],
          affected_category_ids: [match.categoryId],
          explanation_es: `Partido con ${restriction.target} programado a las ${match.startTime}, pero debe ser después de las ${restriction.afterTime}.`,
          recommended_fix_es: `Mover el partido a partir de las ${restriction.afterTime}.`,
          machine_recommendation: {
            action: "change_time",
            patch: { matchId: match.id, newStartTime: restriction.afterTime },
          },
        });
      }
      if (restriction.beforeTime && match.startTime >= restriction.beforeTime) {
        violations.push({
          severity: "error",
          type: "constraint_conflict",
          context_source: "category",
          human_prompt_excerpt: `${restriction.target} antes de las ${restriction.beforeTime}`,
          affected_match_ids: [match.id],
          affected_category_ids: [match.categoryId],
          explanation_es: `Partido con ${restriction.target} programado a las ${match.startTime}, pero debe ser antes de las ${restriction.beforeTime}.`,
          recommended_fix_es: `Mover el partido antes de las ${restriction.beforeTime}.`,
          machine_recommendation: {
            action: "change_time",
            patch: { matchId: match.id, newStartTime: null },
          },
        });
      }
    }
    if (matched) {
      approved_constraints.push({
        constraint_id: `time_restriction_${restriction.target}`,
        status: violations.some((v) => v.human_prompt_excerpt.includes(restriction.target))
          ? "partially_satisfied"
          : "satisfied",
        explanation_es: `Restricción de horario para "${restriction.target}" verificada.`,
      });
    }
  }

  // 3. Check blackout dates
  const blackoutDates = (constraints.blackoutDates as string[] | null) ?? [];
  if (blackoutDates.length > 0) {
    const blackoutSet = new Set(blackoutDates);
    for (const match of input.proposedMatches) {
      if (match.scheduledDate && blackoutSet.has(match.scheduledDate)) {
        violations.push({
          severity: "error",
          type: "constraint_conflict",
          context_source: "organization",
          human_prompt_excerpt: `Fecha bloqueada: ${match.scheduledDate}`,
          affected_match_ids: [match.id],
          affected_category_ids: [match.categoryId],
          explanation_es: `Partido programado el ${match.scheduledDate}, que es una fecha bloqueada.`,
          recommended_fix_es: "Reprogramar el partido a una fecha disponible.",
          machine_recommendation: { action: "move_match", patch: { matchId: match.id } },
        });
      }
    }
    if (violations.filter((v) => v.human_prompt_excerpt.includes("Fecha bloqueada")).length === 0) {
      approved_constraints.push({
        constraint_id: "blackout_dates",
        status: "satisfied",
        explanation_es: `Ningún partido cae en las ${blackoutDates.length} fecha(s) bloqueada(s).`,
      });
    }
  }

  // 4. Check court constraints
  const allowedCourts = (constraints.courts as string[] | null) ?? [];
  if (allowedCourts.length > 0) {
    for (const match of input.proposedMatches) {
      if (match.courtName && !allowedCourts.some((c) => match.courtName?.includes(c) || c.includes(match.courtName ?? ""))) {
        violations.push({
          severity: "warning",
          type: "constraint_conflict",
          context_source: "organization",
          human_prompt_excerpt: `Canchas permitidas: ${allowedCourts.join(", ")}`,
          affected_match_ids: [match.id],
          affected_category_ids: [match.categoryId],
          explanation_es: `Partido asignado a "${match.courtName}", que no está entre las canchas permitidas.`,
          recommended_fix_es: `Reasignar a una cancha permitida: ${allowedCourts.join(", ")}.`,
          machine_recommendation: { action: "change_court", patch: { matchId: match.id } },
        });
      }
    }
  }

  // 5. Check club grouping soft preference
  const clubGrouping = constraints.clubGrouping as { enabled?: boolean; type?: string } | undefined;
  if (clubGrouping?.enabled && clubGrouping?.type === "soft") {
    violations.push({
      severity: "warning",
      type: "schedule_preference_unmet",
      context_source: "organization",
      human_prompt_excerpt: "Agrupación de clubes (soft)",
      affected_match_ids: [],
      affected_category_ids: [],
      explanation_es: "La preferencia de agrupación de clubes (tipo soft) no pudo verificarse automáticamente. Se requiere revisión manual.",
      recommended_fix_es: "Revisar que los equipos del mismo club jueguen en bloques horarios consecutivos.",
      machine_recommendation: { action: "ask_user", patch: null },
    });
  } else if (clubGrouping?.enabled && clubGrouping?.type === "hard") {
    violations.push({
      severity: "error",
      type: "constraint_conflict",
      context_source: "organization",
      human_prompt_excerpt: "Agrupación de clubes (hard)",
      affected_match_ids: [],
      affected_category_ids: [],
      explanation_es: "La agrupación de clubes obligatoria (hard) no pudo verificarse sin datos de club por equipo.",
      recommended_fix_es: "Verificar manualmente o regenerar el fixture con datos de club cargados.",
      machine_recommendation: { action: "ask_user", patch: null },
    });
  }

  // 6. Flag unverifiable bracket rules for AI review
  const gameMode = constraints.gameMode as Record<string, unknown> | undefined;
  if (gameMode?.byeSeeds || gameMode?.bracketRounds) {
    missing_interpretations.push({
      prompt_excerpt: "Llaves del torneo / byes",
      issue_es: "Las asignaciones de byes y los emparejamientos de llaves no pueden verificarse determinísticamente sin datos de clasificación. Se requiere revisión por IA.",
      suggested_question_es: "¿Los equipos con bye en cuartos de final efectivamente quedaron libres en la propuesta?",
    });
  }

  // 7. Check manual override types for awareness
  const ignoredOverrides = input.manualOverrides.filter((o) =>
    !input.proposedMatches.some((m) => m.id === (o.overrideJson as Record<string,unknown>).matchId)
  );
  if (ignoredOverrides.length > 0) {
    violations.push({
      severity: "warning",
      type: "manual_override_ignored",
      context_source: "manual_override",
      human_prompt_excerpt: `${ignoredOverrides.length} override(s) manual(es)`,
      affected_match_ids: [],
      affected_category_ids: [],
      explanation_es: `${ignoredOverrides.length} override(s) manual(es) activo(s) no tienen un partido correspondiente en la propuesta.`,
      recommended_fix_es: "Verificar que los overrides manuales se aplicaron correctamente en el fixture propuesto.",
      machine_recommendation: { action: "ask_user", patch: null },
    });
  }

  // Determine overall status
  const hasErrors = violations.some((v) => v.severity === "error");
  const hasWarnings = violations.some((v) => v.severity === "warning");
  const status: "pass" | "warning" | "fail" = hasErrors ? "fail" : hasWarnings ? "warning" : "pass";

  const violationCount = violations.length;
  const summary_es =
    status === "pass"
      ? `Auditoría completada sin problemas. ${input.proposedMatches.length} partido(s) verificados correctamente.`
      : status === "warning"
      ? `Auditoría con ${violationCount} advertencia(s). Se pueden aceptar para continuar.`
      : `Auditoría falló con ${violations.filter((v) => v.severity === "error").length} error(es) crítico(s). Se requiere corrección antes de aprobar.`;

  return {
    status,
    confidence: 0.85,
    summary_es,
    violations,
    missing_interpretations,
    approved_constraints,
    requires_user_confirmation: hasErrors || hasWarnings,
  };
}

// ─── Field normalizer (handles camelCase vs snake_case from OpenAI) ───────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeViolation(v: Record<string, any>): AuditViolation {
  const rec = (v.machine_recommendation ?? v.machineRecommendation ?? {}) as Record<string, unknown>;
  return {
    severity: (v.severity ?? "info") as AuditViolationSeverity,
    type: (v.type ?? "context_missed") as AuditViolationType,
    context_source: (v.context_source ?? v.contextSource ?? "organization") as AuditContextSource,
    human_prompt_excerpt: String(v.human_prompt_excerpt ?? v.humanPromptExcerpt ?? v.prompt_excerpt ?? ""),
    affected_match_ids: (v.affected_match_ids ?? v.affectedMatchIds ?? []) as string[],
    affected_category_ids: (v.affected_category_ids ?? v.affectedCategoryIds ?? []) as string[],
    explanation_es: String(v.explanation_es ?? v.explanationEs ?? v.explanation ?? ""),
    recommended_fix_es: String(v.recommended_fix_es ?? v.recommendedFixEs ?? v.recommended_fix ?? v.fix ?? ""),
    machine_recommendation: {
      action: (rec.action ?? "none") as MachineAction,
      patch: (rec.patch ?? null) as Record<string, unknown> | null,
    },
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeMissingInterpretation(m: Record<string, any>): MissingInterpretation {
  return {
    prompt_excerpt: String(m.prompt_excerpt ?? m.promptExcerpt ?? ""),
    issue_es: String(m.issue_es ?? m.issueEs ?? m.issue ?? ""),
    suggested_question_es: String(m.suggested_question_es ?? m.suggestedQuestionEs ?? m.suggested_question ?? ""),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeApprovedConstraint(c: Record<string, any>): ApprovedConstraint {
  return {
    constraint_id: String(c.constraint_id ?? c.constraintId ?? ""),
    status: (c.status ?? "not_applicable") as ApprovedConstraint["status"],
    explanation_es: String(c.explanation_es ?? c.explanationEs ?? c.explanation ?? ""),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeAuditReport(raw: Record<string, any>): AuditReport {
  const status = raw.status && ["pass", "warning", "fail"].includes(raw.status) ? raw.status : "warning";
  const confidence = typeof raw.confidence === "number" ? raw.confidence : 0.7;
  const summary_es = String(raw.summary_es ?? raw.summaryEs ?? raw.summary ?? "");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const violations = (raw.violations ?? []).map((v: Record<string, any>) => normalizeViolation(v));
  const missing_interpretations = (raw.missing_interpretations ?? raw.missingInterpretations ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: Record<string, any>) => normalizeMissingInterpretation(m));
  const approved_constraints = (raw.approved_constraints ?? raw.approvedConstraints ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((c: Record<string, any>) => normalizeApprovedConstraint(c));
  const requires_user_confirmation =
    typeof raw.requires_user_confirmation === "boolean"
      ? raw.requires_user_confirmation
      : typeof raw.requiresUserConfirmation === "boolean"
      ? raw.requiresUserConfirmation
      : status !== "pass";

  return { status, confidence, summary_es, violations, missing_interpretations, approved_constraints, requires_user_confirmation };
}

// ─── OpenAI auditor ───────────────────────────────────────────────────────────

export async function auditFixture(input: AuditInput): Promise<AuditReport> {
  const client = getClient();
  if (!client) return mockAuditFixture(input);

  const userPayload = JSON.stringify({
    organization_context: input.organizationContextPrompt,
    tournament_context: input.tournamentContextPrompt,
    category_contexts: input.categoryContextPrompts,
    date_contexts: input.dateContextPrompts,
    parsed_constraints: input.parsedConstraints,
    constraint_hierarchy: input.constraintHierarchy,
    proposed_matches: input.proposedMatches.map((m) => ({
      ...m,
      homeTeamName: m.homeTeamId ? input.teamNames[m.homeTeamId] : null,
      awayTeamName: m.awayTeamId ? input.teamNames[m.awayTeamId] : null,
    })),
    locked_matches: input.lockedMatches,
    manual_overrides: input.manualOverrides,
    dry_run_changes_summary: {
      total: input.dryRunChanges.length,
      errors: input.dryRunChanges.filter((c) => c.severity === "error").length,
      warnings: input.dryRunChanges.filter((c) => c.severity === "warning").length,
    },
  });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userPayload },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = JSON.parse(raw) as Record<string, any>;

    // Normalize and validate
    const report = normalizeAuditReport(parsed);
    return report;
  } catch {
    return mockAuditFixture(input);
  }
}

// ─── Utilities ────────────────────────────────────────────────────────────────

export function hashAuditInput(input: AuditInput): string {
  const payload = JSON.stringify({
    proposedMatches: input.proposedMatches.map((m) => m.id).sort(),
    parsedConstraints: input.parsedConstraints,
  });
  return crypto.createHash("sha256").update(payload).digest("hex").slice(0, 16);
}

export function canApproveWithAudit(
  auditReport: AuditReport | null,
  auditWarningOverride: boolean
): boolean {
  if (!auditReport) return true; // no audit run yet — don't block
  if (auditReport.status === "pass") return true;
  if (auditReport.status === "fail") return false;
  if (auditReport.status === "warning") return auditWarningOverride;
  return true;
}
