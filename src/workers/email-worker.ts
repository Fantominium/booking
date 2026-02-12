import { type Job, Worker } from "bullmq";

import { EMAIL_QUEUE_NAME, redisConnection } from "@/lib/queue/config";
import { resend } from "@/lib/email/config";
import { BookingCancellationEmail } from "@/lib/email/templates/booking-cancellation";
import { BookingConfirmationEmail } from "@/lib/email/templates/booking-confirmation";
import { RefundNotificationEmail } from "@/lib/email/templates/refund-notification";
import { prisma } from "@/lib/prisma";
import { createIcsEvent } from "@/lib/services/ics";
import type { EmailJobPayload } from "@/lib/services/email";

const updateEmailStatus = async (
  bookingId: string,
  status: "SUCCESS" | "FAILED" | "RETRYING",
): Promise<void> => {
  await prisma.booking.update({
    where: { id: bookingId },
    data: { emailDeliveryStatus: status },
  });
};

const handler = async (job: Job<EmailJobPayload>): Promise<void> => {
  const booking = await prisma.booking.findUnique({
    where: { id: job.data.bookingId },
    include: { service: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  await updateEmailStatus(booking.id, "RETRYING");

  try {
    if (job.data.type === "CONFIRMATION") {
      const icsContent = createIcsEvent({
        title: `${booking.service.name} - TruFlow`,
        description: `Booking confirmed for ${booking.customerName}`,
        start: [
          booking.startTime.getUTCFullYear(),
          booking.startTime.getUTCMonth() + 1,
          booking.startTime.getUTCDate(),
          booking.startTime.getUTCHours(),
          booking.startTime.getUTCMinutes(),
        ],
        durationMinutes: booking.service.durationMin,
        location: "TruFlow Studio",
      });

      await resend.emails.send({
        from: "TruFlow <bookings@truflow.local>",
        to: job.data.customerEmail,
        subject: "Your booking is confirmed",
        react: BookingConfirmationEmail({
          customerName: booking.customerName,
          serviceName: booking.service.name,
          startTime: booking.startTime.toISOString(),
          location: "TruFlow Studio",
        }),
        attachments: [
          {
            filename: "booking.ics",
            content: icsContent,
          },
        ],
      });
    }

    if (job.data.type === "CANCELLATION") {
      await resend.emails.send({
        from: "TruFlow <bookings@truflow.local>",
        to: job.data.customerEmail,
        subject: "Your booking was cancelled",
        react: BookingCancellationEmail({
          customerName: booking.customerName,
          serviceName: booking.service.name,
          startTime: booking.startTime.toISOString(),
          location: "TruFlow Studio",
        }),
      });
    }

    if (job.data.type === "REFUND_NOTIFICATION") {
      await resend.emails.send({
        from: "TruFlow <bookings@truflow.local>",
        to: job.data.customerEmail,
        subject: "Your refund is being processed",
        react: RefundNotificationEmail({
          customerName: booking.customerName,
          serviceName: booking.service.name,
          bookingId: booking.id,
        }),
      });
    }

    await updateEmailStatus(booking.id, "SUCCESS");

    const deliveryTimeMs = Date.now() - booking.createdAt.getTime();
    console.info(`Email delivery completed in ${deliveryTimeMs}ms for booking ${booking.id}`);
  } catch (error) {
    const attempts = job.opts.attempts ?? 1;
    const willRetry = job.attemptsMade + 1 < attempts;
    await updateEmailStatus(booking.id, willRetry ? "RETRYING" : "FAILED");
    throw error;
  }
};

export const emailWorker = new Worker(EMAIL_QUEUE_NAME, handler, {
  connection: redisConnection,
  concurrency: 10,
});
