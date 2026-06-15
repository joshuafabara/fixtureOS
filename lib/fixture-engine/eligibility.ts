/**
 * Category eligibility validator.
 * A category is fixture-eligible only when it has both startDate AND gameModeId.
 */

export type CategoryInput = {
  id: string;
  name: string;
  startDate: string | null;
  gameModeId: string | null;
  isActiveForFixture: boolean;
  teamCount: number;
};

export type EligibilityResult = {
  eligible: boolean;
  categoryId: string;
  categoryName: string;
  reasons: string[];
};

export function validateCategoryEligibility(
  category: CategoryInput
): EligibilityResult {
  const reasons: string[] = [];

  if (!category.startDate) reasons.push("Falta fecha de inicio");
  if (!category.gameModeId) reasons.push("Falta modo de juego");
  if (category.teamCount < 2) reasons.push("Se necesitan al menos 2 equipos");

  return {
    eligible: reasons.length === 0,
    categoryId: category.id,
    categoryName: category.name,
    reasons,
  };
}

export function validateAllCategories(
  categories: CategoryInput[]
): EligibilityResult[] {
  return categories.map(validateCategoryEligibility);
}
