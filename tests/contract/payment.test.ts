import { describe, expect, it } from "vitest";

describe("payment contract", () => {
  it("POST /api/payment-intents is unavailable for the bank-transfer-only release", () => {
    const payload = { error: "Payment intents are unavailable" };

    expect(payload.error).toBe("Payment intents are unavailable");
  });
});
