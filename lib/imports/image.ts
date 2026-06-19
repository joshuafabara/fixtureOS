import { aiExtractFromImage, aiResultToPreview, canonicalizeClubNames } from "./ai-extractor";
import type { ImportPreview, ParsedTeamRow } from "./excel";

export type ImageExtractedRow = {
  confidence: number;
  clubName: string;
  teamName: string;
  categoryName: string;
  categoryColor: string | null;
  status: string;
  flag: "new" | "lowconf" | "review" | null;
};

export type ImageExtractionResult = {
  rows: ImageExtractedRow[];
  warnings: string[];
  preview: ImportPreview;
};

export async function extractTeamsFromImage(
  imageBase64: string,
  mimeType: string,
  userPrompt?: string,
): Promise<ImageExtractionResult> {
  const emptyPreview: ImportPreview = { rows: [], clubs: [], categories: [], totalTeams: 0, warnings: [] };

  const aiResult = await aiExtractFromImage(imageBase64, mimeType, userPrompt);

  if (aiResult.categories.length === 0) {
    return { rows: [], warnings: aiResult.warnings, preview: { ...emptyPreview, warnings: aiResult.warnings } };
  }

  const preview = aiResultToPreview(aiResult);
  const canonicalRows = await canonicalizeClubNames(preview.rows);

  const updatedPreview: ImportPreview = {
    ...preview,
    rows: canonicalRows,
    clubs: [...new Set(canonicalRows.map((r) => r.clubName))],
  };

  // Confidence=95 by default; the AI extraction is category-level, not row-level
  const rows: ImageExtractedRow[] = canonicalRows.map((r) => ({
    confidence: 95,
    clubName: r.clubName,
    teamName: r.teamName,
    categoryName: r.categoryName,
    categoryColor: r.categoryColor,
    status: "active",
    flag: null,
  }));

  return { rows, warnings: aiResult.warnings, preview: updatedPreview };
}
