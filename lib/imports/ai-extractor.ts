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

// ── Image → raw grid transcription ───────────────────────────────────────────
//
// Instead of asking the AI to extract categories directly (which loses rows),
// we ask it to transcribe the table into a raw grid (headers + rows).
// Then we run the same deterministic parseColumnLayout() that works perfectly
// on Excel/CSV — giving consistent results across multiple runs.

// Two-step approach:
// Step 1 — ask model to count teams per column (forces a careful visual scan)
// Step 2 — ask model to list teams per column using counts as constraints
// This prevents early stopping and merged-cell confusion.
const IMAGE_GRID_COUNT_PROMPT = `Eres un asistente de conteo visual. Mira esta tabla de torneo.

TAREA ÚNICA: para cada columna con un encabezado de categoría, cuenta cuántas celdas NO VACÍAS hay debajo del encabezado.

REGLAS:
- La primera columna es un índice numérico (1, 2, 3...) — IGNÓRALA.
- Si una columna tiene un encabezado FUSIONADO con la columna de su izquierda (celda fusionada), escribe el MISMO nombre de categoría para ambas columnas.
- Cuenta HASTA LA ÚLTIMA FILA, aunque la mayoría de columnas ya estén vacías en las filas inferiores.

Devuelve ÚNICAMENTE este JSON:
{
  "columns": [
    { "header": "NOMBRE CATEGORÍA", "count": N }
  ]
}`;

const IMAGE_GRID_EXTRACT_PROMPT = `Eres un asistente de extracción de tablas. Se te proporcionan los encabezados y conteos exactos de cada columna de una tabla de torneo.

Tu tarea: leer los equipos de cada columna, respetando EXACTAMENTE el conteo proporcionado.

Devuelve ÚNICAMENTE este JSON:
{
  "columns": [
    { "header": "NOMBRE CATEGORÍA", "teams": ["EQUIPO 1", "EQUIPO 2", ...] }
  ]
}

REGLAS:
- Para cada columna, el array "teams" debe tener EXACTAMENTE el número de elementos indicado en el conteo.
- Lee de arriba hacia abajo en esa columna. Si una columna tiene count=8, debes encontrar exactamente 8 equipos (los de las filas inferiores a veces son difíciles de ver — mira con cuidado hasta el fondo).
- Usa el texto EXACTO de cada celda (mayúsculas, tildes, acentos).
- Si una categoría aparece DOS VECES en los encabezados (celda fusionada), incluye ambas columnas con el mismo nombre de categoría.`;

type ImageColumn = { header: string; teams?: string[]; count?: number };

export async function aiTranscribeImageGrid(
  imageBase64: string,
  mimeType: string,
): Promise<{ headers: string[]; rows: string[][] } | null> {
  if (!process.env.OPENAI_API_KEY) return null;

  const client = openaiClient();
  const imageContent = { type: "image_url" as const, image_url: { url: `data:${mimeType};base64,${imageBase64}`, detail: "high" as const } };

  try {
    // Step 1: count teams per column (forces the model to look at the full column depth)
    const countCompletion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: IMAGE_GRID_COUNT_PROMPT },
        { role: "user", content: [imageContent, { type: "text", text: "Cuenta los equipos en cada columna de esta tabla de torneo." }] },
      ],
    });
    const countRaw = countCompletion.choices[0]?.message?.content ?? "{}";
    const countData = JSON.parse(countRaw) as { columns?: ImageColumn[] };
    const counts = countData.columns ?? [];
    console.log("[image-grid] Step 1 counts:", JSON.stringify(counts));

    if (counts.length === 0) return null;

    // Build a column spec string for step 2
    const columnSpec = counts
      .map((c, i) => `  Columna ${i + 1}: "${c.header}" — ${c.count ?? "?"} equipos`)
      .join("\n");

    // Step 2: extract teams with exact counts as constraints
    const extractCompletion = await client.chat.completions.create({
      model: "gpt-4o",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: IMAGE_GRID_EXTRACT_PROMPT },
        {
          role: "user",
          content: [
            imageContent,
            {
              type: "text",
              text: `Esta tabla tiene las siguientes columnas con estos conteos exactos:\n${columnSpec}\n\nExtrae los equipos de cada columna respetando EXACTAMENTE esos conteos.`,
            },
          ],
        },
      ],
    });
    const extractRaw = extractCompletion.choices[0]?.message?.content ?? "{}";
    const extractData = JSON.parse(extractRaw) as { columns?: ImageColumn[] };
    const extracted = extractData.columns ?? [];
    console.log("[image-grid] Step 2 extracted:", JSON.stringify(extracted.map(c => ({ header: c.header, count: c.teams?.length }))));

    if (extracted.length > 0 && extracted[0].teams !== undefined) {
      return columnsToGrid(extracted as (ImageColumn & { teams: string[] })[]);
    }

    return null;
  } catch (e) {
    console.error("[image-grid] error:", e);
    return null;
  }
}

/** Convert column-first extraction to the {headers, rows} grid format parseColumnLayout expects. */
function columnsToGrid(columns: (ImageColumn & { teams: string[] })[]): { headers: string[]; rows: string[][] } {
  const headers = columns.map((c) => c.header ?? "");
  const maxTeams = Math.max(0, ...columns.map((c) => c.teams.length));
  const rows: string[][] = [];
  for (let i = 0; i < maxTeams; i++) {
    rows.push(columns.map((c) => c.teams[i] ?? ""));
  }
  return { headers, rows };
}

// ── Image extraction (public API) ─────────────────────────────────────────────

export async function aiExtractFromImage(
  imageBase64: string,
  mimeType: string,
  userInstructions?: string,
): Promise<AIExtractionResult> {
  if (!process.env.OPENAI_API_KEY) {
    return { categories: [], warnings: ["OPENAI_API_KEY no configurado."] };
  }

  // Phase 1: transcribe the raw grid
  const grid = await aiTranscribeImageGrid(imageBase64, mimeType);

  if (grid) {
    // Phase 2: run the same deterministic column-layout parser as Excel/CSV
    const { isColumnLayout, parseColumnLayout } = await import("./column-layout");
    const fullGrid = [grid.headers, ...grid.rows];
    if (isColumnLayout(fullGrid)) {
      const { rows, warnings } = parseColumnLayout(fullGrid);
      const catMap = new Map<string, string[]>();
      for (const r of rows) {
        if (!catMap.has(r.categoryName)) catMap.set(r.categoryName, []);
        catMap.get(r.categoryName)!.push(r.teamName);
      }
      const categories: AIExtractionResult["categories"] = [...catMap.entries()].map(([name, teams]) => ({
        name,
        color: null,
        teams,
      }));
      return { categories, warnings };
    }
  }

  // Fallback: direct AI extraction (legacy path for non-column-layout images)
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
