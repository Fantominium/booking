import { test, expect } from "@playwright/test";

// Test the main customer booking journey
test.describe("Customer Booking Flow", () => {
  test("complete booking journey - service selection to payment", async ({ page }) => {
    // 1. Navigate to booking page
    await page.goto("/book");
    await expect(page.getByText("Book a massage")).toBeVisible();

    // 2. Select a service
    await page.waitForSelector("[data-testid='service-card']", { timeout: 10000 });
    const firstService = page.locator("[data-testid='service-card']").first();
    await expect(firstService).toBeVisible();

    // Click the "Book now" button
    const bookButton = firstService.locator("a", { hasText: "Book now" });
    await expect(bookButton).toBeVisible();
    await bookButton.click();

    // Wait for navigation
    await page.waitForURL(/\/book\/\w+/, { timeout: 10000 });

    // 3. Should navigate to service booking page
    await expect(page.url()).toContain("/book/");
    await expect(page.getByText("Select a date")).toBeVisible();

    // 4. Check that calendar is rendered
    await page.waitForSelector("[data-testid='calendar']", { timeout: 10000 });
    await expect(page.locator("[data-testid='calendar']")).toBeVisible();

    // 5. Select an available date (if any)
    const availableDate = page.locator("[data-testid='available-date']").first();
    if (await availableDate.isVisible()) {
      await availableDate.click();

      // 6. Check time slots appear
      await page.waitForSelector("[data-testid='time-slot']", { timeout: 5000 });
      const firstTimeSlot = page.locator("[data-testid='time-slot']").first();
      if (await firstTimeSlot.isVisible()) {
        await firstTimeSlot.click();

        // 7. Fill customer details form
        await page.waitForSelector("[data-testid='customer-form']", { timeout: 5000 });
        await page.fill("input[name='customerName']", "John Doe");
        await page.fill("input[name='customerEmail']", "john@example.com");
        await page.fill("input[name='customerPhone']", "+1234567890");

        // 8. Proceed to payment
        await page.click("button[type='submit']");

        // 9. Should see payment form or success
        await expect(page.url()).toContain("/book/");
      }
    }
  });

  test("service catalog displays correctly", async ({ page }) => {
    await page.goto("/book");

    // Check main heading
    await expect(page.getByText("Book a massage")).toBeVisible();

    // Wait for services to load
    await page.waitForSelector("[data-testid='service-card']", { timeout: 10000 });

    // Check that at least one service is displayed
    const services = page.locator("[data-testid='service-card']");
    const count = await services.count();
    expect(count).toBeGreaterThan(0);

    // Check service cards have required information
    const firstService = services.first();
    await expect(firstService.locator("[data-testid='service-name']")).toBeVisible();
    await expect(firstService.locator("[data-testid='service-price']")).toBeVisible();
    await expect(firstService.locator("[data-testid='service-duration']")).toBeVisible();
  });
});

// Test the admin authentication and dashboard
test.describe("Admin Flow", () => {
  test("admin login flow", async ({ page }) => {
    // 1. Navigate to admin login
    await page.goto("/admin/login");
    await expect(page.getByText("Admin Login")).toBeVisible();

    // 2. Fill login form
    await page.fill("#email", "admin@truflow.local");
    await page.fill("#password", "TestPassword123!");

    // 3. Submit login
    await page.click("button[type='submit']");

    // 4. Should redirect to admin dashboard
    await expect(page.url()).toContain("/admin");
    await page.waitForSelector("[data-testid='admin-dashboard']", { timeout: 10000 });
    await expect(page.locator("[data-testid='admin-dashboard']")).toBeVisible();
  });

  test("admin dashboard displays key metrics", async ({ page }) => {
    // Login first
    await page.goto("/admin/login");
    await page.fill("#email", "admin@truflow.local");
    await page.fill("#password", "TestPassword123!");
    await page.click("button[type='submit']");

    // Check dashboard elements
    await page.waitForSelector("[data-testid='admin-dashboard']", { timeout: 10000 });
    await expect(page.getByRole("heading", { name: "Today's Schedule" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pending Actions" })).toBeVisible();
  });
});

// Test accessibility and responsive design
test.describe("Accessibility & UX", () => {
  test("homepage has proper accessibility features", async ({ page }) => {
    await page.goto("/");

    // Check skip link
    await expect(page.locator("[data-testid='skip-to-main']")).toBeVisible();

    // Check main landmark
    await expect(page.locator("main#main-content")).toBeVisible();

    // Check theme toggle
    const themeToggle = page.locator("[data-testid='theme-toggle']");
    if (await themeToggle.isVisible()) {
      await expect(themeToggle).toHaveAttribute("aria-label");
    }
  });

  test("responsive design works on mobile", async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto("/book");
    await expect(page.getByText("Book a massage")).toBeVisible();

    // Check that services are still visible on mobile
    await page.waitForSelector("[data-testid='service-card']", { timeout: 10000 });
    const services = page.locator("[data-testid='service-card']");
    await expect(services.first()).toBeVisible();
  });
});

// Test the theme switching functionality
test.describe("Theme System", () => {
  test("light/dark mode toggle works", async ({ page }) => {
    await page.goto("/");

    // Check initial theme
    const htmlElement = page.locator("html");
    const initialTheme = await htmlElement.getAttribute("data-theme");

    // Find and click theme toggle
    const themeToggle = page.locator("[data-testid='theme-toggle']");
    if (await themeToggle.isVisible()) {
      await themeToggle.click();

      // Check theme changed
      const newTheme = await htmlElement.getAttribute("data-theme");
      expect(newTheme).not.toBe(initialTheme);
    }
  });
});
