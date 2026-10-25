import type { Prisma, PrismaClient } from "@prisma/client";

import { emitAlert } from "@/lib/ops/alerts";
import { queueEmailJob, type EmailJobPayload } from "@/lib/services/email";

const DEFAULT_BATCH_SIZE = 50;

// Call inside the same transaction as the state change so the notice exists iff the transition committed.
export const enqueueOutboxEmail = async (
  tx: Prisma.TransactionClient,
  payload: Pick<EmailJobPayload, "bookingId" | "customerEmail" | "type" | "dedupeKey">,
): Promise<void> => {
  await tx.emailOutbox.createMany({
    data: [
      {
        bookingId: payload.bookingId,
        customerEmail: payload.customerEmail,
        type: payload.type,
        dedupeKey: payload.dedupeKey ?? `${payload.bookingId}:${payload.type}`,
      },
    ],
    skipDuplicates: true,
  });
};

// At-least-once dispatch; the BullMQ jobId equals dedupeKey, so a crash between enqueue and marking is harmless.
export const dispatchEmailOutbox = async (params: {
  prisma: PrismaClient;
  limit?: number;
}): Promise<{ dispatched: number; failed: number }> => {
  const pending = await params.prisma.emailOutbox.findMany({
    where: { dispatchedAt: null },
    orderBy: { createdAt: "asc" },
    take: params.limit ?? DEFAULT_BATCH_SIZE,
  });

  let dispatched = 0;
  let failed = 0;
  for (const row of pending) {
    try {
      await queueEmailJob({
        bookingId: row.bookingId,
        customerEmail: row.customerEmail,
        type: row.type as EmailJobPayload["type"],
        dedupeKey: row.dedupeKey,
      });
      await params.prisma.emailOutbox.update({
        where: { id: row.id },
        data: { dispatchedAt: new Date() },
      });
      dispatched += 1;
    } catch {
      failed += 1;
    }
  }

  if (failed > 0) {
    await emitAlert("outbox_dispatch_failed", { job: "dispatch-email-outbox", failed, dispatched });
  }

  return { dispatched, failed };
};
