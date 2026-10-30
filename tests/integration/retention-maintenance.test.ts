import { afterEach, describe, expect, it, vi } from "vitest";

const queueAdd = vi.hoisted(() => vi.fn());
const advanceExpiryMock = vi.hoisted(() => vi.fn());
const purgeMock = vi.hoisted(() => vi.fn());

vi.mock("@/lib/queue/config", () => ({ maintenanceQueue: { add: queueAdd } }));
vi.mock("@/lib/services/booking-expiry", () => ({
  advancePendingTransferExpiry: advanceExpiryMock,
}));
vi.mock("@/lib/services/data-deletion", () => ({ purgeOldCustomerData: purgeMock }));
vi.mock("@/lib/services/email-outbox", () => ({ dispatchEmailOutbox: vi.fn() }));

import { enqueueMaintenanceSchedules, runPrivacyMaintenance } from "@/lib/jobs/maintenance";

describe("scheduled release maintenance", () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it("registers recurring expiry and privacy cleanup jobs idempotently", async () => {
    queueAdd.mockResolvedValue(undefined);

    await enqueueMaintenanceSchedules();

    expect(queueAdd).toHaveBeenCalledWith(
      "advance-transfer-expiry",
      {},
      expect.objectContaining({
        jobId: "schedule-transfer-expiry",
        repeat: { every: 5 * 60 * 1000 },
      }),
    );
    expect(queueAdd).toHaveBeenCalledWith(
      "privacy-maintenance",
      {},
      expect.objectContaining({
        jobId: "schedule-privacy-maintenance",
        repeat: { every: 60 * 60 * 1000 },
      }),
    );
  });

  it("purges expired one-time credentials, one-year audit rows, and anonymizes aged customer data without deleting bookings", async () => {
    const deleteMany = vi.fn().mockResolvedValue({ count: 2 });
    const prisma = {
      bookingIdempotency: { deleteMany },
      passwordResetToken: { deleteMany },
      dataDeletionRequest: { deleteMany },
      dataDeletionAuditLog: { deleteMany },
      emailOutbox: { deleteMany },
    };
    advanceExpiryMock.mockResolvedValue({ enteredReview: 1, expired: 1 });
    purgeMock.mockResolvedValue(3);

    const result = await runPrivacyMaintenance({
      prisma: prisma as never,
      now: new Date("2030-01-01T00:00:00Z"),
    });

    expect(advanceExpiryMock).toHaveBeenCalledOnce();
    expect(deleteMany).toHaveBeenCalledTimes(5);
    expect(deleteMany).toHaveBeenCalledWith({
      where: { dispatchedAt: { lt: new Date("2029-12-25T00:00:00.000Z") } },
    });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { expiresAt: { lte: new Date("2030-01-01T00:00:00Z") } },
    });
    expect(deleteMany).toHaveBeenCalledWith({
      where: { timestamp: { lt: new Date("2029-01-01T00:00:00.000Z") } },
    });
    expect(result).toMatchObject({
      expiredIdempotency: 2,
      expiredResetTokens: 2,
      expiredDeletionRequests: 2,
      oldAuditRecords: 2,
    });
    expect(purgeMock).toHaveBeenCalledWith(new Date("2030-01-01T00:00:00Z"));
    expect(result.anonymizedCustomers).toBe(3);
    expect(prisma).not.toHaveProperty("booking.deleteMany");
  });
});
