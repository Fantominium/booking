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

    await page.locator("[data-testid='available-date']").first().click();
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
});
