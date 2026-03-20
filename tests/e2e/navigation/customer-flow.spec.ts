import { test, expect, type Locator, type Page } from "@playwright/test";

const visibleThemeToggles = (page: Page): Locator =>
  page.locator('[data-testid="theme-toggle-desktop"]:visible, [data-testid="theme-toggle-mobile"]:visible');

test.describe("Customer Journey - Navigation Flow", () => {
  test("home page exposes quick booking paths and hides admin links", async ({ page }) => {
    await page.goto("/");

    await expect(page.getByRole("link", { name: /book a session/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reserve an event/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /reserve a rental/i })).toBeVisible();
    await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
  });

  test("mobile menu opens as a navigation dialog", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await page.goto("/");

    await page.getByRole("button", { name: /open menu/i }).click();

    await expect(page.getByRole("dialog", { name: /navigation menu/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /^home$/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /sessions/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /events/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /rentals/i })).toBeVisible();
  });

  test("booking flow: breadcrumbs appear at /book", async ({ page }) => {
    await page.goto("/book");

    const breadcrumbs = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(breadcrumbs).toBeVisible();
  });

  test("theme toggle remains accessible throughout journey", async ({ page }) => {
    await page.goto("/");
    await expect(visibleThemeToggles(page)).toHaveCount(1);

    await page.goto("/book");
    await expect(visibleThemeToggles(page)).toHaveCount(1);

    const toggleCount = await visibleThemeToggles(page).count();
    expect(toggleCount).toBe(1);
  });
});
