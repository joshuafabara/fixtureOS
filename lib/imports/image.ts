import OpenAI from "openai";
import type { ImportPreview, ParsedTeamRow } from "./excel";

export type ImageExtractedRow = {
  confidence: number; // 0–100
  clubName: string;
  teamName: string;
  categoryName: string;
  categoryColor: string | null;
  status: string; // "active" | "retired" | "unknown"
  flag: "new" | "lowconf" | "review" | null;
};

export type ImageExtractionResult = {
  rows: ImageExtractedRow[];
  warnings: string[];
  preview: ImportPreview;
};

const SYSTEM_PROMPT = `Eres un asistente que extrae listas de equipos deportivos desde imágenes.
Devuelve SIEMPRE JSON puro, sin markdown, sin texto adicional.

Estructura exacta:
{
  "rows": [
    {
      "confidence": 95,
      "clubName": "Nombre del club",
      "teamName": "Nombre del equipo",
      "categoryName": "Nombre de categoría",
      "categoryColor": "#hexcolor o null",
      "status": "active"
    }
  ],
  "warnings": ["mensaje si algo es ambiguo o ilegible"]
}

Reglas:
- confidence va de 0 a 100 indicando la certeza de extracción de esa fila
- Si no puedes identificar el club, usa "?" como clubName
- Si no puedes identificar el equipo, usa "?" como teamName
- categoryColor: usa el color del encabezado de la columna/sección si es visible, en formato hex. Si no hay color, usa null
- status: "active" por defecto. "retired" si el equipo está tachado, marcado en rojo, o explícitamente indicado como retirado
- Si hay duda sobre un campo, reduce confidence por debajo de 70
- Ordena los rows agrupados por categoría
`;

export async function extractTeamsFromImage(
  imageBase64: string,
  mimeType: string,
  userPrompt?: string
): Promise<ImageExtractionResult> {
  const emptyPreview: ImportPreview = { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: [] };

  if (!process.env.OPENAI_API_KEY) {
    return { rows: [], warnings: ["OPENAI_API_KEY no configurado."], preview: emptyPreview };
  }

  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

  const userMessage = userPrompt
    ? `Extrae los equipos de esta imagen. Instrucciones adicionales: ${userPrompt}`
    : "Extrae todos los equipos, clubes y categorías de esta imagen.";

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
              image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" },
            },
            { type: "text", text: userMessage },
          ],
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as { rows?: ImageExtractedRow[]; warnings?: string[] };
    const extracted = data.rows ?? [];
    const warnings = data.warnings ?? [];

    // Annotate flags
    const rows: ImageExtractedRow[] = extracted.map((r) => ({
      ...r,
      flag: r.confidence < 70 ? "lowconf" : r.clubName === "?" || r.teamName === "?" ? "review" : null,
    }));

    // Build a standard ImportPreview (only high-confidence rows go into rows[])
    const teamRows: ParsedTeamRow[] = rows
      .filter((r) => r.confidence >= 70 && r.teamName !== "?" && r.categoryName)
      .map((r) => ({
        clubName: r.clubName === "?" ? "" : r.clubName,
        teamName: r.teamName,
        categoryName: r.categoryName,
        categoryColor: r.categoryColor,
      }));

    const clubs = [...new Set(teamRows.map((r) => r.clubName).filter(Boolean))];
    const catMap = new Map<string, string | null>();
    for (const r of teamRows) {
      if (!catMap.has(r.categoryName)) catMap.set(r.categoryName, r.categoryColor);
    }
    const categories = [...catMap.entries()].map(([name, color]) => ({ name, color }));

    const preview: ImportPreview = { rows: teamRows, clubs, categories, totalTeams: teamRows.length, warnings };

    return { rows, warnings, preview };
  } catch (e) {
    const msg = `Error al procesar imagen: ${e instanceof Error ? e.message : "Error desconocido"}`;
    return { rows: [], warnings: [msg], preview: { ...emptyPreview, warnings: [msg] } };
  }
}
