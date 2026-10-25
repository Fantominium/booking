// @vitest-environment node
import type { PrismaClient } from "@prisma/client";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";

const databaseUrl = process.env.INTEGRATION_DATABASE_URL;
const isIsolatedTestDatabase = Boolean(databaseUrl && /\/[^/?]*_test(\?|$)/.test(databaseUrl));

const { testPrisma, queueAdd } = vi.hoisted(() => ({
  testPrisma: { current: null as unknown },
  queueAdd: vi.fn(),
}));

vi.mock("@/lib/prisma", async () => {
  const prismaPackage = await import("@prisma/client");
  testPrisma.current = new prismaPackage.PrismaClient({
    datasourceUrl: process.env.INTEGRATION_DATABASE_URL,
  });
  return { prisma: testPrisma.current };
});
vi.mock("@/lib/queue/config", () => ({ emailQueue: { add: queueAdd } }));

import { advancePendingTransferExpiry } from "@/lib/services/booking-expiry";
import { cancelBooking, markBookingAsPaid } from "@/lib/services/booking";
import { dispatchEmailOutbox } from "@/lib/services/email-outbox";
import { getAdminAttentionItems } from "@/lib/services/admin-attention";

// Destructive: runs only against a database whose name ends in `_test`.
describe.skipIf(!isIsolatedTestDatabase)("PostgreSQL transfer lifecycle and outbox", () => {
  const prisma = (): PrismaClient => testPrisma.current as PrismaClient;
  const now = new Date("2030-06-15T12:00:00Z");
  let serviceId = "";
  let adminId = "";

  const seedBooking = async (
    overrides: Partial<{
      paymentState: "PENDING_BANK_TRANSFER" | "PENDING_BANK_TRANSFER_REVIEW";
      hoursAgo: number;
    }> = {},
  ): Promise<string> => {
    const start = new Date(Date.UTC(2030, 6, 20, 14, 0, 0));
    const booking = await prisma().booking.create({
      data: {
        serviceId,
        customerName: "Customer",
        customerEmail: "customer@example.com",
        customerPhone: "555-0100",
        startTime: start,
        endTime: new Date(start.getTime() + 120 * 60 * 1000),
        paymentMethod: "BANK_TRANSFER",
        paymentState: overrides.paymentState ?? "PENDING_BANK_TRANSFER",
        bankTransferReference: "TF-TEST",
        transferExpiresAt: new Date(now.getTime() - 25 * 60 * 60 * 1000),
        reviewGraceExpiresAt:
          overrides.paymentState === "PENDING_BANK_TRANSFER_REVIEW"
            ? new Date(now.getTime() - 60 * 1000)
            : null,
        remainingBalanceCents: 8000,
      },
    });
    return booking.id;
  };

  beforeEach(async () => {
    queueAdd.mockReset();
    queueAdd.mockResolvedValue(undefined);
    await prisma().emailOutbox.deleteMany();
    await prisma().paymentAuditLog.deleteMany();
    await prisma().booking.deleteMany();
    await prisma().service.deleteMany();
    await prisma().systemSettings.deleteMany();
    await prisma().admin.deleteMany();
    serviceId = (
      await prisma().service.create({
        data: {
          name: "Lifecycle Service",
          description: "x",
          offeringType: "SESSION",
          durationMin: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
        },
      })
    ).id;
    adminId = (
      await prisma().admin.create({ data: { email: "admin@example.com", passwordHash: "x" } })
    ).id;
  });

  afterAll(async () => {
    await prisma()?.$disconnect();
  });

  it("holds, then expires after the review grace, writing exactly one notice that dispatches once", async () => {
    const id = await seedBooking();

    expect(await advancePendingTransferExpiry({ prisma: prisma(), now })).toEqual({
      enteredReview: 1,
      expired: 0,
    });
    expect(
      (await getAdminAttentionItems(prisma(), now)).transferReviews.map((item) => item.id),
    ).toEqual([id]);
    expect((await prisma().booking.findUniqueOrThrow({ where: { id } })).paymentState).toBe(
      "PENDING_BANK_TRANSFER_REVIEW",
    );

    const afterGrace = new Date(now.getTime() + 3 * 60 * 60 * 1000);
    expect(await advancePendingTransferExpiry({ prisma: prisma(), now: afterGrace })).toEqual({
      enteredReview: 0,
      expired: 1,
    });
    await advancePendingTransferExpiry({ prisma: prisma(), now: afterGrace });

    const attention = await getAdminAttentionItems(prisma());
    expect(attention.transferReviews).toHaveLength(0);
    expect(attention.expiredTransfers.map((item) => item.id)).toEqual([id]);

    expect(
      await prisma().emailOutbox.count({ where: { bookingId: id, type: "EXPIRY_NOTICE" } }),
    ).toBe(1);
    expect((await prisma().booking.findUniqueOrThrow({ where: { id } })).status).toBe("EXPIRED");

    expect(await dispatchEmailOutbox({ prisma: prisma() })).toEqual({ dispatched: 1, failed: 0 });
    expect(await dispatchEmailOutbox({ prisma: prisma() })).toEqual({ dispatched: 0, failed: 0 });
    expect(queueAdd).toHaveBeenCalledTimes(1);
    expect(queueAdd).toHaveBeenCalledWith(
      "EXPIRY_NOTICE",
      expect.objectContaining({ bookingId: id }),
      expect.objectContaining({ jobId: `${id}:EXPIRY_NOTICE` }),
    );
  });

  it("lets exactly one of expiry, cancellation, and reconciliation win a race, with exactly one notice", async () => {
    const id = await seedBooking({ paymentState: "PENDING_BANK_TRANSFER_REVIEW" });

    await Promise.allSettled([
      advancePendingTransferExpiry({ prisma: prisma(), now }),
      cancelBooking({ prisma: prisma(), bookingId: id }),
      markBookingAsPaid({
        prisma: prisma(),
        bookingId: id,
        verifiedAmountCents: 2000,
        transferReference: "BANK-REF-RACE",
        verifiedByAdminId: adminId,
      }),
    ]);

    const final = await prisma().booking.findUniqueOrThrow({ where: { id } });
    const outbox = await prisma().emailOutbox.findMany({ where: { bookingId: id } });
    const expectedType = {
      EXPIRED: "EXPIRY_NOTICE",
      CANCELLED: "CANCELLATION",
      CONFIRMED: "CONFIRMATION",
    } as const;

    expect(["EXPIRED", "CANCELLED", "CONFIRMED"]).toContain(final.status);
    expect(outbox).toHaveLength(1);
    expect(outbox[0].type).toBe(expectedType[final.status as keyof typeof expectedType]);
    expect(await prisma().paymentAuditLog.count({ where: { bookingId: id } })).toBe(
      final.status === "CONFIRMED" ? 1 : 0,
    );
  });

  it("leaves failed deliveries pending and delivers them on the next dispatch", async () => {
    const id = await seedBooking({ paymentState: "PENDING_BANK_TRANSFER_REVIEW" });
    await advancePendingTransferExpiry({ prisma: prisma(), now });

    queueAdd.mockRejectedValueOnce(new Error("redis down"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => undefined);
    expect(await dispatchEmailOutbox({ prisma: prisma() })).toEqual({ dispatched: 0, failed: 1 });
    expect(errorLog).toHaveBeenCalledWith(
      expect.stringContaining('"event":"outbox_dispatch_failed"'),
    );
    errorLog.mockRestore();
    expect(await prisma().emailOutbox.count({ where: { bookingId: id, dispatchedAt: null } })).toBe(
      1,
    );

    expect(await dispatchEmailOutbox({ prisma: prisma() })).toEqual({ dispatched: 1, failed: 0 });
  });
});
