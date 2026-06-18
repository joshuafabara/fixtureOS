import type { ImportPreview, ParsedTeamRow } from "./excel";

const CLUB_ALIASES = ["club", "club name", "nombre club"];
const TEAM_ALIASES = ["equipo", "team", "team name", "nombre equipo"];
const CATEGORY_ALIASES = ["categoría", "categoria", "category", "cat"];
const COLOR_ALIASES = ["color", "colour", "color hex", "hex"];
const STATUS_ALIASES = ["estado", "status", "state"];

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function findCol(headers: string[], aliases: string[]): number {
  return headers.findIndex((h) => aliases.includes(norm(h)));
}

// RFC 4180-compatible CSV parser (handles quoted fields with embedded commas/newlines)
function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuote = false;
  const len = text.length;

  for (let i = 0; i < len; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQuote) {
      if (ch === '"' && next === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        inQuote = false;
      } else {
        field += ch;
      }
    } else {
      if (ch === '"') {
        inQuote = true;
      } else if (ch === ",") {
        row.push(field);
        field = "";
      } else if (ch === "\r" && next === "\n") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i++;
      } else if (ch === "\n" || ch === "\r") {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
      } else {
        field += ch;
      }
    }
  }
  // last field / row
  if (field || row.length > 0) {
    row.push(field);
    if (row.some((f) => f.trim())) rows.push(row);
  }

  return rows;
}

export async function parseCSVBuffer(buffer: Buffer): Promise<ImportPreview> {
  const text = buffer.toString("utf-8");
  const allRows = parseCSV(text).filter((r) => r.some((f) => f.trim()));

  if (allRows.length < 2) {
    return { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: ["El archivo CSV está vacío o sólo tiene encabezados."] };
  }

  const headers = allRows[0].map((h) => h.trim());
  const colClub = findCol(headers, CLUB_ALIASES);
  const colTeam = findCol(headers, TEAM_ALIASES);
  const colCat = findCol(headers, CATEGORY_ALIASES);
  const colColor = findCol(headers, COLOR_ALIASES);
  const colStatus = findCol(headers, STATUS_ALIASES);

  const warnings: string[] = [];

  if (colClub === -1 || colTeam === -1 || colCat === -1) {
    warnings.push(`No se encontraron columnas requeridas. Encabezados: ${headers.join(", ")}. Se esperan: Club, Equipo, Categoría.`);
    return { rows: [], clubs: [], categories: [], totalTeams: 0, warnings };
  }

  const rows: ParsedTeamRow[] = [];

  for (let i = 1; i < allRows.length; i++) {
    const r = allRows[i];
    const clubName = (r[colClub] ?? "").trim();
    const teamName = (r[colTeam] ?? "").trim();
    const categoryName = (r[colCat] ?? "").trim();
    const color = colColor !== -1 ? (r[colColor] ?? "").trim() || null : null;

    if (!clubName && !teamName && !categoryName) continue;
    if (!clubName) { warnings.push(`Fila ${i + 1}: nombre de club vacío — omitida.`); continue; }
    if (!teamName) { warnings.push(`Fila ${i + 1}: nombre de equipo vacío — omitida.`); continue; }
    if (!categoryName) { warnings.push(`Fila ${i + 1}: categoría vacía — omitida.`); continue; }

    rows.push({ clubName, teamName, categoryName, categoryColor: color });
  }

  const clubs = [...new Set(rows.map((r) => r.clubName))];
  const catMap = new Map<string, string | null>();
  for (const r of rows) {
    if (!catMap.has(r.categoryName)) catMap.set(r.categoryName, r.categoryColor);
  }
  const categories = [...catMap.entries()].map(([name, color]) => ({ name, color }));

  return { rows, clubs, categories, totalTeams: rows.length, warnings };
}
