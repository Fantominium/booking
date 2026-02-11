import { describe, expect, it, vi } from "vitest";

const refundMock = vi.fn(async () => "refund_123");
const queueEmailJobMock = vi.fn(async () => undefined);
const logPaymentAuditMock = vi.fn(async () => undefined);

vi.mock("@/lib/services/stripe-payment-provider", () => ({
  createStripePaymentProvider: () => ({
    createPaymentIntent: vi.fn(async () => ({ id: "pi_123", clientSecret: "secret" })),
    refund: refundMock,
  }),
}));

vi.mock("@/lib/services/email", () => ({
  queueEmailJob: queueEmailJobMock,
}));

vi.mock("@/lib/services/audit", () => ({
  hasPaymentAuditEvent: vi.fn(async () => false),
  logPaymentAudit: logPaymentAuditMock,
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {
    booking: {
      findUnique: vi.fn(async () => ({
        id: "booking_1",
        customerEmail: "customer@example.com",
      })),
    },
  },
}));

describe("refund email queue", () => {
  it("queues refund notification email", async () => {
    const { refundPaymentIntent } = await import("@/lib/services/payment");

    await refundPaymentIntent({
      bookingId: "booking_1",
      paymentIntentId: "pi_123",
      amountCents: 2000,
    });

    expect(queueEmailJobMock).toHaveBeenCalledWith({
      bookingId: "booking_1",
      customerEmail: "customer@example.com",
      type: "REFUND_NOTIFICATION",
    });
  });
});
