import { addHours } from "date-fns";
import type { PrismaClient } from "@prisma/client";

import { invalidateAvailabilityCache } from "@/lib/cache/availability";
import { enqueueOutboxEmail } from "@/lib/services/email-outbox";

export const advancePendingTransferExpiry = async (params: {
  prisma: PrismaClient;
  now?: Date;
}): Promise<{ enteredReview: number; expired: number }> => {
  const now = params.now ?? new Date();
  const reviewGraceExpiresAt = addHours(now, 2);

  const reviewResult = await params.prisma.booking.updateMany({
    where: {
      status: "PENDING",
      paymentState: "PENDING_BANK_TRANSFER",
      transferExpiresAt: { lte: now },
    },
    data: {
      paymentState: "PENDING_BANK_TRANSFER_REVIEW",
      reviewGraceExpiresAt,
    },
  });

  const expiredCandidates = await params.prisma.booking.findMany({
    where: {
      status: "PENDING",
      paymentState: "PENDING_BANK_TRANSFER_REVIEW",
      reviewGraceExpiresAt: { lte: now },
    },
    select: { id: true, customerEmail: true },
  });

  let expired = 0;
  for (const booking of expiredCandidates) {
    // Transition and notice commit together; the outbox dispatcher delivers the notice afterwards.
    const result = await params.prisma.$transaction(async (tx) => {
      const transition = await tx.booking.updateMany({
        where: {
          id: booking.id,
          status: "PENDING",
          paymentState: "PENDING_BANK_TRANSFER_REVIEW",
          reviewGraceExpiresAt: { lte: now },
        },
        data: {
          status: "EXPIRED",
          paymentState: "EXPIRED",
          remainingBalanceCents: 0,
          emailDeliveryStatus: "RETRYING",
        },
      });

      if (transition.count === 1) {
        await enqueueOutboxEmail(tx, {
          bookingId: booking.id,
          customerEmail: booking.customerEmail,
          type: "EXPIRY_NOTICE",
        });
      }

      return transition;
    });
    expired += result.count;
  }

  if (expired > 0) {
    invalidateAvailabilityCache();
  }

  return { enteredReview: reviewResult.count, expired };
};
