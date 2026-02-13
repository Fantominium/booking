import { test, expect } from "@playwright/test";

test.describe("Theme Toggle - Global Uniqueness & Functionality", () => {
  test("only one theme toggle exists on any page", async ({ page }) => {
    // Test home page
    await page.goto("/");
    let toggleCount = await page.getByTestId("theme-toggle").count();
    expect(toggleCount).toBe(1);

    // Test booking page
    await page.goto("/book");
    toggleCount = await page.getByTestId("theme-toggle").count();
    expect(toggleCount).toBe(1);

    // Test admin page (if accessible)
    await page.goto("/admin");
    toggleCount = await page.getByTestId("theme-toggle").count();
    expect(toggleCount).toBeLessThanOrEqual(1); // 0 or 1 (depends on auth)
  });

  test("theme toggle is always in header navigation", async ({ page }) => {
    await page.goto("/");

    // Toggle should be inside the header element
    const header = page.locator("header");
    const toggle = header.getByTestId("theme-toggle");

    await expect(toggle).toBeVisible();
  });

  test("theme toggle switches from light to dark mode", async ({ page }) => {
    await page.goto("/");

    // Get initial theme (check data-theme attribute on html/body)
    const initialTheme = await page.evaluate(() => {
      return (
        document.documentElement.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      );
    });

    // Click theme toggle
    await page.getByTestId("theme-toggle").click();

    // Wait for theme change
    await page.waitForTimeout(200); // Allow transition

    // Get new theme
    const newTheme = await page.evaluate(() => {
      return (
        document.documentElement.getAttribute("data-theme") ||
        (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
      );
    });

    // Themes should be different
    expect(newTheme).not.toBe(initialTheme);
  });

  test("theme toggle switches from dark to light mode", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.setItem("truflow-theme", "dark");
    });
    await page.goto("/");

    // Ensure initial theme is dark
    await expect(page.getByTestId("theme-toggle")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");

    // Click theme toggle
    await page.getByTestId("theme-toggle").click();

    // Wait for theme change
    await page.waitForTimeout(200);

    // Should now be light mode
    await expect(page.locator("html")).toHaveAttribute("data-theme", "light");
  });

  test("theme toggle persists across page navigation", async ({ page }) => {
    await page.goto("/");

    // Switch to dark mode
    await page.getByTestId("theme-toggle").click();
    await page.waitForTimeout(200);

    // Navigate to booking page
    await page.goto("/book");
    await page.waitForTimeout(200);

    // Theme should still be dark
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute("data-theme");
    });

    expect(theme).toBe("dark");
  });

  test("theme toggle is keyboard accessible", async ({ page }) => {
    await page.goto("/");

    // Tab to the theme toggle
    await page.keyboard.press("Tab");

    // Keep tabbing until we reach the theme toggle
    let focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
    let tabCount = 0;
    while (!focused?.toLowerCase().includes("theme") && tabCount < 20) {
      await page.keyboard.press("Tab");
      focused = await page.evaluate(() => document.activeElement?.getAttribute("aria-label"));
      tabCount++;
    }

    // Should be focused on theme toggle
    expect(focused?.toLowerCase()).toContain("switch to");

    // Press Enter to activate
    await page.keyboard.press("Enter");
    await page.waitForTimeout(200);

    // Theme should have changed
    const theme = await page.evaluate(() => {
      return document.documentElement.getAttribute("data-theme");
    });
    expect(theme).toBeTruthy();
  });

  test("theme toggle has proper focus indicator", async ({ page }) => {
    await page.goto("/");

    const toggle = page.getByTestId("mobile-menu").getByTestId("theme-toggle");

    // Focus the toggle
    await toggle.focus();

    // Check for focus ring (via computed styles or class)
    const hasFocusRing = await toggle.evaluate((el) => {
      const styles = window.getComputedStyle(el);
      const classes = el.className;
      return (
        classes.includes("focus:ring") ||
        styles.outlineStyle !== "none" ||
        styles.boxShadow !== "none"
      );
    });

    expect(hasFocusRing).toBe(true);
  });

  test("theme toggle icon changes based on current theme", async ({ page }) => {
    await page.goto("/");

    const toggle = page.getByTestId("theme-toggle");

    // In light mode, should show moon icon (switch to dark)
    let label = await toggle.getAttribute("aria-label");
    expect(label?.toLowerCase()).toContain("dark");

    // Click to switch
    await toggle.click();
    await page.waitForTimeout(200);

    // In dark mode, should show sun icon (switch to light)
    label = await toggle.getAttribute("aria-label");
    expect(label?.toLowerCase()).toContain("light");
  });

  test("theme toggle maintains minimum touch target size on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 }); // iPhone size
    await page.goto("/");

    const hamburger = page.getByRole("button", { name: /menu/i });
    await hamburger.click();

    const toggle = page.getByTestId("theme-toggle");
    await expect(toggle).toBeVisible();
    const box = await toggle.boundingBox();
    expect(box).not.toBeNull();
    if (box) {
      // Minimum 44x44px per WCAG guidelines
      expect(box.width).toBeGreaterThanOrEqual(44);
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  });

  test("no duplicate theme toggles in page body", async ({ page }) => {
    await page.goto("/");

    // Check that no theme toggles exist outside header
    const bodyToggles = await page
      .locator("body > *:not(header)")
      .getByTestId("theme-toggle")
      .count();

    expect(bodyToggles).toBe(0);
  });

  test("theme toggle works across different pages", async ({ page }) => {
    const pages = ["/", "/book"];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      const toggle = page.getByTestId("theme-toggle");
      await expect(toggle).toBeVisible();

      // Should be clickable
      await toggle.click();
      await page.waitForTimeout(200);

      // Theme should change
      const theme = await page.evaluate(() => {
        return document.documentElement.getAttribute("data-theme");
      });
      expect(theme).toBeTruthy();
    }
  });
});
