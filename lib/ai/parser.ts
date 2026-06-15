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
  "clubGrouping": {"enabled": true, "type": "soft" | "hard"} | null,
  "blackoutDates": ["YYYY-MM-DD", ...] | null,
  "startDate": "YYYY-MM-DD" | null,
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
