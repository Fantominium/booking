/**
 * E2E tests for Admin navigation flow
 *
 * Verifies:
 * - FR-016: Admin dropdown button updates text based on current section
 * - FR-017: Dropdown contains Dashboard, Services, Bookings, Availability links
 * - FR-025: Login requirement for admin pages
 * - Identity Protection: Admin navigation hidden from guest sessions
 */

import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = "admin@truflow.local";
const ADMIN_PASSWORD = "TestPassword123!";

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

    test("should not show admin dropdown in header for guests", async ({ page }) => {
      await page.goto("/");

      // Guest users should NOT see admin dropdown
      await expect(
        page.getByRole("button", { name: /dashboard|services|bookings|availability/i }),
      ).not.toBeVisible();
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

    test("should show admin dropdown in header after login", async ({ page }) => {
      // Admin dropdown should be visible
      const dropdown = page.getByRole("button", { name: /dashboard/i });
      await expect(dropdown).toBeVisible();
    });

    test('should show "Dashboard" on /admin root', async ({ page }) => {
      await page.goto("/admin");

      const button = page.getByRole("button", { name: /dashboard/i });
      await expect(button).toBeVisible();
      await expect(button).toContainText("Dashboard");
    });

    test('should update button text to "Services" on /admin/services', async ({ page }) => {
      await page.goto("/admin/services");

      const button = page.getByRole("button", { name: /services/i });
      await expect(button).toBeVisible();
      await expect(button).toContainText("Services");
    });

    test('should update button text to "Bookings" on /admin/bookings', async ({ page }) => {
      await page.goto("/admin/bookings");

      const button = page.getByRole("button", { name: /bookings/i });
      await expect(button).toBeVisible();
      await expect(button).toContainText("Bookings");
    });

    test('should update button text to "Availability" on /admin/availability', async ({ page }) => {
      await page.goto("/admin/availability");

      const button = page.getByRole("button", { name: /availability/i });
      await expect(button).toBeVisible();
      await expect(button).toContainText("Availability");
    });

    test("should expand dropdown and show all 4 navigation links", async ({ page }) => {
      await page.goto("/admin");

      const button = page.getByRole("button", { name: /dashboard/i });
      await button.click();

      // FR-017: Verify all 4 sections
      await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^services$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^bookings$/i })).toBeVisible();
      await expect(page.getByRole("link", { name: /^availability$/i })).toBeVisible();
    });

    test("should navigate to Services via dropdown", async ({ page }) => {
      await page.goto("/admin");

      const button = page.getByRole("button", { name: /dashboard/i });
      await button.click();

      const servicesLink = page.getByRole("link", { name: /^services$/i });
      await servicesLink.click();

      await expect(page).toHaveURL("/admin/services");

      // Button text should update
      await expect(page.getByRole("button", { name: /services/i })).toBeVisible();
    });

    test("should navigate to Bookings via dropdown", async ({ page }) => {
      await page.goto("/admin");

      await page.getByRole("button", { name: /dashboard/i }).click();
      await page.getByRole("link", { name: /^bookings$/i }).click();

      await expect(page).toHaveURL("/admin/bookings");
      await expect(page.getByRole("button", { name: /bookings/i })).toBeVisible();
    });

    test("should navigate to Availability via dropdown", async ({ page }) => {
      await page.goto("/admin");

      await page.getByRole("button", { name: /dashboard/i }).click();
      await page.getByRole("link", { name: /^availability$/i }).click();

      await expect(page).toHaveURL("/admin/availability");
      await expect(page.getByRole("button", { name: /availability/i })).toBeVisible();
    });

    test("should highlight current section in dropdown", async ({ page }) => {
      await page.goto("/admin/services");

      const button = page.getByRole("button", { name: /services/i });
      await button.click();

      const servicesLink = page.getByRole("link", { name: /^services$/i });

      // Current item should have aria-current="page"
      await expect(servicesLink).toHaveAttribute("aria-current", "page");
    });

    test("should close dropdown after selecting a link", async ({ page }) => {
      await page.goto("/admin");

      const button = page.getByRole("button", { name: /dashboard/i });
      await button.click();

      // Dropdown is open
      await expect(button).toHaveAttribute("aria-expanded", "true");

      // Click Services link
      await page.getByRole("link", { name: /^services$/i }).click();

      // Wait for navigation
      await expect(page).toHaveURL("/admin/services");

      // Dropdown should be closed
      const newButton = page.getByRole("button", { name: /services/i });
      await expect(newButton).toHaveAttribute("aria-expanded", "false");
    });

    test("should close dropdown on Escape key", async ({ page }) => {
      await page.goto("/admin");

      const button = page.getByRole("button", { name: /dashboard/i });
      await button.click();

      await expect(button).toHaveAttribute("aria-expanded", "true");

      await page.keyboard.press("Escape");

      await expect(button).toHaveAttribute("aria-expanded", "false");
    });

    test("should support keyboard navigation in dropdown", async ({ page }) => {
      await page.goto("/admin");

      const button = page.getByRole("button", { name: /dashboard/i });
      await button.focus();
      await page.keyboard.press("ArrowDown");

      // Dropdown should open and focus first link
      await expect(button).toHaveAttribute("aria-expanded", "true");

      const firstLink = page.getByRole("link", { name: /^dashboard$/i });
      await expect(firstLink).toBeFocused();
    });

    test("should navigate through dropdown items with Tab", async ({ page }) => {
      await page.goto("/admin");

      const button = page.getByRole("button", { name: /dashboard/i });
      await button.click();

      // Tab through links
      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: /^dashboard$/i })).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: /^services$/i })).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: /^bookings$/i })).toBeFocused();

      await page.keyboard.press("Tab");
      await expect(page.getByRole("link", { name: /^availability$/i })).toBeFocused();
    });
  });

  test.describe("Dropdown Icon", () => {
    test.beforeEach(async ({ page }) => {
      // Login
      await page.goto("/admin/login");
      await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|login/i }).click();
      await expect(page).toHaveURL("/admin");
    });

    test("should show down arrow icon when collapsed", async ({ page }) => {
      const button = page.getByRole("button", { name: /dashboard/i });
      const icon = button.locator("svg");

      await expect(icon).toBeVisible();
      // Arrow should NOT be rotated
      await expect(icon).not.toHaveClass(/rotate-180/);
    });

    test("should rotate arrow to up when expanded", async ({ page }) => {
      const button = page.getByRole("button", { name: /dashboard/i });
      await button.click();

      const icon = button.locator("svg");

      // Arrow should be rotated 180deg
      await expect(icon).toHaveClass(/rotate-180/);
    });
  });

  test.describe("Identity Protection (SC-002)", () => {
    test("should hide admin dropdown from guest sessions", async ({ page }) => {
      await page.goto("/");

      // Guest view should NOT have admin dropdown
      const adminButton = page.getByRole("button", {
        name: /dashboard|services|bookings|availability/i,
      });
      await expect(adminButton).not.toBeVisible();
    });

    test("should hide admin navigation links in guest header", async ({ page }) => {
      await page.goto("/");

      // No admin links should be rendered
      await expect(page.getByRole("link", { name: /admin/i })).not.toBeVisible();
      await expect(page.locator('a[href^="/admin"]')).toHaveCount(0);
    });

    test("should show admin dropdown only after authentication", async ({ page }) => {
      // Start as guest
      await page.goto("/");
      await expect(page.getByRole("button", { name: /dashboard/i })).not.toBeVisible();

      // Login
      await page.goto("/admin/login");
      await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
      await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
      await page.getByRole("button", { name: /sign in|login/i }).click();

      // Now admin dropdown should appear
      await expect(page.getByRole("button", { name: /dashboard/i })).toBeVisible();
    });
  });
});
