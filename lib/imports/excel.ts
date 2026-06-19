import ExcelJS from "exceljs";
import { canonicalizeClubNames } from "./ai-extractor";
import { isColumnLayout, parseColumnLayout, rowsToPreview } from "./column-layout";
import { aiExtractFromTableText, aiResultToPreview } from "./ai-extractor";

export type ParsedTeamRow = {
  clubName: string;
  teamName: string;
  categoryName: string;
  categoryColor: string | null;
};

export type ImportPreview = {
  rows: ParsedTeamRow[];
  clubs: string[];
  categories: { name: string; color: string | null }[];
  totalTeams: number;
  warnings: string[];
};

function cellStr(cell: ExcelJS.Cell): string {
  const v = cell.value;
  if (v === null || v === undefined) return "";
  if (typeof v === "string") return v.trim();
  if (typeof v === "number") return String(v);
  if (typeof v === "object" && "text" in (v as object)) return String((v as { text: unknown }).text).trim();
  return String(v).trim();
}

export async function parseExcelBuffer(buffer: Buffer): Promise<ImportPreview> {
  const workbook = new ExcelJS.Workbook();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await workbook.xlsx.load(buffer as any);

  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: ["El archivo no contiene hojas de cálculo."] };
  }

  // Build a 2D grid (rows × cols) from the sheet
  const grid: string[][] = [];
  sheet.eachRow({ includeEmpty: false }, (row) => {
    const cells: string[] = [];
    row.eachCell({ includeEmpty: true }, (cell) => {
      cells.push(cellStr(cell));
    });
    if (cells.some((c) => c)) grid.push(cells);
  });

  if (grid.length === 0) {
    return { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: ["El archivo está vacío."] };
  }

  let preview: ImportPreview;
  if (isColumnLayout(grid)) {
    // Fast deterministic path — no AI needed for extraction
    const { rows, warnings } = parseColumnLayout(grid);
    preview = rowsToPreview(rows, warnings);
  } else {
    // Row-per-team layout — delegate to AI
    const tableText = grid.map((r) => r.join("\t")).join("\n");
    const aiResult = await aiExtractFromTableText(tableText);
    preview = aiResultToPreview(aiResult);
  }

  // AI canonicalization: normalize club name variants across categories
  const canonicalRows = await canonicalizeClubNames(preview.rows);
  const clubs = [...new Set(canonicalRows.map((r) => r.clubName))];

  return { ...preview, rows: canonicalRows, clubs };
}

export function generateExcelTemplate(): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Equipos");

  sheet.columns = [
    { header: "Club", key: "club", width: 20 },
    { header: "Equipo", key: "equipo", width: 25 },
    { header: "Categoría", key: "categoria", width: 20 },
    { header: "Color", key: "color", width: 12 },
  ];

  // Style header row
  const headerRow = sheet.getRow(1);
  headerRow.font = { bold: true };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } };

  // Example rows
  sheet.addRow({ club: "Spartans BC", equipo: "Spartans U12", categoria: "U12 Masculino", color: "#3b82f6" });
  sheet.addRow({ club: "Spartans BC", equipo: "Spartans U14", categoria: "U14 Masculino", color: "#f59e0b" });
  sheet.addRow({ club: "CVU Quito", equipo: "CVU U12", categoria: "U12 Masculino", color: "#3b82f6" });

  return workbook.xlsx.writeBuffer() as unknown as Promise<Buffer>;
}
