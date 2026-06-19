import type { ParsedTeamRow } from "./excel";

export type DiffType =
  | "newclub" | "newcat" | "newteam"
  | "rename" | "color" | "moved" | "retired"
  | "missing" | "duplicate" | "ambiguous";

export type DiffDecisionOption = string;

export type DiffRow = {
  id: string;
  type: DiffType;
  entity: string;
  cat: string | null; // category color key hint
  current: string;
  imported: string;
  decisions: DiffDecisionOption[];
  note?: string;
  impact?: boolean;
  needsError?: boolean;
  sev?: "warn";
};

export type DiffSummary = {
  newclubs: number;
  newcats: number;
  newteams: number;
  updates: number;
  warnings: number;
  impacts: number;
};

export type ExistingClub = { id: string; name: string; normalizedName: string };
export type ExistingCategory = { id: string; name: string; colorHex: string | null };
export type ExistingTeam = { id: string; name: string; normalizedName: string; categoryId: string; clubId: string | null; status: string };

function norm(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function similarity(a: string, b: string): number {
  const na = norm(a), nb = norm(b);
  if (na === nb) return 1;
  if (na.includes(nb) || nb.includes(na)) return 0.85;
  // simple bigram overlap
  const bigrams = (s: string) => new Set(Array.from({ length: s.length - 1 }, (_, i) => s.slice(i, i + 2)));
  const ba = bigrams(na), bb = bigrams(nb);
  const inter = [...ba].filter((g) => bb.has(g)).length;
  const union = new Set([...ba, ...bb]).size;
  return union === 0 ? 0 : inter / union;
}

/**
 * For "create" mode (new tournament from scratch), there is nothing to diff against.
 * This returns the counts of what will be created, without requiring existing data.
 */
export function computeCreateSummary(rows: ParsedTeamRow[]): { diff: DiffRow[]; summary: DiffSummary } {
  const uniqueClubs = [...new Set(rows.map((r) => r.clubName))];
  const uniqueCats = [...new Set(rows.map((r) => r.categoryName))];

  const summary: DiffSummary = {
    newclubs: uniqueClubs.length,
    newcats: uniqueCats.length,
    newteams: rows.length,
    updates: 0,
    warnings: 0,
    impacts: 0,
  };

  // Lightweight diff rows so the review UI has something to filter/read
  let idSeq = 0;
  const nextId = () => `d${++idSeq}`;
  const diff: DiffRow[] = [];
  const seenClubs = new Set<string>();
  const seenCats = new Set<string>();

  for (const row of rows) {
    if (!seenClubs.has(row.clubName)) {
      seenClubs.add(row.clubName);
      diff.push({
        id: nextId(), type: "newclub",
        entity: row.clubName, cat: null,
        current: "—",
        imported: `${row.clubName} · ${rows.filter((r) => r.clubName === row.clubName).length} equipo(s)`,
        decisions: ["Crear Nuevo"],
      });
    }
    if (!seenCats.has(row.categoryName)) {
      seenCats.add(row.categoryName);
      diff.push({
        id: nextId(), type: "newcat",
        entity: row.categoryName, cat: null,
        current: "—",
        imported: `${row.categoryName}${row.categoryColor ? ` · color ${row.categoryColor}` : ""}`,
        decisions: ["Crear (inactiva)"],
        note: "Quedará inactiva hasta definir fecha de inicio y modo de juego.",
      });
    }
    diff.push({
      id: nextId(), type: "newteam",
      entity: row.teamName, cat: null,
      current: "—",
      imported: `${row.teamName} · ${row.categoryName}`,
      decisions: ["Crear Nuevo"],
    });
  }

  return { diff, summary };
}

export function computeDiff(
  importedRows: ParsedTeamRow[],
  existingClubs: ExistingClub[],
  existingCats: ExistingCategory[],
  existingTeams: ExistingTeam[]
): { diff: DiffRow[]; summary: DiffSummary } {
  const diff: DiffRow[] = [];
  let idSeq = 0;
  const nextId = () => `d${++idSeq}`;

  const clubMap = new Map(existingClubs.map((c) => [c.normalizedName, c]));
  const catMap = new Map(existingCats.map((c) => [norm(c.name), c]));
  const teamMap = new Map(existingTeams.map((t) => [t.normalizedName + "|" + t.categoryId, t]));

  const seenClubs = new Set<string>();
  const seenCats = new Set<string>();
  const seenTeamKeys = new Map<string, number>(); // normalized teamName|catNorm → count

  // Count duplicates in incoming data
  for (const row of importedRows) {
    const key = norm(row.teamName) + "|" + norm(row.categoryName);
    seenTeamKeys.set(key, (seenTeamKeys.get(key) ?? 0) + 1);
  }

  for (const row of importedRows) {
    const normClub = norm(row.clubName);
    const normCat = norm(row.categoryName);
    const normTeam = norm(row.teamName);

    // --- Club ---
    if (!seenClubs.has(normClub)) {
      seenClubs.add(normClub);
      const existingClub = clubMap.get(normClub);
      if (!existingClub) {
        // Check for fuzzy match
        const fuzzy = existingClubs.find((c) => similarity(c.name, row.clubName) >= 0.8 && similarity(c.name, row.clubName) < 1);
        if (fuzzy) {
          diff.push({
            id: nextId(), type: "ambiguous",
            entity: `${row.clubName} / ${fuzzy.name}`, cat: null,
            current: `${fuzzy.name} (existe)`, imported: `${row.clubName} · confianza ${Math.round(similarity(fuzzy.name, row.clubName) * 100)}%`,
            decisions: ["Vincular Existente", "Crear Nuevo"], needsError: true, sev: "warn",
          });
        } else {
          diff.push({
            id: nextId(), type: "newclub",
            entity: row.clubName, cat: null,
            current: "—", imported: `${row.clubName} · ${importedRows.filter((r) => norm(r.clubName) === normClub).length} equipos`,
            decisions: ["Crear Nuevo", "Ignorar Fila"],
          });
        }
      }
    }

    // --- Category ---
    if (!seenCats.has(normCat)) {
      seenCats.add(normCat);
      const existingCat = catMap.get(normCat);
      if (!existingCat) {
        diff.push({
          id: nextId(), type: "newcat",
          entity: row.categoryName, cat: null,
          current: "—", imported: `${row.categoryName}${row.categoryColor ? ` · color ${row.categoryColor}` : ""}`,
          decisions: ["Crear (inactiva)", "Ignorar Fila"],
          note: "Quedará inactiva hasta definir fecha de inicio y modo de juego.",
        });
      } else if (row.categoryColor && existingCat.colorHex && norm(row.categoryColor) !== norm(existingCat.colorHex)) {
        diff.push({
          id: nextId(), type: "color",
          entity: row.categoryName, cat: null,
          current: existingCat.colorHex, imported: row.categoryColor,
          decisions: ["Mantener color", "Actualizar color"],
          note: "El color se aplica tras confirmar; no afecta el fixture.",
        });
      }
    }

    // --- Team ---
    const existingCat = catMap.get(normCat);
    if (!existingCat) continue; // new category, team is implicitly new

    const teamKey = normTeam + "|" + existingCat.id;
    const existingTeam = teamMap.get(teamKey);
    const dupeCount = seenTeamKeys.get(normTeam + "|" + normCat) ?? 0;

    if (dupeCount > 1) {
      // Only add duplicate entry once
      if (!diff.some((d) => d.type === "duplicate" && norm(d.entity) === normTeam)) {
        diff.push({
          id: nextId(), type: "duplicate",
          entity: row.teamName, cat: null,
          current: existingTeam ? "Existe" : "—", imported: `Aparece ${dupeCount} veces en el archivo`,
          decisions: ["Vincular Existente", "Crear Nuevo", "Ignorar Fila"], needsError: true, sev: "warn",
        });
      }
      continue;
    }

    if (!existingTeam) {
      // Check fuzzy rename match
      const fuzzyTeam = existingTeams.find(
        (t) => t.categoryId === existingCat.id && similarity(t.name, row.teamName) >= 0.75 && similarity(t.name, row.teamName) < 1
      );
      if (fuzzyTeam) {
        diff.push({
          id: nextId(), type: "rename",
          entity: row.teamName, cat: null,
          current: fuzzyTeam.name, imported: row.teamName,
          decisions: ["Mantener Existente", "Confirmar Rename"],
          note: "El renombrado no se aplica automáticamente. Requiere confirmación.",
        });
      } else {
        diff.push({
          id: nextId(), type: "newteam",
          entity: row.teamName, cat: null,
          current: "—", imported: `${row.teamName} · ${row.categoryName}`,
          decisions: ["Crear Nuevo", "Ignorar Fila"],
        });
      }
    }
  }

  // Missing from source (teams in DB not in import)
  const importedTeamNorms = new Set(importedRows.map((r) => norm(r.teamName) + "|" + norm(r.categoryName)));
  for (const t of existingTeams) {
    const cat = existingCats.find((c) => c.id === t.categoryId);
    if (!cat) continue;
    const key = t.normalizedName + "|" + norm(cat.name);
    if (!importedTeamNorms.has(key) && t.status !== "retired") {
      diff.push({
        id: nextId(), type: "missing",
        entity: t.name, cat: null,
        current: `Existe · categoría ${cat.name}`, imported: "No aparece en el archivo",
        decisions: ["Mantener Existente", "Equipo Retirado", "Marcar removido"],
        note: "Los datos existentes nunca se eliminan automáticamente.", sev: "warn",
      });
    }
  }

  const summary: DiffSummary = {
    newclubs: diff.filter((d) => d.type === "newclub").length,
    newcats: diff.filter((d) => d.type === "newcat").length,
    newteams: diff.filter((d) => d.type === "newteam").length,
    updates: diff.filter((d) => ["rename", "color", "moved"].includes(d.type)).length,
    warnings: diff.filter((d) => d.sev === "warn").length,
    impacts: diff.filter((d) => d.impact).length,
  };

  return { diff, summary };
}
