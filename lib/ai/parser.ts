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
    "classification": "top_2_per_group" | null,
    "playoffs": ["quarterfinal","semifinal","final"] | null
  } | null,
  "priority": number | null,
  "warnings": ["...mensajes sobre información faltante o ambigua..."]
}

Reglas importantes:
- playDays usa nombres en inglés en minúsculas siempre
- timeWindow en formato 24h "HH:MM"
- startDate en formato ISO YYYY-MM-DD (año actual si no se menciona: 2026)
- blackoutDates en formato ISO YYYY-MM-DD
- Si algo no está mencionado, usa null, no omitas el campo
- warnings debe mencionar información ambigua o faltante importante
- clubGrouping "hard" = equipos del mismo club NUNCA juegan entre sí en la misma fecha; "soft" = preferencia
`;

export async function parseContextWithAI(
  prompt: string,
  scope: string
): Promise<ParsedConstraints> {
  const client = getClient();

  if (!client) {
    // Graceful fallback to deterministic parser
    return parseContextPrompt(prompt, scope);
  }

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `scope: ${scope}\n\nprompt: ${prompt}`,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as ParsedConstraints;

    // Ensure scope is set correctly
    data.scope = scope;
    if (!data.warnings) data.warnings = [];

    return data;
  } catch (e) {
    // On any AI error, fall back to deterministic parser and add warning
    const fallback = parseContextPrompt(prompt, scope);
    fallback.warnings = [
      ...(fallback.warnings ?? []),
      `Análisis con IA falló (${e instanceof Error ? e.message : "error desconocido"}). Usando análisis básico.`,
    ];
    return fallback;
  }
}
