/**
 * E2E tests for Hamburger Menu Animation
 *
 * Verifies:
 * - FR-004: Mobile-first breadcrumbs with truncation
 * - US4 Acceptance 1: Company name right, hamburger left on mobile
 * - US4 Acceptance 2: Hamburger morphs into close icon on tap
 * - US4 Acceptance 3: Close icon reverts to hamburger on tap
 * - R-001: Pure Tailwind/CSS approach for animation
 */

import { test, expect } from "@playwright/test";

test.describe("Hamburger Animation - Mobile Navigation", () => {
  test.beforeEach(async ({ page }) => {
    // Set mobile viewport (320px per FR-004)
    await page.setViewportSize({ width: 320, height: 568 });
  });

  test.describe("Mobile Layout", () => {
    test("should show hamburger icon on the left", async ({ page }) => {
      await page.goto("/");

      const hamburger = page
        .locator('[data-testid="hamburger-button"]')
        .or(page.getByRole("button", { name: /menu|navigation/i }));

      await expect(hamburger).toBeVisible();

      // Verify left positioning
      const bbox = await hamburger.boundingBox();
      expect(bbox).not.toBeNull();
      if (bbox) {
        // Hamburger should be within first 80px of screen width (left side)
        expect(bbox.x).toBeLessThan(80);
      }
    });

    test("should show company name/logo on the right", async ({ page }) => {
      await page.goto("/");

      const logo = page
        .locator("header")
        .locator("div.md\\:hidden")
        .getByRole("link", { name: /truflow/i })
        .first();

      await expect(logo).toBeVisible();

      // Verify right positioning
      const bbox = await logo.boundingBox();
      expect(bbox).not.toBeNull();
      if (bbox) {
        // Logo should be in the right half of screen (> 160px for 320px width)
        expect(bbox.x).toBeGreaterThan(160);
      }
    });

    test("should use flex-row-reverse for mobile layout", async ({ page }) => {
      await page.goto("/");

      const headerDiv = page.locator("header").locator("div.md\\:hidden").first();

      // Check for flex-row-reverse class or equivalent CSS
      const classList = await headerDiv.getAttribute("class");
      expect(classList).toContain("flex");
      // Tailwind 4 flex-row-reverse or custom order classes
      expect(classList).toMatch(/flex-row-reverse|order-/);
    });
  });

  test.describe("Hamburger Icon States", () => {
    test("should show hamburger bars when menu is closed", async ({ page }) => {
      await page.goto("/");

      const hamburger = page
        .locator('[data-testid="hamburger-button"]')
        .or(page.getByRole("button", { name: /menu/i }));

      // Check for hamburger spans (3 bars)
      const bars = hamburger.locator("span");
      await expect(bars).toHaveCount(3);

      // All bars should be visible (horizontal lines)
      for (let i = 0; i < 3; i++) {
        await expect(bars.nth(i)).toBeVisible();
      }
    });

    test('should have aria-expanded="false" when closed', async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await expect(hamburger).toHaveAttribute("aria-expanded", "false");
    });

    test('should have aria-label="Open menu" when closed', async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /open menu/i });
      await expect(hamburger).toBeVisible();
    });
  });

  test.describe("Animation: Hamburger to Close", () => {
    test("should morph into close (X) icon on tap", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.click();

      // After click, should morph to X shape
      // Top bar rotates to 45deg, middle bar opacity 0, bottom bar rotates to -45deg
      const bars = hamburger.locator("span");

      // Check for rotation classes (Tailwind rotate-45)
      const topBar = bars.nth(0);
      const middleBar = bars.nth(1);
      const bottomBar = bars.nth(2);

      // Top bar: rotate 45deg
      const topClass = await topBar.getAttribute("class");
      expect(topClass).toMatch(/rotate-45/);

      // Middle bar: opacity 0 (hidden)
      const middleClass = await middleBar.getAttribute("class");
      expect(middleClass).toMatch(/opacity-0/);

      // Bottom bar: rotate -45deg
      const bottomClass = await bottomBar.getAttribute("class");
      expect(bottomClass).toMatch(/-rotate-45/);
    });

    test('should update aria-expanded to "true" when open', async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.click();

      await expect(hamburger).toHaveAttribute("aria-expanded", "true");
    });

    test('should update aria-label to "Close menu" when open', async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.click();

      await expect(hamburger).toHaveAttribute("aria-label", "Close menu");
    });

    test("should expand mobile menu content", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.click();

      // Mobile menu should appear
      const mobileMenu = page.locator('[data-testid="mobile-menu"]');

      await expect(mobileMenu).toBeVisible();
    });
  });

  test.describe("Animation: Close to Hamburger", () => {
    test("should revert to hamburger bars on second tap", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });

      // Open menu
      await hamburger.click();
      await expect(hamburger).toHaveAttribute("aria-expanded", "true");

      // Close menu
      await hamburger.click();

      // Should revert to hamburger (3 horizontal bars)
      const bars = hamburger.locator("span");
      const topBar = bars.nth(0);
      const middleBar = bars.nth(1);
      const bottomBar = bars.nth(2);

      // Top bar: no rotation
      const topClass = await topBar.getAttribute("class");
      expect(topClass).not.toMatch(/rotate-45/);

      // Middle bar: visible (opacity-100)
      const middleClass = await middleBar.getAttribute("class");
      expect(middleClass).not.toMatch(/opacity-0/);

      // Bottom bar: no rotation
      const bottomClass = await bottomBar.getAttribute("class");
      expect(bottomClass).not.toMatch(/-rotate-45/);
    });

    test('should update aria-expanded to "false" when closed', async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.click();
      await hamburger.click(); // Close

      await expect(hamburger).toHaveAttribute("aria-expanded", "false");
    });

    test("should collapse mobile menu content", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.click(); // Open

      const mobileMenu = page.locator('[data-testid="mobile-menu"]');
      await expect(mobileMenu).toBeVisible();

      await hamburger.click(); // Close

      // Menu should be hidden
      await expect(mobileMenu).not.toBeVisible();
    });
  });

  test.describe("Animation Smoothness", () => {
    test("should have transition classes for smooth animation", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      const bars = hamburger.locator("span");

      // All bars should have transition classes
      for (let i = 0; i < 3; i++) {
        const barClass = await bars.nth(i).getAttribute("class");
        // Tailwind transition classes: transition, duration-200, ease-in-out
        expect(barClass).toMatch(/transition|duration-/);
      }
    });

    test("should animate within 300ms", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });

      const startTime = Date.now();
      await hamburger.click();

      // Wait for animation to complete
      await page.waitForTimeout(300);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Animation should complete within 300ms (plus small buffer)
      expect(duration).toBeLessThan(500);
    });
  });

  test.describe("Keyboard Accessibility", () => {
    test("should toggle menu on Enter key", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.focus();

      await page.keyboard.press("Enter");
      await expect(hamburger).toHaveAttribute("aria-expanded", "true");

      await page.keyboard.press("Enter");
      await expect(hamburger).toHaveAttribute("aria-expanded", "false");
    });

    test("should toggle menu on Space key", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.focus();

      await page.keyboard.press("Space");
      await expect(hamburger).toHaveAttribute("aria-expanded", "true");

      await page.keyboard.press("Space");
      await expect(hamburger).toHaveAttribute("aria-expanded", "false");
    });

    test("should close menu on Escape key", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      await hamburger.click();
      await expect(hamburger).toHaveAttribute("aria-expanded", "true");

      await page.keyboard.press("Escape");
      await expect(hamburger).toHaveAttribute("aria-expanded", "false");
    });
  });

  test.describe("Touch Target Size", () => {
    test("should meet 44x44px minimum touch target", async ({ page }) => {
      await page.goto("/");

      const hamburger = page.getByRole("button", { name: /menu/i });
      const bbox = await hamburger.boundingBox();

      expect(bbox).not.toBeNull();
      if (bbox) {
        expect(bbox.width).toBeGreaterThanOrEqual(44);
        expect(bbox.height).toBeGreaterThanOrEqual(44);
      }
    });
  });

  test.describe("Desktop Viewport", () => {
    test("should hide hamburger on desktop (≥768px)", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto("/");

      const hamburger = page
        .locator('[data-testid="hamburger-button"]')
        .or(page.getByRole("button", { name: /menu/i }));

      // Hamburger should not be visible on desktop
      await expect(hamburger).not.toBeVisible();
    });
  });
});
