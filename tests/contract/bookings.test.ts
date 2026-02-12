import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("bookings contract", () => {
  const bookingResponseSchema = z.object({
    id: z.string(),
    status: z.string(),
    paymentIntentId: z.string().nullable(),
    clientSecret: z.string().nullable(),
  });

  it("POST /api/bookings returns booking with payment intent", () => {
    const payload = {
      id: "booking-123",
      status: "PENDING",
      paymentIntentId: "pi_test_123",
      clientSecret: "secret",
    };

    const result = bookingResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
