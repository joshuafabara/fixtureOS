/**
 * AI-powered table extractor + club name canonicalizer.
 * Used by all three import sources (Excel, CSV, Image) so the extraction
 * logic lives in one place and all formats get the same quality.
 */
import OpenAI from "openai";
import type { ImportPreview, ParsedTeamRow } from "./excel";

export type AICategoryResult = {
  name: string;
  color: string | null;
  teams: string[];
};

export type AIExtractionResult = {
  categories: AICategoryResult[];
  warnings: string[];
};

const TABLE_SYSTEM_PROMPT = `Eres un asistente que extrae datos de inscripción de equipos deportivos desde tablas.

La tabla puede tener dos formatos:
- FORMATO COLUMNA: cada columna es una categoría. La primera fila con contenido tiene los nombres de categoría. Las filas siguientes tienen los nombres de equipos bajo cada columna.
- FORMATO FILA: cada fila es un equipo, con columnas llamadas Club / Equipo / Categoría.

Devuelve SIEMPRE JSON puro, sin markdown, sin texto adicional:
{
  "categories": [
    { "name": "NOMBRE CATEGORIA", "color": null, "teams": ["EQUIPO 1", "EQUIPO 2"] }
  ],
  "warnings": ["mensaje si algo es ambiguo"]
}

Reglas críticas:
- Detecta el formato automáticamente.
- En FORMATO COLUMNA: escanea CADA celda de CADA columna de arriba a abajo. Las celdas vacías en una columna NO terminan la categoría — continúa con las siguientes filas.
- Si una columna tiene encabezado VACÍO o NULO y está justo a la derecha de una categoría con nombre, sus equipos pertenecen a ESA MISMA categoría anterior (es una segunda columna de la misma categoría).
- Omite la primera columna si contiene números (1, 2, 3...) o está vacía — es un índice, no una categoría.
- Omite filas de título que repitan el mismo texto en todas las columnas.
- Usa el nombre exacto tal como aparece (mayúsculas, acentos).
- NO inventes equipos. Solo incluye lo visible.
- Incluye absolutamente TODOS los equipos; es fundamental no omitir ninguno.`;

const IMAGE_SYSTEM_PROMPT = `Eres un asistente que extrae datos de inscripción de equipos desde imágenes de hojas de cálculo.

ESTRUCTURA ESPERADA:
- La primera fila tiene los NOMBRES DE CATEGORÍA con fondo de color.
- Algunas categorías ocupan DOS columnas adyacentes con el mismo encabezado (p.ej. "EJECUTIVO") — combínalas en una sola categoría.
- Las filas siguientes contienen los equipos de cada categoría (una celda = un equipo).
- Las celdas vacías NO significan fin de categoría; continúa leyendo hasta el final de la tabla.

Devuelve SIEMPRE JSON puro, sin markdown:
{
  "categories": [
    {
      "name": "NOMBRE CATEGORIA",
      "color": "#hexcolor o null",
      "teams": ["EQUIPO 1", "EQUIPO 2"]
    }
  ],
  "warnings": []
}

Reglas críticas:
- Escanea CADA celda de CADA columna de arriba a abajo. No te saltes ninguna fila.
- Usa el nombre exacto tal como aparece (mayúsculas, acentos).
- color: hex del color de fondo del encabezado de la categoría.
- NO inventes equipos. Solo lo que es visible en la imagen.
- Incluye absolutamente TODOS los equipos; es fundamental no omitir ninguno.`;

const CANONICALIZE_SYSTEM_PROMPT = `Eres un asistente que normaliza nombres de clubes deportivos.

Recibirás una lista de nombres de equipos/clubes de distintas categorías.
Algunos pueden ser el mismo club con nombres ligeramente diferentes (abreviaciones, typos, palabras extra).

Devuelve JSON puro, sin markdown:
{
  "groups": [
    {
      "canonical": "Nombre canónico del club",
      "variants": ["Nombre A", "Nombre B"]
    }
  ]
}

Reglas:
- Solo agrupa si estás MUY seguro de que son el mismo club (similitud alta).
- En caso de duda, déjalos separados.
- El nombre canónico debe ser el más completo y correcto ortográficamente.
- Si un nombre no tiene variantes, omítelo de la respuesta (no hace falta incluirlo solo).`;

// ── Core AI call helpers ──────────────────────────────────────────────────────

function openaiClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

// ── Table text extraction (Excel / CSV) ───────────────────────────────────────

export async function aiExtractFromTableText(
  tableText: string,
): Promise<AIExtractionResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { categories: [], warnings: ["OPENAI_API_KEY no configurado."] };
  }

  const client = openaiClient();
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: TABLE_SYSTEM_PROMPT },
        {
          role: "user",
          content: `Extrae todas las categorías y equipos de esta tabla:\n\n${tableText}`,
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as AIExtractionResult;
    return { categories: data.categories ?? [], warnings: data.warnings ?? [] };
  } catch (e) {
    return { categories: [], warnings: [`Error de extracción: ${e instanceof Error ? e.message : "desconocido"}`] };
  }
}

// ── Image extraction ──────────────────────────────────────────────────────────

export async function aiExtractFromImage(
  imageBase64: string,
  mimeType: string,
  userInstructions?: string,
): Promise<AIExtractionResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { categories: [], warnings: ["OPENAI_API_KEY no configurado."] };
  }

  const client = openaiClient();
  const userMsg = userInstructions
    ? `Extrae todos los equipos y categorías. Instrucciones adicionales: ${userInstructions}`
    : "Extrae todos los equipos y categorías de esta imagen de tabla de inscripciones.";

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: IMAGE_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" } },
            { type: "text", text: userMsg },
          ],
        },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as AIExtractionResult;
    return { categories: data.categories ?? [], warnings: data.warnings ?? [] };
  } catch (e) {
    return { categories: [], warnings: [`Error al procesar imagen: ${e instanceof Error ? e.message : "desconocido"}`] };
  }
}

// ── Club name canonicalization ────────────────────────────────────────────────

export async function canonicalizeClubNames(rows: ParsedTeamRow[]): Promise<ParsedTeamRow[]> {
  if (!process.env.OPENAI_API_KEY) return rows;

  const uniqueNames = [...new Set(rows.map((r) => r.clubName).filter(Boolean))];
  if (uniqueNames.length === 0) return rows;

  const client = openaiClient();
  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: CANONICALIZE_SYSTEM_PROMPT },
        { role: "user", content: `Lista de clubes:\n${uniqueNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}` },
      ],
    });
    const raw = completion.choices[0]?.message?.content ?? "{}";
    const data = JSON.parse(raw) as { groups?: { canonical: string; variants: string[] }[] };
    const groups = data.groups ?? [];

    // Build a variant → canonical map
    const normMap = new Map<string, string>();
    for (const g of groups) {
      for (const v of g.variants) {
        normMap.set(v, g.canonical);
      }
    }

    return rows.map((r) => ({
      ...r,
      clubName: normMap.get(r.clubName) ?? r.clubName,
    }));
  } catch {
    return rows; // canonicalization failure is non-fatal
  }
}

// ── Convert AI category result → ImportPreview rows ──────────────────────────

export function aiResultToPreview(result: AIExtractionResult): ImportPreview {
  const rows: ParsedTeamRow[] = [];

  for (const cat of result.categories) {
    for (const team of cat.teams) {
      const name = team.trim();
      if (!name) continue;
      rows.push({
        clubName: name,        // club = team in this layout (no separate club column)
        teamName: name,
        categoryName: cat.name.trim(),
        categoryColor: cat.color ?? null,
      });
    }
  }

  const clubs = [...new Set(rows.map((r) => r.clubName))];
  const catMap = new Map<string, string | null>();
  for (const r of rows) {
    if (!catMap.has(r.categoryName)) catMap.set(r.categoryName, r.categoryColor);
  }
  const categories = [...catMap.entries()].map(([name, color]) => ({ name, color }));

  return { rows, clubs, categories, totalTeams: rows.length, warnings: result.warnings };
}
