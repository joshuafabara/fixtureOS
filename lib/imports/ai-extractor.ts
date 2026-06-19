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

const IMAGE_SYSTEM_PROMPT = `Eres un experto en extraer datos de tablas desde imágenes de hojas de cálculo de torneos deportivos.

ESTRUCTURA DE LA TABLA:
- La PRIMERA FILA contiene los NOMBRES DE CATEGORÍA (con fondo de color).
- Cada columna debajo de un encabezado lista los EQUIPOS de esa categoría (una celda = un equipo).
- Algunas categorías ocupan DOS columnas adyacentes con el MISMO encabezado (p.ej. "EJECUTIVO") — DEBES combinar todos sus equipos en una sola categoría.
- Las celdas vacías NO terminan la lista; la columna puede continuar teniendo equipos en filas posteriores.
- La primera columna a veces es un índice numérico (1, 2, 3…) — IGNÓRALA, no es una categoría.

TU TAREA: extraer CADA equipo de CADA columna, sin excepción.

Proceso obligatorio para cada columna:
1. Identifica el nombre de la categoría en la primera fila.
2. Lee TODAS las filas de esa columna de arriba a abajo.
3. Agrega cada celda no vacía y no numérica como un equipo.
4. Si el encabezado está vacío o es el mismo que la columna anterior, los equipos pertenecen a la categoría anterior.

Devuelve ÚNICAMENTE JSON puro (sin markdown, sin código, sin explicación):
{
  "categories": [
    {
      "name": "NOMBRE CATEGORIA",
      "color": "#hexcolor o null",
      "teams": ["EQUIPO 1", "EQUIPO 2", "EQUIPO 3"]
    }
  ],
  "warnings": []
}

Reglas absolutas:
- NUNCA omitas equipos. Contar equipos faltantes es el error más grave.
- Si hay N categorías, el JSON debe tener exactamente N objetos en "categories".
- Usa el texto EXACTO de cada celda (mayúsculas, tildes, caracteres especiales).
- color: aproxima el color de fondo del encabezado en hexadecimal, o null si no hay color.
- NO inventes equipos que no estén visibles en la imagen.`;

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

// ── Image → category extraction ──────────────────────────────────────────────
//
// Direct single-step extraction from image to categories.
// Grid-based and count-based approaches were tried and produced worse results
// (57/78 teams) because GPT-4o counts cells unreliably — wrong counts in step 1
// then constrain step 2 to extract fewer teams than actually exist.
// This single-step approach with explicit structural hints gives the best results.

const IMAGE_EXTRACT_PROMPT = `Eres un experto en leer tablas de inscripción de equipos deportivos desde imágenes.

ESTRUCTURA DE LA TABLA:
- La PRIMERA FILA tiene los NOMBRES DE CATEGORÍA como encabezados de columna.
- Cada columna debajo del encabezado lista los EQUIPOS de esa categoría.
- La primera columna puede ser un índice numérico (1,2,3…) — IGNÓRALA.

REGLA CRÍTICA SOBRE CELDAS FUSIONADAS:
Una o más categorías pueden tener su encabezado FUSIONADO sobre DOS columnas adyacentes.
Cuando veas dos columnas adyacentes donde solo la izquierda tiene nombre visible y la derecha parece sin encabezado — sus equipos son de la MISMA categoría. Combínalos todos en UNA entrada.
Ejemplo: "EJECUTIVO" fusionado sobre 2 columnas → una sola categoría "EJECUTIVO" con TODOS los equipos de ambas columnas.

REGLA CRÍTICA SOBRE FILAS INFERIORES:
La tabla tiene equipos hasta la ÚLTIMA FILA. En las filas inferiores (7, 8, 9…) algunas columnas están vacías pero OTRAS tienen equipos. Lee TODAS las filas hasta el final de la imagen — NO te detengas antes.

Devuelve ÚNICAMENTE JSON (sin markdown):
{
  "categories": [
    { "name": "NOMBRE CATEGORIA", "color": "#hexcolor o null", "teams": ["EQUIPO 1", "EQUIPO 2"] }
  ],
  "warnings": []
}

Reglas adicionales:
- Usa el texto EXACTO de cada celda.
- color: aproxima el color de fondo del encabezado en hex, o null.
- NO inventes equipos. Solo incluye lo visible.
- NO omitas ningún equipo de ninguna fila.`;

// ── Image extraction (public API) ─────────────────────────────────────────────

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
    : "Extrae TODOS los equipos y categorías de esta tabla. Incluye categorías con celdas fusionadas como una sola entrada y lee hasta la última fila.";

  try {
    const completion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: IMAGE_EXTRACT_PROMPT },
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
    console.log("[image-extract] raw:", raw.slice(0, 400));
    const data = JSON.parse(raw) as AIExtractionResult;
    const result = { categories: data.categories ?? [], warnings: data.warnings ?? [] };
    console.log("[image-extract] categories:", result.categories.map(c => `${c.name}:${c.teams.length}`).join(", "));
    return result;
  } catch (e) {
    return { categories: [], warnings: [`Error al procesar imagen: ${e instanceof Error ? e.message : "desconocido"}`] };
  }
}

// Keep export for tests that reference it (returns null — grid path removed)
export async function aiTranscribeImageGrid(
  _imageBase64: string,
  _mimeType: string,
): Promise<{ headers: string[]; rows: string[][] } | null> {
  return null;
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
