import { canonicalizeClubNames, aiExtractFromTableText, aiResultToPreview } from "./ai-extractor";
import { isColumnLayout, parseColumnLayout, rowsToPreview } from "./column-layout";
import type { ImportPreview } from "./excel";

function parseCSVGrid(text: string): string[][] {
  const grid: string[][] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trimEnd();
    if (!line) continue;
    const cells: string[] = [];
    let inQuote = false;
    let cur = "";
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuote && line[i + 1] === '"') { cur += '"'; i++; }
        else inQuote = !inQuote;
      } else if (ch === "," && !inQuote) {
        cells.push(cur.trim());
        cur = "";
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());
    if (cells.some((c) => c)) grid.push(cells);
  }
  return grid;
}

export async function parseCSVBuffer(buffer: Buffer): Promise<ImportPreview> {
  const text = buffer.toString("utf-8").trim();
  if (!text) {
    return { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: ["El archivo CSV está vacío."] };
  }

  const grid = parseCSVGrid(text);
  if (grid.length === 0) {
    return { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: ["El CSV no contiene datos válidos."] };
  }

  let preview: ImportPreview;
  if (isColumnLayout(grid)) {
    const { rows, warnings } = parseColumnLayout(grid);
    preview = rowsToPreview(rows, warnings);
  } else {
    const tableText = grid.map((r) => r.join("\t")).join("\n");
    const aiResult = await aiExtractFromTableText(tableText);
    preview = aiResultToPreview(aiResult);
  }

  const canonicalRows = await canonicalizeClubNames(preview.rows);
  const clubs = [...new Set(canonicalRows.map((r) => r.clubName))];

  return { ...preview, rows: canonicalRows, clubs };
}
