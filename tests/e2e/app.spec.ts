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

test.describe("App pages (authenticated)", () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("dashboard loads with navigation", async ({ page }) => {
    await expect(page).toHaveURL(/dashboard/);
    // Sidebar or nav exists
    await expect(page.locator("nav, aside, [role='navigation']").first()).toBeVisible();
  });

  test("tournaments list page loads", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page).toHaveURL(/tournaments/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("teams list page loads", async ({ page }) => {
    await page.goto("/teams");
    await expect(page).toHaveURL(/teams/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("context page loads", async ({ page }) => {
    await page.goto("/context");
    await expect(page).toHaveURL(/context/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("dry-run list page loads", async ({ page }) => {
    await page.goto("/dry-run");
    await expect(page).toHaveURL(/dry-run/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("clubs page loads", async ({ page }) => {
    await page.goto("/clubs");
    await expect(page).toHaveURL(/clubs/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });

  test("categories page loads", async ({ page }) => {
    await page.goto("/categories");
    await expect(page).toHaveURL(/categories/);
    await expect(page.locator("h1, h2").first()).toBeVisible();
  });
});
