import { expect, test } from "@playwright/test";

test.describe("Customer Booking Flow", () => {
  test("catalog groups offerings by journey type", async ({ page }) => {
    await page.goto("/book");

    await expect(
      page.getByRole("heading", { name: /reserve a session, event, or rental/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: /sessions/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /events/i })).toBeVisible();
    await expect(page.getByRole("heading", { name: /rentals/i })).toBeVisible();
  });

  test("customer can finish with bank transfer instructions", async ({ page }) => {
    await page.goto("/book?type=SESSION");

    await page.locator("[data-testid='service-card'] a").first().click();
    await expect(page.getByText("Select a date")).toBeVisible();

    const dateInput = page.locator("[data-testid='date-input']");
    await expect(dateInput).toBeEnabled();
    const firstAvailableDate = await dateInput.getAttribute("min");
    if (!firstAvailableDate) {
      throw new Error("Expected at least one available booking date");
    }
    await dateInput.fill(firstAvailableDate);

    await page.locator("[data-testid='time-slot']").first().click();

    await page.fill("input[name='customerName']", "Jordan Doe");
    await page.fill("input[name='customerEmail']", "jordan@example.com");
    await page.fill("input[name='customerPhone']", "+1234567890");
    await page.getByLabel("Reserve with bank transfer").click();
    await page.getByRole("button", { name: "Continue to payment" }).click();

    await expect(page).toHaveURL(/\/book\/success/);
    await expect(page.getByText(/bank transfer instructions/i)).toBeVisible();
    await expect(page.getByText(/pending payment state/i)).toBeVisible();
  });

  test("service booking page renders hero media container and fade", async ({ page }) => {
    await page.goto("/book?type=SESSION");

    const deepTissueCard = page
      .locator("[data-testid='service-card']")
      .filter({ hasText: "Deep Tissue Massage" });
    await deepTissueCard.locator("a").click();

    await expect(page.locator("[data-testid='service-hero-media']")).toBeVisible();
    await expect(page.locator(".hero-media-fade")).toBeVisible();
  });

  test("reduced motion disables animated media rendering", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/book?type=SESSION");

    const deepTissueCard = page
      .locator("[data-testid='service-card']")
      .filter({ hasText: "Deep Tissue Massage" });

    const cardMediaTag = await deepTissueCard
      .locator("[data-testid='service-card-media']")
      .evaluate((node) => node.tagName);
    expect(cardMediaTag).toBe("DIV");

    await deepTissueCard.locator("a").click();

    await expect(page.locator("video[data-testid='service-hero-media']")).toHaveCount(0);
    await expect(page.locator("[data-testid='service-hero-media']")).toBeVisible();
  });
});
