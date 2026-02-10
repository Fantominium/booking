import { test, expect } from "@playwright/test";

test("booking flow loads service catalog", async ({ page }) => {
  await page.goto("/book");
  await expect(page.getByText("Book a massage")).toBeVisible();
});
