import { test, expect } from "@playwright/test";

const BASE_URL = "http://localhost:3000";
const SEED_EMAIL = "admin@fixtureos.dev";
const SEED_PASSWORD = "admin1234";

test.describe("Authentication", () => {
  test("login page renders with form fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible();
    await expect(page.locator("input[type='password']")).toBeVisible();
    await expect(page.locator("button[type='submit']")).toBeVisible();
  });

  test("redirects unauthenticated users to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/login/);
  });

  test("logs in with seed credentials and lands on dashboard", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").fill(SEED_EMAIL);
    await page.locator("input[type='password']").fill(SEED_PASSWORD);
    await page.locator("button[type='submit']").click();
    await expect(page).toHaveURL(/dashboard/, { timeout: 10_000 });
  });

  test("shows error for wrong credentials", async ({ page }) => {
    await page.goto("/login");
    await page.locator("input[type='email'], input[name='email']").fill("wrong@example.com");
    await page.locator("input[type='password']").fill("wrongpassword");
    await page.locator("button[type='submit']").click();
    const errorEl = page.locator("text=/credencial|inválid|incorrecto/i");
    await expect(errorEl).toBeVisible({ timeout: 5_000 });
  });
});
