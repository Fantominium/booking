import { test, expect } from "@playwright/test";

test.describe("Customer Journey - Navigation Flow", () => {
  test("home page cleanup: no book/admin buttons visible", async ({ page }) => {
    await page.goto("/");

    // Verify "Book Appointment" button is NOT present
    await expect(page.getByRole("link", { name: /book appointment/i })).not.toBeVisible();

    // Verify "Admin" link is NOT present
    await expect(page.getByRole("link", { name: /^admin$/i })).not.toBeVisible();

    // Verify logo and company name are present (header)
    const headerLogo = page
      .locator("header")
      .getByRole("link", { name: /truflow/i })
      .first();
    await expect(headerLogo).toBeVisible();
  });

  test("home page: no breadcrumbs visible", async ({ page }) => {
    await page.goto("/");

    // Breadcrumbs should not be present on home page
    const breadcrumbs = page.locator('[aria-label*="breadcrumb"], [role="navigation"] nav');
    await expect(breadcrumbs).not.toBeVisible();
  });

  test("booking flow: breadcrumbs appear at /book", async ({ page }) => {
    await page.goto("/book");

    // Breadcrumbs should appear
    const breadcrumbs = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(breadcrumbs).toBeVisible();

    // Should show "Home" link
    await expect(page.getByRole("link", { name: /home/i })).toBeVisible();

    // Should show current step "Services"
    await expect(page.getByText("Services")).toBeVisible();
  });

  test("booking flow: breadcrumbs update through steps", async ({ page }) => {
    // Step 1: Services
    await page.goto("/book");
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toContainText("Services");

    // Step 2: Date & Time
    await page.goto("/book/time");
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toContainText(
      "Date & Time",
    );

    // Step 3: Details
    await page.goto("/book/details");
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toContainText("Details");

    // Step 4: Payment
    await page.goto("/book/payment");
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toContainText("Payment");

    // Step 5: Confirmation
    await page.goto("/book/confirmation");
    await expect(page.getByRole("navigation", { name: /breadcrumb/i })).toContainText(
      "Confirmation",
    );
  });

  test("logo links to home from any booking step", async ({ page }) => {
    await page.goto("/book/payment");

    // Click logo
    await page
      .locator("header")
      .getByRole("link", { name: /truflow/i })
      .first()
      .click();

    // Should navigate to home
    await expect(page).toHaveURL("/");

    // Breadcrumbs should disappear
    const breadcrumbs = page.getByRole("navigation", { name: /breadcrumb/i });
    await expect(breadcrumbs).not.toBeVisible();
  });

  test("header height consistency: home vs booking", async ({ page }) => {
    // Measure header height on home page
    await page.goto("/");
    const homeHeader = page.locator("header").first();
    const homeBox = await homeHeader.boundingBox();
    const homeHeight = homeBox?.height || 0;

    // Measure header height on booking page
    await page.goto("/book");
    const bookingHeader = page.locator("header").first();
    const bookingBox = await bookingHeader.boundingBox();
    const bookingHeight = bookingBox?.height || 0;

    // Heights should be within 5px (SC-002 requirement)
    expect(Math.abs(homeHeight - bookingHeight)).toBeLessThanOrEqual(5);
  });

  test("theme toggle remains accessible throughout journey", async ({ page }) => {
    // Home page
    await page.goto("/");
    await expect(page.getByTestId("theme-toggle")).toBeVisible();

    // Booking page
    await page.goto("/book");
    await expect(page.getByTestId("theme-toggle")).toBeVisible();

    // Only one theme toggle should exist
    const toggleCount = await page.getByTestId("theme-toggle").count();
    expect(toggleCount).toBe(1);
  });
});
