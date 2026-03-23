/**
 * E2E tests for Admin navigation flow
 *
 * Verifies:
 * - FR-017: Admin menu contains Dashboard, Services, Bookings, Availability links
 * - FR-025: Login requirement for admin pages
 * - Identity Protection: Admin navigation hidden from guest sessions
 */

import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@truflow.local";
const ADMIN_PASSWORD =
  process.env.E2E_ADMIN_PASSWORD ?? process.env.ADMIN_PASSWORD ?? process.env.ADMIN_SEED_PASSWORD ?? "";

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

      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
    });
  });

  test.describe("Authenticated Admin Access", () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!ADMIN_PASSWORD, "Admin password is not configured for E2E navigation tests.");

      // Login as admin
      await page.goto("/admin/login");

      // Fill login form with test credentials
      await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|login/i }).click();

      // Wait for redirect to dashboard
      await expect(page).toHaveURL("/admin");
    });

    test("should show the admin dropdown in the desktop header after login", async ({ page }) => {
      await expect(page.getByRole("button", { name: /^dashboard$/i })).toBeVisible();
    });

    test("should open the admin dropdown and show all admin navigation links", async ({ page }) => {
      await page.goto("/admin");

      await page.getByRole("button", { name: /^dashboard$/i }).click();

      await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^services$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^bookings$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^availability$/i })).toBeVisible();
      await expect(page.getByRole("button", { name: /^sign out$/i })).toBeVisible();
    });

    test("should navigate to Services via admin menu", async ({ page }) => {
      await page.goto("/admin");

      await page.getByRole("button", { name: /^dashboard$/i }).click();

      const servicesLink = page.getByRole("link", { name: /^services$/i });
      await servicesLink.click();

      await expect(page).toHaveURL("/admin/services");
      await expect(page.getByRole("heading", { name: /service configuration/i })).toBeVisible();
    });

    test("should navigate to Bookings via admin menu", async ({ page }) => {
      await page.goto("/admin");

      await page.getByRole("button", { name: /^dashboard$/i }).click();
      await page.getByRole("link", { name: /^bookings$/i }).click();

      await expect(page).toHaveURL("/admin/bookings");
      await expect(page.getByRole("heading", { name: /booking management/i })).toBeVisible();
    });

    test("should navigate to Availability via admin menu", async ({ page }) => {
      await page.goto("/admin");

      await page.getByRole("button", { name: /^dashboard$/i }).click();
      await page.getByRole("link", { name: /^availability$/i }).click();

      await expect(page).toHaveURL("/admin/availability");
      await expect(page.getByRole("heading", { name: /availability settings/i })).toBeVisible();
    });

    test("should mark current section with aria-current", async ({ page }) => {
      await page.goto("/admin/services");

      await page.getByRole("button", { name: /^services$/i }).click();

      const servicesLink = page.getByRole("link", { name: /^services$/i });

      // Current item should have aria-current="page"
      await expect(servicesLink).toHaveAttribute("aria-current", "page");
    });

    test("should close the dropdown on Escape key", async ({ page }) => {
      await page.goto("/admin");

      const dropdown = page.getByRole("button", { name: /^dashboard$/i });
      await dropdown.click();

      await expect(dropdown).toHaveAttribute("aria-expanded", "true");

      await page.keyboard.press("Escape");

      await expect(dropdown).toHaveAttribute("aria-expanded", "false");
    });

    test("should support keyboard navigation for the dropdown trigger", async ({ page }) => {
      await page.goto("/admin");

      const dropdown = page.getByRole("button", { name: /^dashboard$/i });
      await dropdown.focus();
      await page.keyboard.press("Enter");

      await expect(dropdown).toHaveAttribute("aria-expanded", "true");
      await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeVisible();
    });

    test("should allow tabbing through admin menu items", async ({ page }) => {
      await page.goto("/admin");

      await page.getByRole("button", { name: /^dashboard$/i }).click();

      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");
      await page.keyboard.press("Tab");

      const focusedElement = page.locator(":focus");
      await expect(focusedElement).toHaveCount(1);
    });
  });

  test.describe("Desktop Admin Controls", () => {
    test.beforeEach(async ({ page }) => {
      test.skip(!ADMIN_PASSWORD, "Admin password is not configured for E2E navigation tests.");

      // Login
      await page.goto("/admin/login");
      await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL("/admin");
    });

    test("should render the sign out button", async ({ page }) => {
      await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
    });
  });

  test.describe("Identity Protection (SC-002)", () => {
    test("should hide admin menu from guest sessions", async ({ page }) => {
      await page.goto("/");

      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
    });

    test("should hide admin navigation links in guest header", async ({ page }) => {
      await page.goto("/");

      // No admin links should be rendered
      await expect(page.getByRole("link", { name: /admin/i })).not.toBeVisible();
      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
    });

    test("should show admin menu only after authentication", async ({ page }) => {
      test.skip(!ADMIN_PASSWORD, "Admin password is not configured for E2E navigation tests.");

      await page.goto("/");
      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);

      await page.goto("/admin/login");
      await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|login/i }).click();

      await expect(page.getByRole("button", { name: /^dashboard$/i })).toBeVisible();
    });
  });
});
