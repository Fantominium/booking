import { subDays, subYears } from "date-fns";
import type { PrismaClient } from "@prisma/client";

import { maintenanceQueue } from "@/lib/queue/config";
import { prisma } from "@/lib/prisma";
import { advancePendingTransferExpiry } from "@/lib/services/booking-expiry";
import { purgeOldCustomerData } from "@/lib/services/data-deletion";
import { dispatchEmailOutbox } from "@/lib/services/email-outbox";

export const enqueueMaintenanceSchedules = async (): Promise<void> => {
  await maintenanceQueue.add(
    "advance-transfer-expiry",
    {},
    { jobId: "schedule-transfer-expiry", repeat: { every: 5 * 60 * 1000 }, removeOnComplete: 100 },
  );
  await maintenanceQueue.add(
    "dispatch-email-outbox",
    {},
    { jobId: "schedule-email-outbox", repeat: { every: 60 * 1000 }, removeOnComplete: 100 },
  );
  await maintenanceQueue.add(
    "privacy-maintenance",
    {},
    {
      jobId: "schedule-privacy-maintenance",
      repeat: { every: 60 * 60 * 1000 },
      removeOnComplete: 100,
    },
  );
};

export const runPrivacyMaintenance = async (params: {
  prisma: PrismaClient;
  now?: Date;
}): Promise<{
  enteredReview: number;
  expiredBookings: number;
  expiredIdempotency: number;
  expiredResetTokens: number;
  expiredDeletionRequests: number;
  oldAuditRecords: number;
  dispatchedOutboxRows: number;
  anonymizedCustomers: number;
}> => {
  const now = params.now ?? new Date();
  const expiry = await advancePendingTransferExpiry({ prisma: params.prisma, now });
  const auditRetentionBoundary = subYears(now, 1);

  const outboxRetentionBoundary = subDays(now, 7);

  const [idempotency, resetTokens, deletionRequests, auditRecords, outboxRows] = await Promise.all([
    params.prisma.bookingIdempotency.deleteMany({ where: { expiresAt: { lte: now } } }),
    params.prisma.passwordResetToken.deleteMany({
      where: { OR: [{ expiresAt: { lte: now } }, { usedAt: { not: null } }] },
    }),
    params.prisma.dataDeletionRequest.deleteMany({
      where: { OR: [{ expiresAt: { lte: now } }, { confirmedAt: { not: null } }] },
    }),
    params.prisma.dataDeletionAuditLog.deleteMany({
      where: { timestamp: { lt: auditRetentionBoundary } },
    }),
    // Dispatched outbox rows hold customer email addresses; keep them only long enough to debug delivery.
    params.prisma.emailOutbox.deleteMany({
      where: { dispatchedAt: { lt: outboxRetentionBoundary } },
    }),
  ]);
  const anonymizedCustomers = await purgeOldCustomerData(now);

  return {
    enteredReview: expiry.enteredReview,
    expiredBookings: expiry.expired,
    expiredIdempotency: idempotency.count,
    expiredResetTokens: resetTokens.count,
    expiredDeletionRequests: deletionRequests.count,
    oldAuditRecords: auditRecords.count,
    dispatchedOutboxRows: outboxRows.count,
    anonymizedCustomers,
  };
};

export type MaintenanceJobName =
  | "advance-transfer-expiry"
  | "privacy-maintenance"
  | "dispatch-email-outbox";

export const runMaintenanceJob = async (params: {
  name: MaintenanceJobName;
  prisma?: PrismaClient;
  now?: Date;
}): Promise<unknown> => {
  const client = params.prisma ?? prisma;
  if (params.name === "advance-transfer-expiry") {
    const result = await advancePendingTransferExpiry({ prisma: client, now: params.now });
    // Deliver the expiry notices in the same run instead of waiting for the next outbox tick.
    await dispatchEmailOutbox({ prisma: client });
    return result;
  }
  if (params.name === "dispatch-email-outbox") {
    return dispatchEmailOutbox({ prisma: client });
  }
  return runPrivacyMaintenance({ prisma: client, now: params.now });
};

export const queueMaintenanceJob = async (name: MaintenanceJobName): Promise<void> => {
  await maintenanceQueue.add(name, {}, { jobId: `${name}:manual:${Date.now()}`, attempts: 3 });
};
