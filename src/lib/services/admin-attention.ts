import { subDays } from "date-fns";
import type { PrismaClient } from "@prisma/client";

export type AdminAttentionBooking = {
  id: string;
  customerName: string;
  startTime: string;
  serviceName: string;
  reviewGraceExpiresAt: string | null;
};

export type AdminAttentionItems = {
  emailFailures: AdminAttentionBooking[];
  transferReviews: AdminAttentionBooking[];
  expiredTransfers: AdminAttentionBooking[];
};

const MAX_ITEMS = 50;

// Admin-facing signal for bookings that need a human: failed emails, holds in review grace, and recent expiries.
export const getAdminAttentionItems = async (
  prisma: PrismaClient,
  now: Date = new Date(),
): Promise<AdminAttentionItems> => {
  const select = {
    id: true,
    customerName: true,
    startTime: true,
    reviewGraceExpiresAt: true,
    service: { select: { name: true } },
  } as const;

  const [emailFailures, transferReviews, expiredTransfers] = await Promise.all([
    prisma.booking.findMany({
      where: { emailDeliveryStatus: "FAILED" },
      select,
      orderBy: { updatedAt: "desc" },
      take: MAX_ITEMS,
    }),
    prisma.booking.findMany({
      where: { status: "PENDING", paymentState: "PENDING_BANK_TRANSFER_REVIEW" },
      select,
      orderBy: { reviewGraceExpiresAt: "asc" },
      take: MAX_ITEMS,
    }),
    prisma.booking.findMany({
      where: { status: "EXPIRED", updatedAt: { gte: subDays(now, 7) } },
      select,
      orderBy: { updatedAt: "desc" },
      take: MAX_ITEMS,
    }),
  ]);

  const toItem = (booking: (typeof emailFailures)[number]): AdminAttentionBooking => ({
    id: booking.id,
    customerName: booking.customerName,
    startTime: booking.startTime.toISOString(),
    serviceName: booking.service.name,
    reviewGraceExpiresAt: booking.reviewGraceExpiresAt?.toISOString() ?? null,
  });

  return {
    emailFailures: emailFailures.map(toItem),
    transferReviews: transferReviews.map(toItem),
    expiredTransfers: expiredTransfers.map(toItem),
  };
};
