import { test, expect, type Page } from "@playwright/test";

const SEED_EMAIL = "admin@fixtureos.dev";
const SEED_PASSWORD = "admin1234";

async function login(page: Page) {
  await page.goto("/login");
  await page.locator("input[type='email'], input[name='email']").fill(SEED_EMAIL);
  await page.locator("input[type='password']").fill(SEED_PASSWORD);
  await page.locator("button[type='submit']").click();
  await page.waitForURL(/dashboard/, { timeout: 10_000 });
}

test.describe("Dry run flow", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dry-run list shows generate button for active tournament", async ({ page }) => {
    await page.goto("/dry-run");
    // Should show a generate button (active tournament present after seed)
    const generateBtn = page.locator("button", { hasText: /Generar/i });
    await expect(generateBtn.first()).toBeVisible({ timeout: 5_000 });
  });

  test("generates a dry run and shows review page", async ({ page }) => {
    await page.goto("/dry-run");
    const generateBtn = page.locator("button", { hasText: /Generar Dry Run/i });

    // Only run if button is enabled (requires eligible categories)
    const isDisabled = await generateBtn.first().isDisabled().catch(() => true);
    if (isDisabled) {
      test.skip();
      return;
    }

    await generateBtn.first().click();
    // Should redirect to the dry-run detail page
    await expect(page).toHaveURL(/\/dry-run\/[a-z0-9-]+/, { timeout: 20_000 });
    await expect(page.locator("h1", { hasText: /Revisión/i })).toBeVisible();
  });
});
