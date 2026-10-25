import { describe, expect, it, vi } from "vitest";

const queueEmailJob = vi.hoisted(() => vi.fn());

vi.mock("@/lib/services/email-outbox", () => ({ enqueueOutboxEmail: queueEmailJob }));

import { advancePendingTransferExpiry } from "@/lib/services/booking-expiry";

describe("pending transfer expiry lifecycle", () => {
  it("moves elapsed holds to review and releases only rows still pending after grace", async () => {
    queueEmailJob.mockResolvedValue(undefined);
    const now = new Date("2030-01-02T12:00:00.000Z");
    const updateMany = vi
      .fn()
      .mockResolvedValueOnce({ count: 2 })
      .mockResolvedValueOnce({ count: 1 });
    const findMany = vi
      .fn()
      .mockResolvedValue([{ id: "booking-review-expired", customerEmail: "customer@example.com" }]);
    const client = {
      booking: { updateMany, findMany },
      $transaction: (callback: (tx: unknown) => Promise<unknown>) => callback(client),
    };
    const prisma = client as never;

    const result = await advancePendingTransferExpiry({ prisma, now });

    expect(result).toEqual({ enteredReview: 2, expired: 1 });
    expect(updateMany).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
          paymentState: "PENDING_BANK_TRANSFER",
          transferExpiresAt: { lte: now },
        }),
        data: expect.objectContaining({
          paymentState: "PENDING_BANK_TRANSFER_REVIEW",
          reviewGraceExpiresAt: new Date("2030-01-02T14:00:00.000Z"),
        }),
      }),
    );
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: "PENDING",
          paymentState: "PENDING_BANK_TRANSFER_REVIEW",
          reviewGraceExpiresAt: { lte: now },
        }),
      }),
    );
    expect(updateMany).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: expect.objectContaining({
          id: "booking-review-expired",
          status: "PENDING",
          paymentState: "PENDING_BANK_TRANSFER_REVIEW",
          reviewGraceExpiresAt: { lte: now },
        }),
        data: expect.objectContaining({ status: "EXPIRED", paymentState: "EXPIRED" }),
      }),
    );
    expect(queueEmailJob).toHaveBeenCalledWith(expect.anything(), {
      bookingId: "booking-review-expired",
      customerEmail: "customer@example.com",
      type: "EXPIRY_NOTICE",
    });
  });

  it("does not send a notice if reconciliation or cancellation wins the final transition", async () => {
    queueEmailJob.mockClear();
    const client = {
      booking: {
        updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        findMany: vi
          .fn()
          .mockResolvedValue([
            { id: "booking-already-transitioned", customerEmail: "customer@example.com" },
          ]),
      },
      $transaction: (callback: (tx: unknown) => Promise<unknown>) => callback(client),
    };
    const prisma = client as never;

    const result = await advancePendingTransferExpiry({
      prisma,
      now: new Date("2030-01-02T12:00:00.000Z"),
    });

    expect(result.expired).toBe(0);
    expect(queueEmailJob).not.toHaveBeenCalled();
  });
});
