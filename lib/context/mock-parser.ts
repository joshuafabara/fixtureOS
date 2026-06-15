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
  clubGrouping?: { enabled: boolean; type: "soft" | "hard" };
  blackoutDates?: string[];
  teamRestrictions?: Array<{ teamPattern: string; restriction: string }>;
  courtRestrictions?: Array<{ court: string; restriction: string }>;
  timeRestrictions?: Array<{ target: string; afterTime: string }>;
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
  matchDurationMinutes?: number;
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

function extractTime(text: string, pattern: RegExp): string | null {
  const m = text.match(pattern);
  if (!m) return null;
  const h = m[1].padStart(2, "0");
  const min = m[2] ?? "00";
  return `${h}:${min}`;
}

function extractNumber(text: string, pattern: RegExp): number | null {
  const m = text.match(pattern);
  return m ? parseInt(m[1], 10) : null;
}

export function parseContextPrompt(
  prompt: string,
  scope: string
): ParsedConstraints {
  const text = prompt.toLowerCase();
  const result: ParsedConstraints = { scope, warnings: [] };

  // Extract courts
  const courtMatches = prompt.match(/Cancha\s+[A-Z]/gi) ?? [];
  if (courtMatches.length > 0) {
    result.courts = Array.from(new Set(courtMatches.map((c) => c.trim())));
  }

  // Extract days
  const days = extractDays(text);
  if (days.length > 0) result.playDays = days;

  // Extract time window (e.g. "8am a 9pm", "08:00 a 21:00", "de 8 a 21")
  const startTime =
    extractTime(text, /de\s+(\d{1,2})(?::(\d{2}))?\s*(?:am|hrs?)?/) ??
    extractTime(text, /(\d{1,2})(?::(\d{2}))?\s*(?:am|hrs?)?\s+(?:a|hasta)/);
  const endTime =
    extractTime(text, /(?:a|hasta)\s+(\d{1,2})(?::(\d{2}))?\s*(?:pm|hrs?)?/) ??
    extractTime(text, /(\d{1,2})(?::(\d{2}))?\s*(?:pm|hrs?)?$/);

  if (startTime || endTime) {
    result.timeWindow = {
      start: startTime ?? "08:00",
      end: endTime ?? "21:00",
    };
  }

  // Duration
  const duration = extractNumber(text, /(\d+)\s+(?:minutos|min|minutes|hora|hour)/) ??
    (text.includes("1 hora") || text.includes("una hora") ? 60 : null) ??
    (text.includes("75 min") ? 75 : null) ??
    (text.includes("90 min") ? 90 : null);
  if (duration) {
    result.defaultMatchDurationMinutes = duration;
    result.matchDurationMinutes = duration;
  }

  // Club grouping
  if (text.includes("mismo club") || text.includes("agrupar") || text.includes("juntos")) {
    result.clubGrouping = { enabled: true, type: "soft" };
  }

  // Blackout dates — simple pattern "no jugar el X"
  const blackoutMatch = prompt.match(/(?:no\s+(?:jugar|games?)\s+(?:el|los?|on)?\s+)([\d/\-]+)/gi);
  if (blackoutMatch) {
    result.blackoutDates = blackoutMatch
      .map((m) => {
        const d = m.match(/[\d/\-]+/);
        return d ? d[0] : null;
      })
      .filter(Boolean) as string[];
  }

  // Start date
  const dateMatch = prompt.match(/(\d{1,2})\s+de\s+(enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i);
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

  // Game mode hints
  if (text.includes("todos contra todos") || text.includes("round robin") || text.includes("liga")) {
    const isDouble = text.includes("doble") || text.includes("double") || text.includes("ida y vuelta");
    result.gameMode = {
      type: isDouble ? "double_round_robin" : "single_round_robin",
    };
  } else if (text.includes("grupo") || text.includes("group")) {
    const groups = extractNumber(text, /(\d+)\s+grupos?/) ?? 2;
    result.gameMode = {
      type: "groups",
      groups,
      groupRounds: 1,
      classification: "top_2_per_group",
      playoffs: ["semifinal", "final"],
    };
  } else if (text.includes("playoff") || text.includes("eliminatori")) {
    result.gameMode = {
      type: "playoffs",
      playoffs: ["quarterfinal", "semifinal", "final"],
    };
  }

  // Priority
  const priorityMatch = text.match(/prioridad\s+(\d+)/i);
  if (priorityMatch) result.priority = parseInt(priorityMatch[1], 10);

  // Warnings
  if (scope === "category" && !result.startDate) {
    result.warnings!.push("No se detectó fecha de inicio. Agrega una fecha explícita.");
  }
  if (!result.courts && scope === "organization") {
    result.warnings!.push("No se detectaron canchas. Especifica las canchas disponibles.");
  }

  return result;
}
