/**
 * Deterministic parser for column-per-category spreadsheet layouts.
 *
 * Layout rule:
 *  - Row 0 (or first non-title row): category names as column headers
 *  - A blank/numeric header adjacent to a named header = continuation of that category
 *  - Rows 1+: team names under each category column; empty cells skipped
 *  - Column 0 may be an empty index or row number — skip it
 */
import type { ParsedTeamRow, ImportPreview } from "./excel";

export type ColumnGrid = string[][]; // [rowIndex][colIndex]

function isNumeric(s: string) { return /^\d+$/.test(s.trim()); }
function isBlank(s: string) { return !s.trim(); }

/**
 * Detects whether the grid uses a column-per-category layout.
 * Heuristic: header row has >= 3 non-empty, non-numeric cells that look like category names,
 * AND the data rows have values spread across multiple columns.
 */
export function isColumnLayout(grid: ColumnGrid): boolean {
  if (grid.length < 2) return false;

  // Find the header row: first row where multiple cells have non-numeric, non-blank content
  const headerRow = grid[0];
  const namedCols = headerRow.filter((c) => !isBlank(c) && !isNumeric(c));

  // If >= 3 distinct-looking category names in the header, it's column layout
  return namedCols.length >= 3;
}

/**
 * Parses a column-per-category grid into ParsedTeamRow[].
 * Handles:
 * - Blank/numeric first column (index column → skip)
 * - Blank headers adjacent to a named header (continuation columns)
 * - Title rows (all cells identical → skip)
 */
export function parseColumnLayout(grid: ColumnGrid): { rows: ParsedTeamRow[]; warnings: string[] } {
  const warnings: string[] = [];
  const rows: ParsedTeamRow[] = [];

  if (grid.length < 2) return { rows, warnings: ["Tabla vacía."] };

  // Detect and skip title rows (all cells the same non-empty value)
  let headerRowIdx = 0;
  for (let ri = 0; ri < Math.min(grid.length, 3); ri++) {
    const vals = grid[ri].map((c) => c.trim()).filter(Boolean);
    const unique = new Set(vals);
    if (unique.size === 1 && vals.length > 1) {
      // Title row (e.g. "EQUIPOS Y CATEGORIAS" merged across all columns)
      headerRowIdx = ri + 1;
    } else {
      break;
    }
  }

  const headerRow = grid[headerRowIdx] ?? [];

  // Build column → category name map
  // Blank or numeric header after a named header = same category (continuation)
  const colCat: string[] = [];
  let lastCat = "";
  for (let ci = 0; ci < headerRow.length; ci++) {
    const h = headerRow[ci]?.trim() ?? "";
    if (isBlank(h) || isNumeric(h)) {
      // Index column or continuation column
      colCat.push(lastCat); // "" for index col, lastCat for continuation
    } else {
      colCat.push(h);
      lastCat = h;
    }
  }

  // Parse data rows
  for (let ri = headerRowIdx + 1; ri < grid.length; ri++) {
    const row = grid[ri];
    let anyValue = false;
    for (let ci = 0; ci < row.length; ci++) {
      const cat = colCat[ci];
      if (!cat) continue; // index column or no category assigned
      const cell = (row[ci] ?? "").trim();
      if (!cell || isNumeric(cell)) continue;
      anyValue = true;
      rows.push({ clubName: cell, teamName: cell, categoryName: cat, categoryColor: null });
    }
    void anyValue;
  }

  if (rows.length === 0) {
    warnings.push("No se encontraron equipos en la tabla.");
  }

  return { rows, warnings };
}

/** Build ImportPreview from parsed rows (before canonicalization). */
export function rowsToPreview(rows: ParsedTeamRow[], warnings: string[]): ImportPreview {
  const clubs = [...new Set(rows.map((r) => r.clubName))];
  const catMap = new Map<string, string | null>();
  for (const r of rows) {
    if (!catMap.has(r.categoryName)) catMap.set(r.categoryName, r.categoryColor);
  }
  const categories = [...catMap.entries()].map(([name, color]) => ({ name, color }));
  return { rows, clubs, categories, totalTeams: rows.length, warnings };
}
