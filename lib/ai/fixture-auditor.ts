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
  context_scope_id?: string; // categoryId or date string where restriction is DEFINED (not where matches are)
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
  categoryParsedConstraints?: Record<string, Record<string, unknown>>; // categoryId → parsed constraints
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

const SYSTEM_PROMPT = `Eres FixtureOS AI Auditor. Tu función es AUDITAR — verificar restricciones con precisión, nunca modificar fixtures directamente.

Recibirás un JSON con:
- organization_context, tournament_context: prompts de contexto en texto libre
- category_contexts: [{categoryId, categoryName, prompt}] — reglas específicas por categoría
- category_parsed_constraints: {categoryId: {playDays, timeWindow, timeRestrictions, ...}} — restricciones parseadas por categoría
- parsed_constraints: restricciones parseadas (org + torneo fusionados)
- proposed_matches: [{id, categoryId, homeTeamName, awayTeamName, scheduledDate, startTime, endTime, courtName, phase}]
- team_names: {teamId: teamName}

JERARQUÍA DE RESTRICCIONES (mayor → menor prioridad):
1. Locked matches — NUNCA deben cambiar
2. Manual overrides — respetar siempre
3. Restricciones de Categoría (category_parsed_constraints, category_contexts)
4. Restricciones de Torneo
5. Restricciones de Organización

═══════════════════════════════════════════════
VERIFICACIONES OBLIGATORIAS — revisa CADA UNA:
═══════════════════════════════════════════════

1. DÍAS DE JUEGO POR CATEGORÍA
   - Para cada categoría en category_parsed_constraints, leer playDays (ej: ["friday","saturday"])
   - Para cada partido de esa categoría, calcular el día de la semana de scheduledDate
     (Lunes=monday, Martes=tuesday, Miércoles=wednesday, Jueves=thursday, Viernes=friday, Sábado=saturday, Domingo=sunday)
   - Si el día NO está en playDays → violation severity:"error"
   - Si no hay category_parsed_constraints para una categoría, usar parsed_constraints.playDays de org/torneo
   - También leer los prompts de category_contexts en texto libre para detectar restricciones de día no parseadas

2. VENTANA HORARIA POR CATEGORÍA
   - Para cada categoría en category_parsed_constraints con timeWindow definido:
     → startTime de cada partido debe ser >= timeWindow.start
     → startTime + duración del partido debe ser <= timeWindow.end
   - Si hay timeWindow global en parsed_constraints, aplicar a todos los partidos
   - Verificar también diferencias de ventana por día si el prompt lo especifica

3. RESTRICCIONES DE EQUIPO (timeRestrictions)
   - Para cada entrada en parsed_constraints.timeRestrictions → aplica a TODOS los partidos
   - Para cada entrada en category_parsed_constraints[catId].timeRestrictions → aplica SOLO a partidos donde categoryId === catId
   - En ambos casos: buscar partidos donde homeTeamName o awayTeamName contiene el target (case-insensitive)
   - si afterTime: verificar startTime >= afterTime; si beforeTime: verificar startTime < beforeTime
   - Violación severity:"error" por cada partido que no cumpla
   - IMPORTANTE: "Crossover" en category_parsed_constraints["U14 Masculino"] solo aplica a partidos U14 Masculino con Crossover. NUNCA a Crossover U17, Crossover U18, etc. (otras categorías)

4. FRECUENCIA MÍNIMA (minDaysBetweenMatches)
   - Si minDaysBetweenMatches en parsed_constraints (org/torneo): calcular días entre partidos del mismo equipo en TODAS las categorías
   - Si minDaysBetweenMatches en category_parsed_constraints[catId]: calcular días entre partidos del mismo equipo SOLO dentro de esa categoría (categoryId === catId)
   - "1 partido por semana" = minDaysBetweenMatches: 7
   - Si dos partidos del mismo equipo (dentro del scope correcto) tienen menos días entre ellos → violation severity:"error"

5. PARTIDOS BLOQUEADOS
   - Verificar que ningún locked match cambió de cancha, fecha u hora en proposed_matches

6. DURACIÓN POR FASE (matchDurationByPhase)
   - Si matchDurationByPhase está definido, verificar que endTime - startTime corresponde a la fase del partido

═══════════════════════════════════════════════
ESTRUCTURA EXACTA DE LA RESPUESTA:
═══════════════════════════════════════════════

Responde SOLO con JSON puro (sin markdown, sin texto adicional):

{
  "status": "pass" | "warning" | "fail",
  "confidence": 0.0 a 1.0,
  "summary_es": "Resumen específico mencionando categorías y equipos afectados",
  "violations": [
    {
      "severity": "error" | "warning" | "info",
      "type": "constraint_conflict" | "context_missed" | "bad_game_mode" | "court_conflict" | "team_conflict" | "locked_match_changed" | "manual_override_ignored" | "schedule_preference_unmet" | "ambiguous_context",
      "context_source": "category" | "organization" | "tournament" | "date" | "locked_match" | "manual_override" | "system",
      "context_scope_id": "OBLIGATORIO cuando context_source='category': el categoryId exacto de donde proviene la restricción (del array category_contexts). Cuando context_source='date': la fecha. En otros casos: omitir o null.",
      "human_prompt_excerpt": "cita LITERAL y breve de la regla en el contexto (ej: 'Jugar solo viernes entre 6pm y 9pm y sábados entre 8am y 6pm')",
      "affected_match_ids": ["id1", "id2"],
      "affected_category_ids": ["catId"],
      "explanation_es": "REQUERIDO — NO puede estar vacío. Describe concretamente: qué partido, qué equipo, qué día/hora fue programado, qué dice la restricción, cuál es la diferencia. Ej: 'El partido Spartans U14 vs Hawks U14 (ID: abc) está programado el domingo 2026-07-05, pero U14 Masculino solo puede jugar viernes y sábados según el contexto de categoría.'",
      "recommended_fix_es": "REQUERIDO — acción concreta. Ej: 'Reprogramar al viernes 2026-07-10 o sábado 2026-07-11.'",
      "machine_recommendation": {
        "action": "none" | "move_match" | "swap_match" | "change_court" | "change_time" | "mark_forfeit" | "ask_user" | "regenerate",
        "patch": null
      }
    }
  ],
  "missing_interpretations": [
    {
      "prompt_excerpt": "fragmento del contexto ambiguo",
      "issue_es": "descripción del problema de interpretación",
      "suggested_question_es": "pregunta sugerida al usuario"
    }
  ],
  "approved_constraints": [
    {
      "constraint_id": "identificador único",
      "status": "satisfied" | "partially_satisfied" | "not_applicable",
      "explanation_es": "descripción de por qué se cumple"
    }
  ],
  "requires_user_confirmation": true | false
}

REGLAS CRÍTICAS:
- explanation_es NUNCA puede ser "" — siempre debe tener texto descriptivo
- recommended_fix_es NUNCA puede ser "" — siempre debe tener acción concreta
- Si encuentras múltiples partidos que violan la misma regla, agrúpalos en UNA violación con todos los affected_match_ids y explain todos en explanation_es
- summary_es debe ser específico: mencionar qué categorías y cuántos partidos tienen problemas

SCOPING DE RESTRICCIONES (CRÍTICO):
- Las restricciones en category_parsed_constraints[catId] se aplican SOLO a partidos donde categoryId === catId
- Las restricciones en parsed_constraints (org/torneo) se aplican a TODOS los partidos
- Nunca apliques una restricción de categoría a partidos de otras categorías
- Cuando una restricción en category_contexts/category_parsed_constraints suena "global" (sin mencionar una cancha, equipo o fecha específica — ej: "no más de 1 partido por semana por equipo", "partidos los viernes y sábados"), agrégala a missing_interpretations así:
  { "prompt_excerpt": "[cita exacta]", "issue_es": "Esta restricción está definida en el contexto de [nombre de categoría] y solo aplica a esa categoría. Si debe aplicar a todas las categorías, debe moverse al contexto del torneo.", "suggested_question_es": "¿Esta restricción aplica solo a [nombre de categoría] o a todas las categorías del torneo?" }

VERIFICACIÓN DE IDs (CRÍTICO — evita errores de mapeo):
- Al incluir un ID en affected_match_ids, SIEMPRE verifica que el campo homeTeamName o awayTeamName del partido con ese ID efectivamente corresponde al equipo mencionado en explanation_es
- Por ejemplo: si la violación es sobre "Spartans U14", solo incluye IDs de partidos donde homeTeamName="Spartans U14" o awayTeamName="Spartans U14"
- NUNCA incluyas IDs de partidos de otros equipos aunque estén en la misma semana o categoría
- Si no puedes confirmar el UUID exacto, omite ese partido del affected_match_ids en lugar de incluir un ID incorrecto`;

// ─── Shared helpers ───────────────────────────────────────────────────────────

const DAY_NAMES_ES: Record<number, string> = {
  0: "domingo", 1: "lunes", 2: "martes", 3: "miércoles",
  4: "jueves", 5: "viernes", 6: "sábado",
};

const DAY_NAME_TO_NUM: Record<string, number> = {
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3,
  thursday: 4, friday: 5, saturday: 6,
};

function parseDayNums(days: string[]): number[] {
  return days.map((d) => DAY_NAME_TO_NUM[d.toLowerCase()] ?? -1).filter((n) => n >= 0);
}

function matchDow(date: string): number {
  return new Date(date + "T12:00:00").getDay();
}

// ─── Mock auditor (deterministic fallback) ────────────────────────────────────

export function mockAuditFixture(input: AuditInput): AuditReport {
  const violations: AuditViolation[] = [];
  const approved_constraints: ApprovedConstraint[] = [];
  const missing_interpretations: MissingInterpretation[] = [];

  const constraints = input.parsedConstraints;

  // Per-category play day check (uses categoryParsedConstraints if available, falls back to org)
  const catConstraintsMap = input.categoryParsedConstraints ?? {};
  const orgPlayDays = (constraints.playDays as string[] | undefined) ?? [];
  const orgAllowedDows = orgPlayDays.length > 0 ? parseDayNums(orgPlayDays) : null;

  for (const [catId, catC] of Object.entries(catConstraintsMap)) {
    const catPlayDays = (catC.playDays as string[] | undefined) ?? [];
    if (catPlayDays.length === 0) continue;
    const allowedDows = parseDayNums(catPlayDays);
    const badMatches = input.proposedMatches.filter(
      (m) => m.categoryId === catId && m.scheduledDate && !allowedDows.includes(matchDow(m.scheduledDate))
    );
    if (badMatches.length > 0) {
      const examples = badMatches
        .slice(0, 3)
        .map((m) => {
          const home = m.homeTeamId ? (input.teamNames[m.homeTeamId] ?? m.homeTeamId) : "TBD";
          const away = m.awayTeamId ? (input.teamNames[m.awayTeamId] ?? m.awayTeamId) : "TBD";
          const dow = DAY_NAMES_ES[matchDow(m.scheduledDate!)] ?? m.scheduledDate;
          return `${home} vs ${away} (${dow} ${m.scheduledDate}, ${m.startTime?.slice(0, 5)})`;
        })
        .join("; ");
      const extra = badMatches.length > 3 ? ` y ${badMatches.length - 3} más` : "";
      violations.push({
        severity: "error",
        type: "constraint_conflict",
        context_source: "category",
        context_scope_id: catId,
        human_prompt_excerpt: `Jugar solo ${catPlayDays.join(" y ")}`,
        affected_match_ids: badMatches.map((m) => m.id),
        affected_category_ids: [catId],
        explanation_es: `${badMatches.length} partido(s) programado(s) en días no permitidos: ${examples}${extra}. La restricción de categoría indica jugar solo ${catPlayDays.join(" y ")}.`,
        recommended_fix_es: `Reprogramar todos los partidos afectados a ${catPlayDays.join(" o ")}.`,
        machine_recommendation: { action: "move_match", patch: null },
      });
    }
  }

  // Also check org-level play days for matches without a category-level override
  if (orgAllowedDows && orgAllowedDows.length > 0) {
    const catsWithCatConstraints = new Set(Object.keys(catConstraintsMap).filter(
      (id) => (catConstraintsMap[id]?.playDays as string[] | undefined)?.length
    ));
    const badMatches = input.proposedMatches.filter(
      (m) => !catsWithCatConstraints.has(m.categoryId) &&
        m.scheduledDate &&
        !orgAllowedDows.includes(matchDow(m.scheduledDate))
    );
    if (badMatches.length > 0) {
      violations.push({
        severity: "error",
        type: "constraint_conflict",
        context_source: "organization",
        human_prompt_excerpt: `Días de juego: ${orgPlayDays.join(", ")}`,
        affected_match_ids: badMatches.map((m) => m.id),
        affected_category_ids: [...new Set(badMatches.map((m) => m.categoryId))],
        explanation_es: `${badMatches.length} partido(s) programados fuera de los días permitidos por la organización (${orgPlayDays.join(", ")}).`,
        recommended_fix_es: `Reprogramar a ${orgPlayDays.join(" o ")}.`,
        machine_recommendation: { action: "move_match", patch: null },
      });
    }
  }

  // 1b. Category-scoped time restrictions (only checked against matches in that category)
  for (const [catId, catC] of Object.entries(catConstraintsMap)) {
    const catTimeRestrictions = (catC.timeRestrictions as Array<{
      target: string; afterTime?: string; beforeTime?: string;
    }> | undefined) ?? [];
    if (catTimeRestrictions.length === 0) continue;
    const catMatches = input.proposedMatches.filter((m) => m.categoryId === catId);
    for (const restriction of catTimeRestrictions) {
      for (const match of catMatches) {
        if (!match.startTime) continue;
        const homeName = match.homeTeamId ? (input.teamNames[match.homeTeamId] ?? "") : "";
        const awayName = match.awayTeamId ? (input.teamNames[match.awayTeamId] ?? "") : "";
        const target = restriction.target.toLowerCase();
        if (!homeName.toLowerCase().includes(target) && !awayName.toLowerCase().includes(target)) continue;
        if (restriction.afterTime && match.startTime < restriction.afterTime) {
          violations.push({
            severity: "error",
            type: "constraint_conflict",
            context_source: "category",
            context_scope_id: catId,
            human_prompt_excerpt: `${restriction.target} después de las ${restriction.afterTime}`,
            affected_match_ids: [match.id],
            affected_category_ids: [catId],
            explanation_es: `Partido con ${restriction.target} programado a las ${match.startTime}, pero en esta categoría debe ser después de las ${restriction.afterTime}.`,
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
            context_scope_id: catId,
            human_prompt_excerpt: `${restriction.target} antes de las ${restriction.beforeTime}`,
            affected_match_ids: [match.id],
            affected_category_ids: [catId],
            explanation_es: `Partido con ${restriction.target} programado a las ${match.startTime}, pero en esta categoría debe ser antes de las ${restriction.beforeTime}.`,
            recommended_fix_es: `Mover el partido antes de las ${restriction.beforeTime}.`,
            machine_recommendation: {
              action: "change_time",
              patch: { matchId: match.id, newStartTime: null },
            },
          });
        }
      }
    }
  }

  // 1c. Category-scoped minDaysBetweenMatches
  for (const [catId, catC] of Object.entries(catConstraintsMap)) {
    const minDays = catC.minDaysBetweenMatches as number | undefined;
    if (!minDays) continue;
    const catMatches = input.proposedMatches.filter((m) => m.categoryId === catId && m.scheduledDate);
    const matchesByTeam = new Map<string, typeof catMatches>();
    for (const match of catMatches) {
      for (const teamId of [match.homeTeamId, match.awayTeamId]) {
        if (!teamId) continue;
        if (!matchesByTeam.has(teamId)) matchesByTeam.set(teamId, []);
        matchesByTeam.get(teamId)!.push(match);
      }
    }
    for (const [teamId, teamMatches] of matchesByTeam.entries()) {
      if (teamMatches.length < 2) continue;
      const sorted = [...teamMatches].sort((a, b) => a.scheduledDate!.localeCompare(b.scheduledDate!));
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const days = Math.floor(
          (new Date(curr.scheduledDate! + "T12:00:00").getTime() -
            new Date(prev.scheduledDate! + "T12:00:00").getTime()) /
          86400000
        );
        if (days < minDays) {
          const teamName = input.teamNames[teamId] ?? teamId;
          violations.push({
            severity: "error",
            type: "constraint_conflict",
            context_source: "category",
            context_scope_id: catId,
            human_prompt_excerpt: `No más de un partido cada ${minDays} días`,
            affected_match_ids: [prev.id, curr.id],
            affected_category_ids: [catId],
            explanation_es: `El equipo ${teamName} tiene partidos con solo ${days} día(s) de diferencia (${prev.scheduledDate} y ${curr.scheduledDate}), violando la restricción de al menos ${minDays} días entre partidos en esta categoría.`,
            recommended_fix_es: `Reprogramar uno de los dos partidos de ${teamName} para que haya al menos ${minDays} días de diferencia.`,
            machine_recommendation: { action: "move_match", patch: { matchId: curr.id } },
          });
        }
      }
    }
  }

  // 1d. Org/tournament-level minDaysBetweenMatches (global, all categories)
  const orgMinDays = constraints.minDaysBetweenMatches as number | undefined;
  if (orgMinDays) {
    const catsWithCatMinDays = new Set(
      Object.entries(catConstraintsMap)
        .filter(([, c]) => (c.minDaysBetweenMatches as number | undefined))
        .map(([id]) => id)
    );
    const globalMatches = input.proposedMatches.filter(
      (m) => !catsWithCatMinDays.has(m.categoryId) && m.scheduledDate
    );
    const matchesByTeam = new Map<string, typeof globalMatches>();
    for (const match of globalMatches) {
      for (const teamId of [match.homeTeamId, match.awayTeamId]) {
        if (!teamId) continue;
        if (!matchesByTeam.has(teamId)) matchesByTeam.set(teamId, []);
        matchesByTeam.get(teamId)!.push(match);
      }
    }
    for (const [teamId, teamMatches] of matchesByTeam.entries()) {
      if (teamMatches.length < 2) continue;
      const sorted = [...teamMatches].sort((a, b) => a.scheduledDate!.localeCompare(b.scheduledDate!));
      for (let i = 1; i < sorted.length; i++) {
        const prev = sorted[i - 1];
        const curr = sorted[i];
        const days = Math.floor(
          (new Date(curr.scheduledDate! + "T12:00:00").getTime() -
            new Date(prev.scheduledDate! + "T12:00:00").getTime()) /
          86400000
        );
        if (days < orgMinDays) {
          const teamName = input.teamNames[teamId] ?? teamId;
          violations.push({
            severity: "error",
            type: "constraint_conflict",
            context_source: "organization",
            human_prompt_excerpt: `No más de un partido cada ${orgMinDays} días`,
            affected_match_ids: [prev.id, curr.id],
            affected_category_ids: [prev.categoryId, curr.categoryId].filter((v, i, a) => a.indexOf(v) === i),
            explanation_es: `El equipo ${teamName} tiene partidos con solo ${days} día(s) de diferencia (${prev.scheduledDate} y ${curr.scheduledDate}), violando la restricción de al menos ${orgMinDays} días entre partidos.`,
            recommended_fix_es: `Reprogramar uno de los dos partidos de ${teamName} para que haya al menos ${orgMinDays} días de diferencia.`,
            machine_recommendation: { action: "move_match", patch: { matchId: curr.id } },
          });
        }
      }
    }
  }

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
  const rec = (v.machine_recommendation ?? v.machineRecommendation ?? v.recommendation ?? {}) as Record<string, unknown>;
  // Try every plausible field name GPT might emit for explanation
  const explanation = String(
    v.explanation_es ??
    v.explanationEs ??
    v.explanation ??
    v.description ??
    v.descripcion ??
    v.mensaje ??
    v.message ??
    v.text ??
    v.detalle ??
    ""
  );
  const fix = String(
    v.recommended_fix_es ??
    v.recommendedFixEs ??
    v.recommended_fix ??
    v.fix ??
    v.corrección ??
    v.correccion ??
    v.solucion ??
    v.solution ??
    ""
  );
  return {
    severity: (v.severity ?? "info") as AuditViolationSeverity,
    type: (v.type ?? "context_missed") as AuditViolationType,
    context_source: (v.context_source ?? v.contextSource ?? v.source ?? "organization") as AuditContextSource,
    context_scope_id: v.context_scope_id ?? v.contextScopeId ?? undefined,
    human_prompt_excerpt: String(v.human_prompt_excerpt ?? v.humanPromptExcerpt ?? v.prompt_excerpt ?? v.excerpt ?? ""),
    affected_match_ids: (v.affected_match_ids ?? v.affectedMatchIds ?? v.matchIds ?? []) as string[],
    affected_category_ids: (v.affected_category_ids ?? v.affectedCategoryIds ?? v.categoryIds ?? []) as string[],
    explanation_es: explanation,
    recommended_fix_es: fix,
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
    category_parsed_constraints: input.categoryParsedConstraints ?? {},
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
    proposedMatches: input.proposedMatches
      .map((m) => ({
        id: m.id,
        scheduledDate: m.scheduledDate,
        startTime: m.startTime,
        endTime: m.endTime,
        courtId: m.courtId,
      }))
      .sort((a, b) => a.id.localeCompare(b.id)),
    parsedConstraints: input.parsedConstraints,
    categoryParsedConstraints: input.categoryParsedConstraints ?? {},
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
