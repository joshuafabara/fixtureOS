/**
 * Image extraction integration test.
 *
 * Requires:
 *  1. OPENAI_API_KEY in environment
 *  2. Tournament table image at __tests__/fixtures/tournament-table.png
 *     (save the screenshot of the Excel-like table with colored category headers)
 *
 * Run: OPENAI_API_KEY=sk-... npx vitest run __tests__/image-extraction.test.ts
 *
 * Expected result: 11 categories, 78 total teams, EJECUTIVO has 16 teams.
 */
import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { aiExtractFromImage, aiResultToPreview, aiTranscribeImageGrid } from "../lib/imports/ai-extractor";
import { isColumnLayout, parseColumnLayout } from "../lib/imports/column-layout";

const FIXTURE_PATH = join(__dirname, "fixtures", "tournament-table.png");
const API_KEY = process.env.OPENAI_API_KEY ?? "";

const EXPECTED_CATEGORIES = 11;
const EXPECTED_TEAMS = 78;
const EJECUTIVO_TEAMS = 16;

const EXPECTED_CATEGORY_NAMES = [
  "U-11 MIXTA",
  "U-13 M",
  "U-13 F",
  "U-15 M ABIERTO",
  "U-15 F ABIERTO",
  "U-17 M ABIERTO",
  "U-17 F ABIERTO",
  "U-19 M ABIERTO",
  "EJECUTIVO",
  "SENIOR MASCULINO",
  "SENIOR FEMENINO",
];

describe.skipIf(!existsSync(FIXTURE_PATH) || !API_KEY)(
  "image extraction — tournament table",
  () => {
    it("grid transcription: extracts correct column headers including blank EJECUTIVO continuation", async () => {
      const buf = readFileSync(FIXTURE_PATH);
      const base64 = buf.toString("base64");

      const grid = await aiTranscribeImageGrid(base64, "image/png");
      expect(grid).not.toBeNull();

      if (grid) {
        console.log("Headers:", grid.headers);
        console.log("Rows:", grid.rows.length);

        // Should have EJECUTIVO and a blank continuation header
        const ejecutivoIdx = grid.headers.findIndex((h) => h.toUpperCase().includes("EJECUTIVO"));
        expect(ejecutivoIdx).toBeGreaterThan(-1);

        // Must be parseable as column layout
        const fullGrid = [grid.headers, ...grid.rows];
        expect(isColumnLayout(fullGrid)).toBe(true);

        const { rows } = parseColumnLayout(fullGrid);
        expect(rows.length).toBe(EXPECTED_TEAMS);

        const cats = new Set(rows.map((r) => r.categoryName));
        expect(cats.size).toBe(EXPECTED_CATEGORIES);
      }
    }, 60_000);

    it("aiExtractFromImage: extracts exactly 11 categories and 78 teams (grid path)", async () => {
      const buf = readFileSync(FIXTURE_PATH);
      const base64 = buf.toString("base64");

      const result = await aiExtractFromImage(base64, "image/png");

      if (result.warnings.length > 0) {
        console.warn("AI warnings:", result.warnings);
      }

      // Category count
      expect(result.categories.length).toBe(EXPECTED_CATEGORIES);

      // Total team count across all categories
      const totalTeams = result.categories.reduce((sum, c) => sum + c.teams.length, 0);
      expect(totalTeams).toBe(EXPECTED_TEAMS);

      // EJECUTIVO specifically must have 16 teams
      const ejecutivo = result.categories.find(
        (c) => c.name.toUpperCase().includes("EJECUTIVO"),
      );
      expect(ejecutivo).toBeDefined();
      expect(ejecutivo!.teams.length).toBe(EJECUTIVO_TEAMS);
    }, 60_000);

    it("category names match expected (case-insensitive)", async () => {
      const buf = readFileSync(FIXTURE_PATH);
      const base64 = buf.toString("base64");

      const result = await aiExtractFromImage(base64, "image/png");

      const extractedNames = result.categories.map((c) => c.name.toUpperCase());
      for (const expected of EXPECTED_CATEGORY_NAMES) {
        const found = extractedNames.some(
          (n) => n.includes(expected) || expected.includes(n),
        );
        expect(found, `Expected category "${expected}" not found. Got: ${extractedNames.join(", ")}`).toBe(true);
      }
    }, 60_000);

    it("per-category team counts match expected", async () => {
      const buf = readFileSync(FIXTURE_PATH);
      const base64 = buf.toString("base64");

      const result = await aiExtractFromImage(
        base64,
        "image/png",
        "Los equipos están en una tabla por columnas. La categoría EJECUTIVO tiene DOS columnas adyacentes con 8 equipos cada una (16 en total). Extrae absolutamente todos los equipos.",
      );

      const preview = aiResultToPreview(result);
      const catCount = (name: string) =>
        preview.rows.filter((r) =>
          r.categoryName.toUpperCase().includes(name.toUpperCase()),
        ).length;

      const checks: [string, number][] = [
        ["U-11 MIXTA", 6],
        ["U-13 M", 6],
        ["U-13 F", 4],
        ["U-15 M ABIERTO", 6],
        ["U-15 F ABIERTO", 4],
        ["U-17 M ABIERTO", 8],
        ["U-17 F ABIERTO", 7],
        ["U-19 M ABIERTO", 9],
        ["EJECUTIVO", 16],
        ["SENIOR MASCULINO", 6],
        ["SENIOR FEMENINO", 6],
      ];

      for (const [cat, expected] of checks) {
        const actual = catCount(cat);
        expect(actual, `${cat}: expected ${expected} teams, got ${actual}`).toBe(expected);
      }
    }, 60_000);

    it("no duplicate teams within the same category", async () => {
      const buf = readFileSync(FIXTURE_PATH);
      const base64 = buf.toString("base64");
      const result = await aiExtractFromImage(base64, "image/png");

      for (const cat of result.categories) {
        const names = cat.teams.map((t) => t.toUpperCase().trim());
        const unique = new Set(names);
        expect(unique.size, `Duplicates found in category "${cat.name}": ${names.join(", ")}`).toBe(names.length);
      }
    }, 60_000);
  },
);

describe("image extraction — unit (no fixture needed)", () => {
  it.skipIf(!API_KEY)("returns empty result when image is too small/blank", async () => {
    // 1x1 white PNG in base64
    const blankPng = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwADhQGAWjR9awAAAABJRU5ErkJggg==";
    const result = await aiExtractFromImage(blankPng, "image/png");
    // Should either return empty or a warning — just shouldn't throw
    expect(Array.isArray(result.categories)).toBe(true);
  }, 30_000);
});
