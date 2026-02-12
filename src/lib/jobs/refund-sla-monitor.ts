import { subMinutes } from "date-fns";

import { prisma } from "@/lib/prisma";

export const checkRefundSla = async (): Promise<
  Array<{ bookingId: string; amountCents: number }>
> => {
  const threshold = subMinutes(new Date(), 5);

  const pendingRefunds = await prisma.paymentAuditLog.findMany({
    where: {
      action: "REFUND_ISSUED",
      timestamp: { lt: threshold },
    },
  });

  const alerts = pendingRefunds.map((entry) => ({
    bookingId: entry.bookingId,
    amountCents: entry.amountCents,
  }));

  alerts.forEach((alert) => {
    console.warn(`Refund SLA exceeded for booking ${alert.bookingId} amount ${alert.amountCents}`);
  });

  return alerts;
};
