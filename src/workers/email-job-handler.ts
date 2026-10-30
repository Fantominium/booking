import type { Job } from "bullmq";
import type { CreateEmailOptions } from "resend";

import { resend } from "@/lib/email/config";
import { BookingCancellationEmail } from "@/lib/email/templates/booking-cancellation";
import { BookingConfirmationEmail } from "@/lib/email/templates/booking-confirmation";
import { BookingExpiryEmail } from "@/lib/email/templates/booking-expiry";
import { RefundNotificationEmail } from "@/lib/email/templates/refund-notification";
import { env } from "@/lib/config/env";
import { prisma } from "@/lib/prisma";
import { createIcsEvent } from "@/lib/services/ics";
import { getBookedServiceDurationMinutes } from "@/lib/services/booking-duration";
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

export const processEmailJob = async (job: Job<EmailJobPayload>): Promise<void> => {
  const booking = await prisma.booking.findUnique({
    where: { id: job.data.bookingId },
    include: { service: true },
  });

  const settings = await prisma.systemSettings.findFirst();

  if (!booking) {
    throw new Error("Booking not found");
  }

  await updateEmailStatus(booking.id, "RETRYING");

  // Resend dedupes on this key for 24h, so a retry after a lost status update cannot double-send.
  const idempotencyKey = `email/${job.id ?? `${booking.id}:${job.data.type}`}`;
  const sendEmail = async (message: CreateEmailOptions): Promise<void> => {
    const result = await resend.emails.send(message, { idempotencyKey });
    if (result?.error) {
      throw new Error(`Email provider rejected message: ${result.error.name}`);
    }
  };

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
        durationMinutes: getBookedServiceDurationMinutes({
          startTime: booking.startTime,
          endTime: booking.endTime,
          bufferMinutes: settings?.bufferMinutes ?? 0,
        }),
        location: "TruFlow Studio",
      });

      await sendEmail({
        from: `TruFlow <${env.EMAIL_FROM_ADDRESS}>`,
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
      await sendEmail({
        from: `TruFlow <${env.EMAIL_FROM_ADDRESS}>`,
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

    if (job.data.type === "EXPIRY_NOTICE") {
      await sendEmail({
        from: `TruFlow <${env.EMAIL_FROM_ADDRESS}>`,
        to: job.data.customerEmail,
        subject: "Your bank-transfer reservation expired",
        react: BookingExpiryEmail({
          customerName: booking.customerName,
          serviceName: booking.service.name,
          startTime: booking.startTime.toISOString(),
        }),
      });
    }

    if (job.data.type === "REFUND_NOTIFICATION") {
      await sendEmail({
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
