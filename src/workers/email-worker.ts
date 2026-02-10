import { Worker } from "bullmq";

import { EMAIL_QUEUE_NAME, redisConnection } from "@/lib/queue/config";
import { resend } from "@/lib/email/config";
import { BookingCancellationEmail } from "@/lib/email/templates/booking-cancellation";
import { BookingConfirmationEmail } from "@/lib/email/templates/booking-confirmation";
import { prisma } from "@/lib/prisma";
import { createIcsEvent } from "@/lib/services/ics";

const handler = async (job: {
  data: { bookingId: string; customerEmail: string; type: string };
}): Promise<void> => {
  const booking = await prisma.booking.findUnique({
    where: { id: job.data.bookingId },
    include: { service: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

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
};

export const emailWorker = new Worker(EMAIL_QUEUE_NAME, handler, {
  connection: redisConnection,
  concurrency: 10,
});
