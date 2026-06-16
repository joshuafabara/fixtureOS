import OpenAI from "openai";

export type EditableMatch = {
  id: string;
  categoryId: string;
  categoryName: string;
  homeTeamName: string;
  awayTeamName: string;
  scheduledDate: string | null;
  startTime: string | null;
  endTime: string | null;
  courtName: string | null;
  phase: string;
};

export type MatchPatch = {
  matchId: string;
  changes: {
    scheduledDate?: string;
    startTime?: string;
    endTime?: string;
    courtName?: string;
  };
  explanation_es: string;
};

export type EditResult = {
  patches: MatchPatch[];
  summary_es: string;
};

const EDITOR_SYSTEM_PROMPT = `Eres FixtureOS AI Editor. Tu trabajo es interpretar solicitudes de cambio en lenguaje natural y traducirlas a parches concretos sobre un fixture de partidos.

Recibirás:
- proposed_matches: lista de partidos actuales con id, categoría, equipos, fecha, hora, cancha
- request: solicitud del usuario en lenguaje natural

Debes devolver SOLO JSON puro (sin markdown):
{
  "patches": [
    {
      "matchId": "uuid del partido a modificar",
      "changes": {
        "scheduledDate": "YYYY-MM-DD",   (opcional — solo si cambia la fecha)
        "startTime": "HH:MM",            (opcional — solo si cambia la hora de inicio)
        "endTime": "HH:MM",              (opcional — solo si cambia la hora de fin)
        "courtName": "nombre de cancha"  (opcional — solo si cambia la cancha)
      },
      "explanation_es": "Breve explicación del cambio"
    }
  ],
  "summary_es": "Resumen de los cambios propuestos"
}

REGLAS:
- Solo incluir partidos que realmente necesiten cambiar según la solicitud
- No inventar partidos que no existen en proposed_matches
- Si la solicitud es ambigua o no aplica a ningún partido, devolver patches: [] y explicar en summary_es
- Si el usuario pide cambiar hora pero no especifica la nueva, inferir la más razonable según el contexto
- Mantener todos los campos no mencionados tal como están (no los incluyas en changes)
- Las horas siempre en formato "HH:MM" (24h)
- Las fechas siempre en formato "YYYY-MM-DD"
- Si al cambiar la hora de inicio debes ajustar la de fin para mantener la duración, inclúyela también`;

let _client: OpenAI | null = null;
function getClient(): OpenAI | null {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!_client) _client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _client;
}

export async function editFixtureWithAI(
  matches: EditableMatch[],
  request: string,
): Promise<EditResult> {
  const client = getClient();
  if (!client) {
    return {
      patches: [],
      summary_es: "El editor IA no está disponible (falta OPENAI_API_KEY). Usa la edición manual.",
    };
  }

  const userPayload = JSON.stringify({
    proposed_matches: matches,
    request,
  });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: EDITOR_SYSTEM_PROMPT },
        { role: "user", content: userPayload },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = JSON.parse(raw) as Record<string, any>;

    const patches: MatchPatch[] = (parsed.patches ?? [])
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((p: Record<string, any>) => ({
        matchId: String(p.matchId ?? ""),
        changes: {
          scheduledDate: p.changes?.scheduledDate ?? undefined,
          startTime: p.changes?.startTime ?? undefined,
          endTime: p.changes?.endTime ?? undefined,
          courtName: p.changes?.courtName ?? undefined,
        },
        explanation_es: String(p.explanation_es ?? ""),
      }))
      .filter((p: MatchPatch) => p.matchId && Object.keys(p.changes).some((k) => p.changes[k as keyof typeof p.changes] !== undefined));

    return {
      patches,
      summary_es: String(parsed.summary_es ?? `${patches.length} cambio(s) sugerido(s).`),
    };
  } catch {
    return {
      patches: [],
      summary_es: "Error al procesar la solicitud. Intenta de nuevo.",
    };
  }
}
