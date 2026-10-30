import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateMany, findUnique, settingsFindFirst, auditCreate, queueEmailJob } = vi.hoisted(
  () => ({
    updateMany: vi.fn(),
    findUnique: vi.fn(),
    settingsFindFirst: vi.fn(),
    auditCreate: vi.fn(),
    queueEmailJob: vi.fn(),
  }),
);

vi.mock("@/lib/services/email-outbox", () => ({
  enqueueOutboxEmail: queueEmailJob,
  dispatchEmailOutbox: vi.fn().mockResolvedValue({ dispatched: 0, failed: 0 }),
}));
vi.mock("@/lib/cache/availability", () => ({ invalidateAvailabilityCache: vi.fn() }));

import { markBookingAsPaid } from "@/lib/services/booking";

const pendingBooking = {
  id: "booking-1",
  status: "PENDING",
  paymentMethod: "BANK_TRANSFER",
  paymentState: "PENDING_BANK_TRANSFER",
  downpaymentPaidCents: 0,
  remainingBalanceCents: 6000,
  stripePaymentIntentId: null,
  customerEmail: "customer@example.com",
  startTime: new Date("2030-01-01T13:00:00.000Z"),
  endTime: new Date("2030-01-01T15:00:00.000Z"),
  service: {
    name: "Massage",
    offeringType: "EVENT",
    durationMin: 60,
    priceCents: 8000,
    downpaymentCents: 2000,
    durationPriceOptions: [{ durationMin: 60, priceCents: 8000 }],
  },
};

type ReconciliationTransaction = {
  booking: { updateMany: typeof updateMany };
  paymentAuditLog: { findUnique: ReturnType<typeof vi.fn>; create: typeof auditCreate };
};

const buildPrisma = (): never => {
  const transaction: ReconciliationTransaction = {
    booking: { updateMany },
    paymentAuditLog: { findUnique: vi.fn().mockResolvedValue(null), create: auditCreate },
  };
  const runTransaction = (
    callback: (transaction: ReconciliationTransaction) => Promise<unknown>,
  ): Promise<unknown> => callback(transaction);

  return {
    booking: { findUnique },
    systemSettings: { findFirst: settingsFindFirst },
    $transaction: vi.fn(runTransaction),
  } as never;
};

describe("bank-transfer reconciliation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    findUnique.mockResolvedValue(pendingBooking);
    settingsFindFirst.mockResolvedValue({ bufferMinutes: 60 });
    updateMany.mockResolvedValue({ count: 1 });
    auditCreate.mockResolvedValue({});
    queueEmailJob.mockResolvedValue(undefined);
  });

  it("confirms a verified deposit but preserves the remaining balance", async () => {
    const prisma = buildPrisma();

    const result = await markBookingAsPaid({
      prisma,
      bookingId: "booking-1",
      verifiedAmountCents: 2000,
      transferReference: "BANK-REF-1001",
      verifiedByAdminId: "admin-1",
    });

    expect(updateMany).toHaveBeenCalledWith({
      where: {
        id: "booking-1",
        status: "PENDING",
        paymentMethod: "BANK_TRANSFER",
        paymentState: { in: ["PENDING_BANK_TRANSFER", "PENDING_BANK_TRANSFER_REVIEW"] },
        downpaymentPaidCents: 0,
      },
      data: {
        status: "CONFIRMED",
        paymentState: "DEPOSIT_PAID",
        downpaymentPaidCents: 2000,
        remainingBalanceCents: 6000,
      },
    });
    expect(result).toMatchObject({ status: "CONFIRMED", paymentState: "DEPOSIT_PAID" });
    expect(auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "PAYMENT_RECEIVED",
        amountCents: 2000,
        externalTransferReference: "BANK-REF-1001",
        verifiedByAdminId: "admin-1",
        outcome: "SUCCESS",
      }),
    });
    expect(queueEmailJob).toHaveBeenCalledWith(expect.anything(), {
      bookingId: "booking-1",
      customerEmail: "customer@example.com",
      type: "CONFIRMATION",
    });
  });

  it("marks a full verified amount paid in full", async () => {
    const prisma = buildPrisma();

    const result = await markBookingAsPaid({
      prisma,
      bookingId: "booking-1",
      verifiedAmountCents: 8000,
      transferReference: "BANK-REF-FULL",
      verifiedByAdminId: "admin-1",
    });

    expect(updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "CONFIRMED",
          paymentState: "PAID_IN_FULL",
          downpaymentPaidCents: 8000,
          remainingBalanceCents: 0,
        }),
      }),
    );
    expect(result.paymentState).toBe("PAID_IN_FULL");
  });

  it("rejects a second reconciliation after another transition wins", async () => {
    updateMany.mockResolvedValueOnce({ count: 0 });
    const prisma = buildPrisma();

    await expect(
      markBookingAsPaid({
        prisma,
        bookingId: "booking-1",
        verifiedAmountCents: 2000,
        transferReference: "BANK-REF-1002",
        verifiedByAdminId: "admin-1",
      }),
    ).rejects.toThrow("no longer pending bank-transfer reconciliation");
    expect(queueEmailJob).not.toHaveBeenCalled();
    expect(auditCreate).not.toHaveBeenCalled();
  });
});
