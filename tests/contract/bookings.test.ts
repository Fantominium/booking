import { describe, expect, it } from "vitest";

describe("bookings contract", () => {
  it("POST /api/bookings returns a pending bank-transfer booking", () => {
    const payload = {
      id: "booking-123",
      status: "PENDING",
      paymentMethod: "BANK_TRANSFER",
      paymentState: "PENDING_BANK_TRANSFER",
      bankTransferReference: "TRU-BOOKING-123",
      bankTransferInstructions: "Use the booking reference as the transfer memo.",
    };

    expect(payload).toMatchObject({
      status: "PENDING",
      paymentMethod: "BANK_TRANSFER",
      paymentState: "PENDING_BANK_TRANSFER",
    });
    expect(payload).not.toHaveProperty("paymentIntentId");
    expect(payload).not.toHaveProperty("clientSecret");
  });
});
