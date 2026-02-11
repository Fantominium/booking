import { emailQueue } from "@/lib/queue/config";
import { prisma } from "@/lib/prisma";

export type EmailJobPayload = {
  bookingId: string;
  customerEmail: string;
  type: "CONFIRMATION" | "REFUND_NOTIFICATION" | "PASSWORD_RESET" | "CANCELLATION";
};

export const queueEmailJob = async (payload: EmailJobPayload): Promise<void> => {
  await prisma.booking.update({
    where: { id: payload.bookingId },
    data: { emailDeliveryStatus: "RETRYING" },
  });

  await emailQueue.add(payload.type, payload, {
    attempts: 3,
    backoff: { type: "exponential", delay: 60_000 },
    removeOnComplete: true,
    removeOnFail: false,
  });
};
