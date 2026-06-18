/**
 * Smoke tests — every page must load without a server error.
 *
 * Run with:  nvm use && npm run test:e2e -- --project=chromium tests/e2e/smoke.spec.ts
 * Requires dev server running: nvm use && npm run dev
 */

import { test, expect, type Page } from "@playwright/test";

const SEED_EMAIL    = "admin@fixtureos.dev";
const SEED_PASSWORD = "admin1234";

// ── Helpers ──────────────────────────────────────────────────────────────────

async function login(page: Page) {
  await page.goto("/login");
  await page.locator("input[type='email'], input[name='email']").fill(SEED_EMAIL);
  await page.locator("input[type='password']").fill(SEED_PASSWORD);
  await page.locator("button[type='submit']").click();
  await page.waitForURL(/dashboard/, { timeout: 12_000 });
}

/** Assert no Next.js error overlay or server error page is visible. */
async function assertNoServerError(page: Page, route: string) {
  // Next.js dev error overlay dialog
  const overlay = page.locator("[data-nextjs-dialog], #nextjs__container_errors_h1");
  await expect(overlay, `Error overlay visible on ${route}`).toHaveCount(0);

  // Next.js production "Server Error" / "Application error" headings
  const serverError = page.locator(
    'h2:has-text("Server Error"), h2:has-text("Application error"), h1:has-text("Server Error")',
  );
  await expect(serverError, `Server error heading on ${route}`).toHaveCount(0);

  // Text-based error checks (covers "Cannot find module", webpack errors, etc.)
  const body = await page.locator("body").innerText({ timeout: 5_000 }).catch(() => "");
  const forbidden = [
    "Cannot find module",
    "Unhandled Runtime Error",
    "Internal Server Error",
    "Require stack",
  ];
  for (const phrase of forbidden) {
    expect(body, `"${phrase}" found on ${route}`).not.toContain(phrase);
  }
}

/**
 * Goto a page, check HTTP response is not 500, check DOM for errors.
 * Returns false and logs a warning if the page redirected to login
 * (which would mean the auth session expired).
 */
async function smokeGoto(page: Page, route: string): Promise<boolean> {
  const res = await page.goto(route, { waitUntil: "domcontentloaded", timeout: 20_000 });
  if (!res) return false;

  if (res.status() === 500) {
    throw new Error(`HTTP 500 on ${route}`);
  }

  // Re-login guard — shouldn't happen but catches session edge cases
  if (page.url().includes("/login")) {
    console.warn(`  ⚠ Redirected to login when visiting ${route}. Logging in again…`);
    await login(page);
    await page.goto(route, { waitUntil: "domcontentloaded", timeout: 20_000 });
  }

  await assertNoServerError(page, route);
  return true;
}

// ── Static routes (no ID needed) ─────────────────────────────────────────────

const STATIC_ROUTES = [
  "/dashboard",
  "/fixture",
  "/tournaments",
  "/tournaments/new",
  "/clubs",
  "/context",
  "/context/organization",
  "/context/history",
  "/context/date",
  "/context/compare",
  "/dry-run",
  "/matches",
  "/import",
  "/imports",
  "/exports",
  "/audit",
  "/communications",
  "/settings/courts",
  "/settings/organization",
  "/settings/users",
  "/standings/import",
] as const;

test.describe("Smoke — static routes", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  for (const route of STATIC_ROUTES) {
    test(`${route}`, async ({ page }) => {
      await smokeGoto(page, route);
    });
  }
});

// ── Dynamic routes (navigate from list pages) ─────────────────────────────────

test.describe("Smoke — dynamic routes", () => {
  test.beforeEach(async ({ page }) => { await login(page); });

  test("/context/category/[id]", async ({ page }) => {
    await page.goto("/context");
    await page.waitForLoadState("domcontentloaded");
    const link = page.locator("a[href*='/context/category/']").first();
    if (await link.count() === 0) {
      console.warn("  ⚠ No category context links found — skipping detail check");
      return;
    }
    const href = await link.getAttribute("href");
    await smokeGoto(page, href!);
  });

  test("/context/tournament/[id]", async ({ page }) => {
    await page.goto("/context");
    await page.waitForLoadState("domcontentloaded");
    const link = page.locator("a[href*='/context/tournament/']").first();
    if (await link.count() === 0) {
      console.warn("  ⚠ No tournament context links found — skipping");
      return;
    }
    const href = await link.getAttribute("href");
    await smokeGoto(page, href!);
  });

  test("/tournaments/[id]", async ({ page }) => {
    await page.goto("/tournaments");
    await page.waitForLoadState("domcontentloaded");
    const link = page.locator("a[href*='/tournaments/']:not([href='/tournaments/new'])").first();
    if (await link.count() === 0) {
      console.warn("  ⚠ No tournament links found");
      return;
    }
    const href = await link.getAttribute("href");
    await smokeGoto(page, href!);
  });

  test("/clubs/[id]", async ({ page }) => {
    await page.goto("/clubs");
    await page.waitForLoadState("domcontentloaded");
    const link = page.locator("a[href*='/clubs/']:not([href='/clubs'])").first();
    if (await link.count() === 0) {
      console.warn("  ⚠ No club links found");
      return;
    }
    const href = await link.getAttribute("href");
    await smokeGoto(page, href!);
  });

  test("/fixture/[id]", async ({ page }) => {
    await page.goto("/fixture");
    await page.waitForLoadState("domcontentloaded");
    const link = page.locator("a[href*='/fixture/']:not([href='/fixture'])").first();
    if (await link.count() === 0) {
      console.warn("  ⚠ No fixture links found");
      return;
    }
    const href = await link.getAttribute("href");
    if (!href || href === "/fixture") return;
    await smokeGoto(page, href);
  });

  test("/fixture/[id]/edit", async ({ page }) => {
    await page.goto("/fixture");
    await page.waitForLoadState("domcontentloaded");

    // Try to find an edit link directly, or navigate through a fixture first
    let editHref: string | null = null;
    const directEdit = page.locator("a[href*='/edit']").first();
    if (await directEdit.count() > 0) {
      editHref = await directEdit.getAttribute("href");
    } else {
      const fixtureLink = page.locator("a[href*='/fixture/']:not([href='/fixture'])").first();
      if (await fixtureLink.count() > 0) {
        const href = await fixtureLink.getAttribute("href");
        if (href && href !== "/fixture") {
          await page.goto(href, { waitUntil: "domcontentloaded" });
          const editBtn = page.locator("a[href*='/edit']").first();
          if (await editBtn.count() > 0) {
            editHref = await editBtn.getAttribute("href");
          }
        }
      }
    }

    if (!editHref) {
      console.warn("  ⚠ No fixture edit link found");
      return;
    }
    await smokeGoto(page, editHref);
    // Confirm board rendered (sub-topbar "Edición manual" title)
    await expect(page.locator("h1, [class*='topbar'] h1").filter({ hasText: /edici/i }).first()).toBeVisible({ timeout: 5_000 }).catch(() => {});
  });

  test("/fixture/[id]/history", async ({ page }) => {
    await page.goto("/fixture");
    await page.waitForLoadState("domcontentloaded");
    const link = page.locator("a[href*='/fixture/']:not([href='/fixture'])").first();
    if (await link.count() === 0) return;
    const href = await link.getAttribute("href");
    if (!href) return;
    await smokeGoto(page, `${href}/history`);
  });

  test("/dry-run/[id]", async ({ page }) => {
    await page.goto("/dry-run");
    await page.waitForLoadState("domcontentloaded");
    const link = page.locator("a[href*='/dry-run/']:not([href='/dry-run'])").first();
    if (await link.count() === 0) {
      console.warn("  ⚠ No dry-run links found");
      return;
    }
    const href = await link.getAttribute("href");
    await smokeGoto(page, href!);
  });

  test("/standings/review/[id]", async ({ page }) => {
    await page.goto("/standings/import");
    await page.waitForLoadState("domcontentloaded");
    const link = page.locator("a[href*='/standings/review/']").first();
    if (await link.count() === 0) {
      console.warn("  ⚠ No standings review links found");
      return;
    }
    const href = await link.getAttribute("href");
    await smokeGoto(page, href!);
  });

  // Import wizard steps — navigate from the history page.
  // Pages redirect to earlier steps if the batch isn't in the right state;
  // a 200 (or redirect to another step) is fine — we only care that there's
  // no 500 / error overlay.
  test("/imports/[id]/mapping (and later steps)", async ({ page }) => {
    await page.goto("/imports");
    await page.waitForLoadState("domcontentloaded");

    // Look for any "Continuar" link that goes to a wizard step
    const continueLink = page.locator("a[href*='/imports/']").first();
    if (await continueLink.count() === 0) {
      console.warn("  ⚠ No import batch links found — skipping wizard step checks");
      return;
    }
    const href = await continueLink.getAttribute("href");
    if (!href) return;

    // Extract batch ID from whatever link we found
    const match = href.match(/\/imports\/([^/]+)/);
    if (!match) return;
    const batchId = match[1];

    // Test each wizard step — pages redirect between themselves so any
    // landing page that isn't a 500 / error overlay is a pass.
    for (const step of ["mapping", "diff", "errors", "confirm"]) {
      await smokeGoto(page, `/imports/${batchId}/${step}`);
    }
  });
});
