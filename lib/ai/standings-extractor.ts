import OpenAI from "openai";

export type ExtractedStandingsRow = {
  position: number;
  teamName: string;
  points?: number | null;
  played?: number | null;
  won?: number | null;
  drawn?: number | null;
  lost?: number | null;
};

export type StandingsExtractionResult = {
  rows: ExtractedStandingsRow[];
  warnings: string[];
};

const SYSTEM_PROMPT = `Eres un asistente que extrae tablas de posiciones deportivas desde imágenes.
Devuelve SIEMPRE JSON puro, sin markdown, sin texto adicional.

Estructura:
{
  "rows": [
    {
      "position": 1,
      "teamName": "Nombre del equipo",
      "points": 18,
      "played": 6,
      "won": 6,
      "drawn": 0,
      "lost": 0
    }
  ],
  "warnings": ["mensaje si hay algo ambiguo o ilegible"]
}

Reglas:
- position es el número de posición en la tabla (1 = primero)
- teamName es el nombre tal como aparece en la imagen
- Si un campo no está visible, usa null
- Si hay texto ilegible, agrégalo a warnings
- Ordena los rows por position ascendente
`;

export async function extractStandingsFromImage(
  imageBase64: string,
  mimeType: string = "image/png"
): Promise<StandingsExtractionResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { rows: [], warnings: ["OPENAI_API_KEY no configurado."] };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url: `data:${mimeType};base64,${imageBase64}`,
                detail: "high",
              },
            },
            {
              type: "text",
              text: "Extrae la tabla de posiciones de esta imagen.",
            },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as StandingsExtractionResult;
    return { rows: data.rows ?? [], warnings: data.warnings ?? [] };
  } catch (e) {
    return {
      rows: [],
      warnings: [`Error al procesar imagen: ${e instanceof Error ? e.message : "Error desconocido"}`],
    };
  }
}
