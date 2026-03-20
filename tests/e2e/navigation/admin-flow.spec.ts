/**
 * E2E tests for Admin navigation flow
 *
 * Verifies:
 * - FR-017: Admin menu contains Dashboard, Services, Bookings, Availability links
 * - FR-025: Login requirement for admin pages
 * - Identity Protection: Admin navigation hidden from guest sessions
 */

import { test, expect } from "@playwright/test";
import type { Page, Locator } from "@playwright/test";

const ADMIN_EMAIL = "admin@truflow.local";
const ADMIN_PASSWORD = "TestPassword123!";

const getHamburgerButton = (page: Page): Locator => {
  return page.locator("[data-testid='hamburger-button']:visible").first();
};

test.describe("Admin Navigation Flow", () => {
  test.describe("Unauthenticated Access", () => {
    test("should redirect to login when accessing /admin", async ({ page }) => {
      await page.goto("/admin");

      // Should redirect to /admin/login
      await expect(page).toHaveURL(/\/admin\/login/);
      expect(page.url()).toContain("callbackUrl=%2Fadmin");
    });

    test("should show admin login form", async ({ page }) => {
      await page.goto("/admin/login");

      // Verify login form elements
      await expect(page.getByLabel(/email/i)).toBeVisible();
      await expect(page.getByLabel(/password/i)).toBeVisible();
      await expect(page.getByRole("button", { name: /sign in|login/i })).toBeVisible();
    });

    test("should not show admin menu controls for guests", async ({ page }) => {
      await page.goto("/");

      await expect(getHamburgerButton(page)).toHaveCount(0);
    });
  });

  test.describe("Authenticated Admin Access", () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto("/admin/login");

      // Fill login form with test credentials
      await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|login/i }).click();

      // Wait for redirect to dashboard
      await expect(page).toHaveURL("/admin");
    });

    test("should show admin hamburger in header after login", async ({ page }) => {
      const hamburger = getHamburgerButton(page);
      await expect(hamburger).toBeVisible();
    });

    test("should open admin menu and show all admin navigation links", async ({ page }) => {
      await page.goto("/admin");

      const hamburger = getHamburgerButton(page);
      await hamburger.click();

      await expect(page.getByText("Admin")).toBeVisible();
      await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^services$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^bookings$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^availability$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^sign out$/i })).toBeVisible();
    });

    test("should navigate to Services via admin menu", async ({ page }) => {
      await page.goto("/admin");

      await getHamburgerButton(page).click();

      const servicesLink = page.getByRole("link", { name: /^services$/i });
      await servicesLink.click();

      await expect(page).toHaveURL("/admin/services");
      await expect(page.getByRole("heading", { name: /service configuration/i })).toBeVisible();
    });

    test("should navigate to Bookings via admin menu", async ({ page }) => {
      await page.goto("/admin");

      await getHamburgerButton(page).click();
      await page.getByRole("link", { name: /^bookings$/i }).click();

      await expect(page).toHaveURL("/admin/bookings");
      await expect(page.getByRole("heading", { name: /booking management/i })).toBeVisible();
    });

    test("should navigate to Availability via admin menu", async ({ page }) => {
      await page.goto("/admin");

      await getHamburgerButton(page).click();
      await page.getByRole("link", { name: /^availability$/i }).click();

      await expect(page).toHaveURL("/admin/availability");
      await expect(page.getByRole("heading", { name: /availability settings/i })).toBeVisible();
    });

    test("should mark current section with aria-current", async ({ page }) => {
      await page.goto("/admin/services");

      await getHamburgerButton(page).click();

      const servicesLink = page.getByRole("link", { name: /^services$/i });

      // Current item should have aria-current="page"
      await expect(servicesLink).toHaveAttribute("aria-current", "page");
    });

    test("should close menu after selecting a link", async ({ page }) => {
      await page.goto("/admin");

      const hamburger = getHamburgerButton(page);
      await hamburger.click();

      await expect(hamburger).toHaveAttribute("aria-expanded", "true");

      // Click Services link
      await page.getByRole("link", { name: /^services$/i }).click();

      // Wait for navigation
      await expect(page).toHaveURL("/admin/services");

      await expect(getHamburgerButton(page)).toHaveAttribute("aria-expanded", "false");
    });

    test("should close menu on Escape key", async ({ page }) => {
      await page.goto("/admin");

      const hamburger = getHamburgerButton(page);
      await hamburger.click();

      await expect(hamburger).toHaveAttribute("aria-expanded", "true");

      await page.keyboard.press("Escape");

      await expect(hamburger).toHaveAttribute("aria-expanded", "false");
    });

    test("should support keyboard navigation for menu trigger", async ({ page }) => {
      await page.goto("/admin");

      const hamburger = getHamburgerButton(page);
      await hamburger.focus();
      await page.keyboard.press("Enter");

      await expect(hamburger).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeVisible();
    });

    test("should allow tabbing through admin menu items", async ({ page }) => {
      await page.goto("/admin");

      await getHamburgerButton(page).click();

      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toHaveCount(1);
    });
  });

  test.describe("Hamburger Icon", () => {
    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto("/admin/login");
      await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL("/admin");
    });

    test("should show open-menu label when collapsed", async ({ page }) => {
      await expect(getHamburgerButton(page)).toHaveAttribute("aria-label", "Open menu");
    });

    test("should switch to close-menu label when expanded", async ({ page }) => {
      const hamburger = getHamburgerButton(page);
      await hamburger.click();
      await expect(hamburger).toHaveAttribute("aria-label", "Close menu");
    });
  });

  test.describe("Identity Protection (SC-002)", () => {
    test("should hide admin menu from guest sessions", async ({ page }) => {
      await page.goto("/");

      await expect(getHamburgerButton(page)).toHaveCount(0);
    });

    test("should hide admin navigation links in guest header", async ({ page }) => {
      await page.goto("/");

      // No admin links should be rendered
      await expect(page.getByRole("link", { name: /admin/i })).not.toBeVisible();
      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
    });

    test("should show admin menu only after authentication", async ({ page }) => {
      // Start as guest
      await page.goto("/");
      await expect(getHamburgerButton(page)).toHaveCount(0);

      // Login
      await page.goto("/admin/login");
      await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|login/i }).click();

      await expect(getHamburgerButton(page)).toBeVisible();
    });
  });
});
