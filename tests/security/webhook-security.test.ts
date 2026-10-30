import { describe, expect, it } from "vitest";

describe("deferred Stripe webhook boundary", () => {
  it("returns unavailable without requiring webhook secrets", async () => {
    const { POST } = await import("@/app/api/webhooks/stripe/[token]/route");

    const response = await POST();

    expect(response.status).toBe(503);
  }, 10000);
});
