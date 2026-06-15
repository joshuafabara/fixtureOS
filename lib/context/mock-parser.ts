/**
 * Deterministic mock context parser.
 * Returns structured JSON from prompt text without calling OpenAI.
 * Architecture is ready for structured outputs when OPENAI_API_KEY is configured.
 * TODO: replace with OpenAI structured output when AI integration is enabled
 */

export type BracketRounds = {
  quarterfinal?: string[];
  semifinal?: string[];
  final?: string[];
  third_place?: string[];
};

export type ParsedConstraints = {
  scope: string;
  courts?: string[];
  playDays?: string[];
  timeWindow?: { start: string; end: string };
  defaultMatchDurationMinutes?: number;
  matchDurationMinutes?: number;
  matchDurationByPhase?: {
    regular?: number;
    quarterfinal?: number;
    semifinal?: number;
    final?: number;
  };
  minDaysBetweenMatches?: number;
  transitionMinutes?: number;
  maxMatchesPerTeamPerDay?: number;
  noGaps?: boolean;
  clubGrouping?: { enabled: boolean; type: "soft" | "hard" };
  blackoutDates?: string[];
  teamRestrictions?: Array<{ teamPattern: string; restriction: string }>;
  courtRestrictions?: Array<{ court: string; restriction: string }>;
  timeRestrictions?: Array<{ target: string; afterTime?: string; beforeTime?: string }>;
  phaseTimeWindows?: {
    regular?: { start: string; end: string };
    quarterfinal?: { start: string; end: string };
    semifinal?: { start: string; end: string };
    final?: { start: string; end: string };
  };
  startDate?: string;
  gameMode?: {
    type: string;
    groups?: number;
    groupRounds?: number;
    teamsPerGroup?: number;
    totalQualifiers?: number;
    byeSeeds?: number[];
    classification?: string;
    playoffs?: string[];
    bracketRounds?: BracketRounds;
  };
  priority?: number;
  warnings?: string[];
};

const DAYS_MAP: Record<string, string> = {
  lunes: "monday", monday: "monday",
  martes: "tuesday", tuesday: "tuesday",
  miércoles: "wednesday", miercoles: "wednesday", wednesday: "wednesday",
  jueves: "thursday", thursday: "thursday",
  viernes: "friday", friday: "friday",
  sábado: "saturday", sabado: "saturday", saturday: "saturday",
  domingo: "sunday", sunday: "sunday",
};

function extractDays(text: string): string[] {
  const lower = text.toLowerCase();
  return Object.entries(DAYS_MAP)
    .filter(([key]) => lower.includes(key))
    .map(([, val]) => val)
    .filter((v, i, arr) => arr.indexOf(v) === i);
}

function extractNumber(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern);
  return m ? parseInt(m[1], 10) : null;
}

function padTime(h: string, m?: string): string {
  return `${h.padStart(2, "0")}:${m ?? "00"}`;
}

export function parseContextPrompt(
  prompt: string,
  scope: string
): ParsedConstraints {
  const text = prompt.toLowerCase();
  const result: ParsedConstraints = { scope, warnings: [] };

  // ─── COURTS ────────────────────────────────────────────────────────────────
  const courtMatches = prompt.match(/Cancha\s+[A-Z]/gi) ?? [];
  if (courtMatches.length > 0) {
    result.courts = Array.from(new Set(courtMatches.map((c) => c.trim())));
  }

  // ─── DAYS ──────────────────────────────────────────────────────────────────
  const days = extractDays(text);
  if (days.length > 0) result.playDays = days;

  // ─── TIME WINDOW ───────────────────────────────────────────────────────────
  // Priority 1: explicit range "de/entre/desde (las) HH:MM a/y/hasta (las) HH:MM"
  // "las?" is optional to handle "entre 17:00 y 20:00" (no article)
  const fullRange = text.match(
    /(?:de|entre|desde)\s+(?:las?\s+)?(\d{1,2})(?::(\d{2}))?\s+(?:a|y|hasta)\s+(?:las?\s+)?(\d{1,2})(?::(\d{2}))?/
  );
  // Priority 2: "terminar después de las HH:MM" → max end time
  const hardEnd = text.match(/terminar\s+despu[eé]s\s+de\s+las?\s+(\d{1,2})(?::(\d{2}))?/);
  // Priority 3: "no programar (partidos) antes de las HH:MM" → min start time
  const hardStart = text.match(
    /no\s+programar\s+(?:partidos?\s+)?antes\s+de\s+las?\s+(\d{1,2})(?::(\d{2}))?/
  );
  // Priority 4: simple "a partir de las HH:MM" or "desde las HH:MM" (no team name before)
  const fromTime = text.match(/^a\s+partir\s+de\s+las?\s+(\d{1,2})(?::(\d{2}))?/m);

  if (fullRange) {
    result.timeWindow = {
      start: padTime(fullRange[1], fullRange[2]),
      end: padTime(fullRange[3], fullRange[4]),
    };
  } else if (hardEnd || hardStart) {
    const start = hardStart ? padTime(hardStart[1], hardStart[2]) : null;
    const end = hardEnd ? padTime(hardEnd[1], hardEnd[2]) : null;
    if (start || end) {
      result.timeWindow = { start: start ?? "08:00", end: end ?? "23:59" };
    }
  } else if (fromTime) {
    result.timeWindow = { start: padTime(fromTime[1], fromTime[2]), end: "23:59" };
  }

  // ─── MATCH DURATION (simple single value) ──────────────────────────────────
  const singleDur =
    extractNumber(text, /(\d+)\s+(?:minutos|min|minutes|hora|hour)/) ??
    (text.includes("1 hora") || text.includes("una hora") ? 60 : null) ??
    (text.includes("75 min") ? 75 : null) ??
    (text.includes("90 min") ? 90 : null);

  // ─── MATCH DURATION BY PHASE ───────────────────────────────────────────────
  // Split on sentence/clause boundaries so "cuartos de final" and "final" don't overlap
  const clauses = text.split(/[.,;]/);
  const byPhase: NonNullable<ParsedConstraints["matchDurationByPhase"]> = {};
  for (const clause of clauses) {
    const durM = clause.match(/(\d+)\s*(?:minutos?|min)/);
    if (!durM) continue;
    const dur = parseInt(durM[1], 10);
    const isQF = /cuartos?\s+de\s+final/.test(clause);
    const isSF = /semifinal/.test(clause);
    const isRegular = /fase\s+regular/.test(clause);
    // "final" or "finales" present but NOT inside "cuartos de final" or "semifinal"
    // Remove semifinal occurrences first so "semifinales y finales" correctly sets final too
    const clauseNoSF = clause.replace(/semifinale?s?/g, "");
    const isFinalPhase = /\bfinale?s?\b/.test(clauseNoSF) && !isQF;
    if (isRegular) byPhase.regular = dur;
    if (isQF) byPhase.quarterfinal = dur;
    if (isSF) byPhase.semifinal = dur;
    if (isFinalPhase) byPhase.final = dur;
  }
  // Only store matchDurationByPhase when multiple phases are specified
  if (Object.keys(byPhase).length > 1 || (Object.keys(byPhase).length === 1 && !byPhase.regular)) {
    result.matchDurationByPhase = byPhase;
    if (byPhase.regular) {
      result.matchDurationMinutes = byPhase.regular;
      result.defaultMatchDurationMinutes = byPhase.regular;
    }
  } else if (singleDur) {
    result.defaultMatchDurationMinutes = singleDur;
    result.matchDurationMinutes = singleDur;
  }

  // ─── MIN DAYS BETWEEN MATCHES ──────────────────────────────────────────────
  const minDaysPatterns: RegExp[] = [
    /(?:no\s+)?(?:más\s+de\s+un\s+partido\s+cada|un\s+partido\s+cada)\s+(\d+)\s+días?/,
    /(\d+)\s+días?\s+(?:entre\s+partidos|de\s+descanso|de\s+diferencia)/,
    /al\s+menos\s+(\d+)\s+días?\s+entre/,
    /mínimo\s+(?:de\s+)?(\d+)\s+días?\s+entre/,
    /cada\s+(\d+)\s+días?\s+(?:para|por|en)/,
  ];
  for (const p of minDaysPatterns) {
    const m = text.match(p);
    if (m) {
      result.minDaysBetweenMatches = parseInt(m[1], 10);
      break;
    }
  }

  // ─── TRANSITION MINUTES ────────────────────────────────────────────────────
  const transM =
    text.match(/margen\s+(?:mínimo\s+)?de\s+(\d+)\s+minutos?\s+(?:para\s+transici[oó]n|entre|de\s+transici[oó]n)/) ??
    text.match(/(\d+)\s+minutos?\s+(?:de\s+transici[oó]n|para\s+transici[oó]n|entre\s+partidos\s+consecutivos)/);
  if (transM) result.transitionMinutes = parseInt(transM[1], 10);

  // ─── MAX MATCHES PER TEAM PER DAY ──────────────────────────────────────────
  // Supports both digits and Spanish number words (e.g. "dos", "tres")
  const NUM_WORDS: Record<string, number> = {
    un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5,
    seis: 6, siete: 7, ocho: 8, nueve: 9, diez: 10,
  };
  const maxMMatch = text.match(
    /m[aá]s\s+de\s+(un|uno|una|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\s+partidos?\s+en\s+un\s+(?:mismo\s+)?d[ií]a/
  );
  if (maxMMatch) {
    const raw = maxMMatch[1];
    result.maxMatchesPerTeamPerDay = NUM_WORDS[raw] ?? parseInt(raw, 10);
  }

  // ─── NO GAPS ───────────────────────────────────────────────────────────────
  if (
    text.includes("sin espacios") ||
    text.includes("sin huecos") ||
    /partidos\s+consecutivos/.test(text) ||
    text.includes("no dejar espacios libres") ||
    text.includes("sin descanso entre")
  ) {
    result.noGaps = true;
  }

  // ─── PHASE TIME WINDOWS ────────────────────────────────────────────────────
  // "finales ... entre las HH:MM y las HH:MM" or "entre HH:MM y HH:MM ... final"
  const finalsWin = text.match(
    /finales?\s[^.]*?entre\s+las?\s+(\d{1,2})(?::(\d{2}))?\s+y\s+las?\s+(\d{1,2})(?::(\d{2}))?/
  ) ?? text.match(
    /entre\s+las?\s+(\d{1,2})(?::(\d{2}))?\s+y\s+las?\s+(\d{1,2})(?::(\d{2}))?[^.]*?finales?/
  );
  if (finalsWin) {
    if (!result.phaseTimeWindows) result.phaseTimeWindows = {};
    result.phaseTimeWindows.final = {
      start: padTime(finalsWin[1], finalsWin[2]),
      end: padTime(finalsWin[3], finalsWin[4]),
    };
  }

  // ─── CLUB GROUPING ─────────────────────────────────────────────────────────
  if (text.includes("mismo club") || text.includes("agrupar") || text.includes("juntos")) {
    result.clubGrouping = { enabled: true, type: "soft" };
  }

  // ─── BLACKOUT DATES ────────────────────────────────────────────────────────
  const blackoutMatch = prompt.match(/(?:no\s+(?:jugar|games?)\s+(?:el|los?|on)?\s+)([\d/\-]+)/gi);
  if (blackoutMatch) {
    result.blackoutDates = blackoutMatch
      .map((m) => {
        const d = m.match(/[\d/\-]+/);
        return d ? d[0] : null;
      })
      .filter(Boolean) as string[];
  }

  // ─── START DATE ────────────────────────────────────────────────────────────
  // ISO format first: "2026-07-05"
  const isoDateMatch = prompt.match(/\b(\d{4}-(?:0[1-9]|1[0-2])-(?:0[1-9]|[12]\d|3[01]))\b/);
  if (isoDateMatch) {
    result.startDate = isoDateMatch[1];
  } else {
    // Spanish text: "15 de agosto"
    const dateMatch = prompt.match(
      /(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i
    );
    if (dateMatch) {
      const months: Record<string, string> = {
        enero: "01", febrero: "02", marzo: "03", abril: "04", mayo: "05",
        junio: "06", julio: "07", agosto: "08", septiembre: "09",
        octubre: "10", noviembre: "11", diciembre: "12",
      };
      const month = months[dateMatch[2].toLowerCase()];
      if (month) {
        result.startDate = `2026-${month}-${dateMatch[1].padStart(2, "0")}`;
      }
    }
  }

  // ─── TIME RESTRICTIONS (per-team) ──────────────────────────────────────────
  const sentences = prompt.split(/[.;!?]/);
  const timeRestrictions: Array<{ target: string; afterTime?: string; beforeTime?: string }> = [];

  for (const sentence of sentences) {
    const s = sentence.trim();
    if (!s) continue;

    // afterTime — Pattern 1: "TeamName (solo|únicamente|juega) ... (a partir de|después de|desde) las HH:MM"
    const m1 = s.match(
      /([A-ZÁÉÍÓÚÜÑ][A-Za-záéíóúüñÁÉÍÓÚÜÑ\s]+?)\s+(?:solo|únicamente|solamente|juega)\s.*?(?:a\s+partir\s+de\s+las?|despu[eé]s\s+de\s+las?|desde\s+las?)\s+(?:las?\s+)?(\d{1,2})(?::(\d{2}))?/i
    );
    if (m1) {
      timeRestrictions.push({ target: m1[1].trim(), afterTime: padTime(m1[2], m1[3]) });
      continue;
    }

    // afterTime — Pattern 2: "Programar a TeamName (desde|a partir de|después de) las HH:MM"
    const m2 = s.match(
      /[Pp]rogramar\s+(?:a\s+)?([A-ZÁÉÍÓÚÜÑ][A-Za-záéíóúüñÁÉÍÓÚÜÑ\s]+?)\s+(?:desde\s+las?|a\s+partir\s+de\s+las?|despu[eé]s\s+de\s+las?)\s+(?:las?\s+)?(\d{1,2})(?::(\d{2}))?/i
    );
    if (m2) {
      timeRestrictions.push({ target: m2[1].trim(), afterTime: padTime(m2[2], m2[3]) });
      continue;
    }

    // beforeTime — Pattern 3: "TeamName debe jugar (obligatoriamente) antes de las HH:MM"
    // Name may include digits (e.g. "Crossover U17 Masculino")
    const m3 = s.match(
      /([A-ZÁÉÍÓÚÜÑ][A-Za-záéíóúüñÁÉÍÓÚÜÑ\s\d]+?)\s+debe\s+jugar\s+(?:obligatoriamente\s+)?antes\s+de\s+las?\s+(\d{1,2})(?::(\d{2}))?/i
    );
    if (m3) {
      timeRestrictions.push({ target: m3[1].trim(), beforeTime: padTime(m3[2], m3[3]) });
    }
  }

  if (timeRestrictions.length > 0) result.timeRestrictions = timeRestrictions;

  // ─── GAME MODE ─────────────────────────────────────────────────────────────
  // Check groups FIRST: "todos contra todos" inside a multi-group context means
  // round robin WITHIN each group, not the overall format.
  const hasGroups = text.includes("grupo") || text.includes("group");
  const isSingleGroup =
    text.includes("grupo único") ||
    text.includes("grupo unico") ||
    text.includes("un solo grupo") ||
    text.includes("un grupo");

  if (hasGroups && !isSingleGroup) {
    const groups = extractNumber(text, /(\d+)\s+grupos?/) ?? 2;
    const groupRounds = text.includes("doble") || text.includes("ida y vuelta") ? 2 : 1;
    result.gameMode = {
      type: "groups",
      groups,
      groupRounds,
      classification: "top_2_per_group",
      playoffs: ["semifinal", "final"],
    };
  } else if (text.includes("todos contra todos") || text.includes("round robin") || text.includes("liga")) {
    const isDouble = text.includes("doble") || text.includes("double") || text.includes("ida y vuelta");
    result.gameMode = {
      type: isDouble ? "double_round_robin" : "single_round_robin",
    };
  } else if (text.includes("playoff") || text.includes("eliminatori")) {
    result.gameMode = {
      type: "playoffs",
      playoffs: ["quarterfinal", "semifinal", "final"],
    };
  }

  // ─── PRIORITY ──────────────────────────────────────────────────────────────
  const priorityMatch = text.match(/prioridad\s+(\d+)/i);
  if (priorityMatch) result.priority = parseInt(priorityMatch[1], 10);

  // ─── WARNINGS ──────────────────────────────────────────────────────────────
  if (scope === "category" && !result.startDate) {
    result.warnings!.push("No se detectó fecha de inicio. Agrega una fecha explícita.");
  }
  if (!result.courts && scope === "organization") {
    result.warnings!.push("No se detectaron canchas. Especifica las canchas disponibles.");
  }

  return result;
}
