/**
 * Category color assignment.
 * Every category in a tournament must have a unique hex color.
 * Colors are picked from CATEGORY_PALETTE, preferring colors not used
 * anywhere else in the organization before falling back to colors used
 * in other tournaments.
 */

export const CATEGORY_PALETTE = [
  "#E53935", // Red
  "#F57C00", // Orange
  "#FBC02D", // Amber
  "#43A047", // Green
  "#00ACC1", // Cyan
  "#1E88E5", // Blue
  "#5E35B1", // Deep Purple
  "#D81B60", // Pink
  "#6D4C41", // Brown
  "#546E7A", // Blue Grey
  "#00897B", // Teal
  "#7CB342", // Light Green
  "#8E24AA", // Purple
  "#039BE5", // Light Blue
  "#C62828", // Dark Red
  "#2E7D32", // Dark Green
  "#1565C0", // Dark Blue
  "#AD1457", // Dark Pink
  "#00695C", // Dark Teal
  "#4527A0", // Indigo
  "#EF6C00", // Deep Orange
  "#558B2F", // Olive Green
  "#0277BD", // Light Blue Dark
  "#6A1B9A", // Violet
];

/**
 * Pick N unique colors for new categories.
 *
 * @param usedInTournament - hex colors already assigned in this tournament
 * @param usedInOrg        - hex colors used in other tournaments in the org (soft-avoid)
 * @param count            - number of colors needed
 */
export function pickColors(
  usedInTournament: string[],
  usedInOrg: string[],
  count: number,
): string[] {
  const takenHere = new Set(usedInTournament.map((c) => c.toLowerCase()));
  const takenOrg  = new Set(usedInOrg.map((c) => c.toLowerCase()));

  // Prefer colors used nowhere in the org; fall back to org-used ones
  const free     = CATEGORY_PALETTE.filter((c) => !takenHere.has(c.toLowerCase()) && !takenOrg.has(c.toLowerCase()));
  const orgUsed  = CATEGORY_PALETTE.filter((c) => !takenHere.has(c.toLowerCase()) &&  takenOrg.has(c.toLowerCase()));
  const pool     = [...free, ...orgUsed];

  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    if (pool.length > 0) {
      const color = pool.shift()!;
      takenHere.add(color.toLowerCase()); // mark used for subsequent picks in this batch
      result.push(color);
    } else {
      // Palette exhausted (>24 categories in one tournament) — cycle from start
      result.push(CATEGORY_PALETTE[i % CATEGORY_PALETTE.length]);
    }
  }
  return result;
}
