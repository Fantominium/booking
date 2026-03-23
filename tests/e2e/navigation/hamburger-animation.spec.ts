import { test, expect } from "@playwright/test";

test.describe("Mobile Navigation Dialog", () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
  });

  test("keeps the trigger on the left and the brand on the right", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: /open menu/i });
    const brand = page.locator("header").getByRole("link", { name: /truflow/i }).first();

    const triggerBox = await trigger.boundingBox();
    const brandBox = await brand.boundingBox();

    expect(triggerBox).not.toBeNull();
    expect(brandBox).not.toBeNull();

    if (triggerBox && brandBox) {
      expect(triggerBox.x).toBeLessThan(80);
      expect(brandBox.x).toBeGreaterThan(160);
    }
  });

  test("opens and closes the dialog with updated aria labels", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByTestId("hamburger-button");
    await trigger.click();

    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(trigger).toHaveAttribute("aria-label", "Close menu");
    await expect(page.getByRole("dialog", { name: /navigation menu/i })).toBeVisible();

    const closeTrigger = page.getByRole("button", { name: /close menu/i }).first();
    await closeTrigger.click();

    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(trigger).toHaveAttribute("aria-label", "Open menu");
  });

  test("supports escape to dismiss", async ({ page }) => {
    await page.goto("/");

    await page.getByRole("button", { name: /open menu/i }).click();
    await page.keyboard.press("Escape");

    await expect(page.getByRole("button", { name: /open menu/i })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  test("meets the minimum touch target size", async ({ page }) => {
    await page.goto("/");

    const trigger = page.getByRole("button", { name: /open menu/i });
    const bbox = await trigger.boundingBox();

    expect(bbox).not.toBeNull();
    if (bbox) {
      expect(bbox.width).toBeGreaterThanOrEqual(44);
      expect(bbox.height).toBeGreaterThanOrEqual(44);
    }
  });
});
