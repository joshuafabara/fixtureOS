import ExcelJS from "exceljs";

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

const CLUB_ALIASES = ["club", "club name", "nombre club"];
const TEAM_ALIASES = ["equipo", "team", "team name", "nombre equipo"];
const CATEGORY_ALIASES = ["categoría", "categoria", "category", "cat"];
const COLOR_ALIASES = ["color", "colour", "color hex", "hex"];

function normalize(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function findCol(headers: string[], aliases: string[]): number {
  for (const alias of aliases) {
    const idx = headers.findIndex((h) => normalize(h) === alias);
    if (idx !== -1) return idx;
  }
  return -1;
}

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

  const warnings: string[] = [];
  const rows: ParsedTeamRow[] = [];

  // Try first sheet
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    return { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: ["El archivo no contiene hojas de cálculo."] };
  }

  // Find header row (first row with content in column A)
  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell) => {
    headers.push(cellStr(cell));
  });

  const colClub = findCol(headers, CLUB_ALIASES);
  const colTeam = findCol(headers, TEAM_ALIASES);
  const colCat = findCol(headers, CATEGORY_ALIASES);
  const colColor = findCol(headers, COLOR_ALIASES);

  if (colClub === -1 || colTeam === -1 || colCat === -1) {
    warnings.push(`No se encontraron columnas requeridas. Encabezados detectados: ${headers.join(", ")}. Se esperan: Club, Equipo, Categoría.`);
    return { rows: [], clubs: [], categories: [], totalTeams: 0, warnings };
  }

  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return; // skip header
    const clubName = cellStr(row.getCell(colClub + 1));
    const teamName = cellStr(row.getCell(colTeam + 1));
    const categoryName = cellStr(row.getCell(colCat + 1));
    const color = colColor !== -1 ? cellStr(row.getCell(colColor + 1)) || null : null;

    if (!clubName && !teamName && !categoryName) return; // empty row

    if (!clubName) { warnings.push(`Fila ${rowNumber}: nombre de club vacío — omitida.`); return; }
    if (!teamName) { warnings.push(`Fila ${rowNumber}: nombre de equipo vacío — omitida.`); return; }
    if (!categoryName) { warnings.push(`Fila ${rowNumber}: categoría vacía — omitida.`); return; }

    rows.push({ clubName, teamName, categoryName, categoryColor: color });
  });

  // Deduplicate clubs and categories
  const clubs = [...new Set(rows.map((r) => r.clubName))];
  const catMap = new Map<string, string | null>();
  for (const r of rows) {
    if (!catMap.has(r.categoryName)) catMap.set(r.categoryName, r.categoryColor);
  }
  const categories = [...catMap.entries()].map(([name, color]) => ({ name, color }));

  return { rows, clubs, categories, totalTeams: rows.length, warnings };
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
