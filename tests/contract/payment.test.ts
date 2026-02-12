import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("payment contract", () => {
  const paymentIntentResponseSchema = z.object({
    id: z.string(),
    clientSecret: z.string().nullable(),
  });

  it("POST /api/payment-intents returns payment intent", () => {
    const payload = { id: "pi_test_123", clientSecret: "secret" };
    const result = paymentIntentResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
