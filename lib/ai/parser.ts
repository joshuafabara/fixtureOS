import OpenAI from "openai";
import type { ParsedConstraints } from "@/lib/context/mock-parser";
import { parseContextPrompt } from "@/lib/context/mock-parser";

let _client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

const SYSTEM_PROMPT = `Eres un asistente especializado en programación de fixtures deportivos.
Tu única tarea es extraer restricciones y configuración estructurada desde texto libre en español o inglés.
Responde SIEMPRE con JSON puro, sin texto adicional, sin markdown, sin comentarios.

Estructura de respuesta:
{
  "scope": "organization" | "tournament" | "category" | "date",
  "courts": ["Cancha A", ...] | null,
  "playDays": ["monday","tuesday","wednesday","thursday","friday","saturday","sunday"] (solo los mencionados) | null,
  "timeWindow": {"start": "HH:MM", "end": "HH:MM"} | null,
  "defaultMatchDurationMinutes": number | null,
  "matchDurationMinutes": number | null,
  "minDaysBetweenMatches": number | null,
  "transitionMinutes": number | null,
  "maxMatchesPerTeamPerDay": number | null,
  "noGaps": boolean | null,
  "matchDurationByPhase": {
    "regular": number | null,
    "quarterfinal": number | null,
    "semifinal": number | null,
    "final": number | null
  } | null,
  "phaseTimeWindows": {
    "regular": {"start": "HH:MM", "end": "HH:MM"} | null,
    "quarterfinal": {"start": "HH:MM", "end": "HH:MM"} | null,
    "semifinal": {"start": "HH:MM", "end": "HH:MM"} | null,
    "final": {"start": "HH:MM", "end": "HH:MM"} | null
  } | null,
  "clubGrouping": {"enabled": true, "type": "soft" | "hard"} | null,
  "blackoutDates": ["YYYY-MM-DD", ...] | null,
  "startDate": "YYYY-MM-DD" | null,
  "timeRestrictions": [
    {
      "target": "nombre del equipo exacto como aparece en el texto",
      "afterTime": "HH:MM" | null,
      "beforeTime": "HH:MM" | null
    }
  ] | null,
  "gameMode": {
    "type": "single_round_robin" | "double_round_robin" | "groups" | "playoffs",
    "groups": number | null,
    "groupRounds": number | null,
    "teamsPerGroup": number | null,
    "totalQualifiers": number | null,
    "byeSeeds": [1, 2] | null,
    "classification": "top_1_per_group" | "top_2_per_group" | "top_3_per_group" | "top_4_per_group" | "top_2" | "top_3" | "top_4" | "top_6" | "top_8" | "all" | null,
    "playoffs": ["quarterfinal","semifinal","final","third_place"] | null,
    "bracketRounds": {
      "quarterfinal": ["string", ...],
      "semifinal": ["string", ...],
      "final": ["string"],
      "third_place": ["string"]
    } | null
  } | null,
  "priority": number | null,
  "warnings": ["...mensajes sobre información faltante o ambigua..."]
}

REGLAS IMPORTANTES:

playDays usa nombres en inglés en minúsculas siempre.
timeWindow en formato 24h "HH:MM".
startDate en formato ISO YYYY-MM-DD (año actual si no se menciona: 2026).
Si algo no está mencionado, usa null, no omitas el campo.
warnings debe mencionar información ambigua o faltante importante.

REGLAS PARA noGaps:
• noGaps: true cuando el texto pide que no haya espacios/huecos entre partidos, que los juegos sean consecutivos, o que no queden canchas vacías entre partidos.
• Ejemplos: "no dejar espacios libres entre juegos" → true. "siempre un juego luego de otro" → true. "partidos consecutivos sin descanso entre canchas" → true.
• Si no se menciona, usa null (el sistema por defecto ya intenta minimizar huecos).

REGLAS PARA transitionMinutes:
• Extrae transitionMinutes cuando el texto especifica un margen/buffer de tiempo entre partidos consecutivos en una misma cancha.
• Ejemplos: "margen mínimo de 10 minutos para transición" → 10. "15 minutos de transición entre partidos" → 15.
• Si no se menciona, usa null.

REGLAS PARA maxMatchesPerTeamPerDay:
• Extrae maxMatchesPerTeamPerDay cuando el texto limita cuántos partidos puede jugar un equipo en un mismo día.
• Ejemplos: "no más de dos partidos en un mismo día" → 2. "máximo 1 partido por jornada" → 1.
• Si no se menciona, usa null.

REGLAS PARA minDaysBetweenMatches:
• Extrae minDaysBetweenMatches cuando el texto especifica un mínimo de días de descanso entre partidos de un mismo equipo.
• Ejemplos: "no más de 1 partido cada 6 días" → 6. "al menos 7 días entre partidos" → 7. "descanso mínimo de 5 días" → 5.
• "1 partido por semana" → 7. "máximo 1 partido por semana por equipo" → 7.
• Si el texto no menciona restricción de descanso, usa null.

REGLAS PARA timeRestrictions:
• Usa timeRestrictions cuando el texto menciona que UN EQUIPO ESPECÍFICO solo puede jugar a partir de cierta hora (afterTime) o que debe jugar antes de cierta hora (beforeTime).
• afterTime: "Crossover juega solo a partir de las 13:00" → {"target": "Crossover", "afterTime": "13:00", "beforeTime": null}
• afterTime: "Los Andes no puede jugar antes de las 10am" → {"target": "Los Andes", "afterTime": "10:00", "beforeTime": null}
• beforeTime: "Crossover debe jugar antes de las 12:00" → {"target": "Crossover", "afterTime": null, "beforeTime": "12:00"}
• "target" debe ser el nombre del equipo tal como aparece en el texto (sin sufijos de categoría).
• Horas en formato 24h HH:MM. 1pm = 13:00, 2pm = 14:00, etc.
• Si múltiples equipos tienen restricciones, incluye un objeto por cada uno en el array.

REGLAS PARA phaseTimeWindows:
• Usa phaseTimeWindows cuando el texto especifica rangos de horario diferentes por FASE del torneo.
• Ejemplos: "las finales deben programarse entre las 10:00 y las 20:00" → {"final": {"start": "10:00", "end": "20:00"}}
• "reservar 17:00-20:00 para U17" → esto es una preferencia de categoría, no phaseTimeWindows. Anótalo en warnings.
• Si no se especifica, usa null.

REGLAS PARA matchDurationByPhase:
• Usa matchDurationByPhase cuando el texto especifica DURACIONES DISTINTAS según la fase.
• Ejemplo: "fase regular 75 min, cuartos 75 min, semifinal y final 90 min" →
  {"regular": 75, "quarterfinal": 75, "semifinal": 90, "final": 90}
• Si todas las fases tienen la misma duración, usa solo matchDurationMinutes (no matchDurationByPhase).
• Si se menciona matchDurationByPhase, también pon en matchDurationMinutes la duración de la fase regular.

REGLAS PARA gameMode:

• "type": usa "single_round_robin" cuando sea todos contra todos en UN solo grupo. Usa "groups" cuando hay 2 o más grupos. Usa "playoffs" para eliminación pura sin liga previa.
• "groups": número de grupos. Si es 1 solo grupo (todos vs todos), pon 1.
• "groupRounds": 1 = round robin simple, 2 = doble round robin (ida y vuelta).
• "teamsPerGroup": equipos por grupo si se menciona.
• "totalQualifiers": cuántos equipos clasifican a la siguiente fase (playoffs). Extrae esto si se menciona.
• "byeSeeds": array de números de siembra que pasan DIRECTO a la siguiente ronda sin jugar. Por ejemplo si "puesto 1 y 2 pasan directo a semifinales", byeSeeds = [1, 2].
• "classification": usa el valor que mejor describe cuántos clasifican. "top_6" si clasifican 6, "top_2_per_group" si clasifican top 2 de cada grupo, etc.
• "playoffs": incluye todos los rounds presentes: "quarterfinal", "semifinal", "final", "third_place".
• "bracketRounds": describe EXACTAMENTE los enfrentamientos de cada ronda como strings legibles. Usa "Gan." para ganador y "Per." para perdedor. Usa los números de siembra o posición (1, 2, 3...) para referirse a los equipos. Si hay byes, el bye se muestra como "BYE" en lugar del rival.

EJEMPLOS DE bracketRounds:

Ejemplo 1 - 1 grupo, 6 clasifican, seeds 1 y 2 con bye a semis, QF: 3vs6 y 4vs5:
"bracketRounds": {
  "quarterfinal": ["3 vs 6", "4 vs 5"],
  "semifinal": ["2 vs Gan. QF1", "1 vs Gan. QF2"],
  "final": ["Gan. SF1 vs Gan. SF2"],
  "third_place": ["Per. SF1 vs Per. SF2"]
}

Ejemplo 2 - 2 grupos, top 2 por grupo a semis:
"bracketRounds": {
  "semifinal": ["A1 vs B2", "B1 vs A2"],
  "final": ["Gan. SF1 vs Gan. SF2"],
  "third_place": ["Per. SF1 vs Per. SF2"]
}

Ejemplo 3 - 4 equipos, eliminación directa:
"bracketRounds": {
  "semifinal": ["1 vs 4", "2 vs 3"],
  "final": ["Gan. SF1 vs Gan. SF2"],
  "third_place": ["Per. SF1 vs Per. SF2"]
}

Cuando el usuario describe los enfrentamientos explícitamente, úsalos exactamente en bracketRounds.
`;

export async function parseContextWithAI(
  prompt: string,
  scope: string
): Promise<ParsedConstraints> {
  const client = getClient();

  if (!client) {
    return parseContextPrompt(prompt, scope);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `scope: ${scope}\n\nprompt: ${prompt}` },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as ParsedConstraints;

    data.scope = scope;
    if (!data.warnings) data.warnings = [];

    return data;
  } catch (e) {
    const fallback = parseContextPrompt(prompt, scope);
    fallback.warnings = [
      ...(fallback.warnings ?? []),
      `Análisis con IA falló (${e instanceof Error ? e.message : "error desconocido"}). Usando análisis básico.`,
    ];
    return fallback;
  }
}
