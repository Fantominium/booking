import { addMinutes } from "date-fns";
import type { Prisma, PrismaClient } from "@prisma/client";

import { invalidateAvailabilityCache } from "@/lib/cache/availability";
import { createBookingConflictError } from "@/lib/errors";
import { logPaymentAudit } from "@/lib/services/audit";
import { queueEmailJob } from "@/lib/services/email";

export type CreateBookingInput = {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: Date;
  serviceDurationMin: number;
  bufferMinutes: number;
  priceCents: number;
  downpaymentCents: number;
};

const lockExistingBooking = async (
  tx: Prisma.TransactionClient,
  params: {
    serviceId: string;
    startTime: Date;
  },
): Promise<boolean> => {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "bookings"
    WHERE "service_id" = ${params.serviceId}
      AND "start_time" = ${params.startTime}
      AND "status" != 'CANCELLED'
    FOR UPDATE
  `;

  return rows.length > 0;
};

export const createBookingWithLock = async (params: {
  prisma: PrismaClient;
  input: CreateBookingInput;
}): Promise<{
  id: string;
  endTime: Date;
}> => {
  const { prisma, input } = params;

  const endTime = addMinutes(input.startTime, input.serviceDurationMin + input.bufferMinutes);

  const booking = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const hasConflict = await lockExistingBooking(tx, {
      serviceId: input.serviceId,
      startTime: input.startTime,
    });

    if (hasConflict) {
      throw createBookingConflictError("Slot already booked");
    }

    return tx.booking.create({
      data: {
        serviceId: input.serviceId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        startTime: input.startTime,
        endTime,
        remainingBalanceCents: Math.max(input.priceCents - input.downpaymentCents, 0),
        downpaymentPaidCents: 0,
      },
    });
  });

  return { id: booking.id, endTime: booking.endTime };
};

export const confirmBookingStatus = async (params: {
  prisma: PrismaClient;
  bookingId: string;
}): Promise<void> => {
  const { prisma, bookingId } = params;

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
    include: { service: true },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: { downpaymentPaidCents: booking.service.downpaymentCents },
  });

  await queueEmailJob({
    bookingId: booking.id,
    customerEmail: booking.customerEmail,
    type: "CONFIRMATION",
  });
};

export const attachPaymentIntent = async (params: {
  prisma: PrismaClient;
  bookingId: string;
  paymentIntentId: string;
}): Promise<void> => {
  const { prisma, bookingId, paymentIntentId } = params;

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      stripePaymentIntentId: paymentIntentId,
    },
  });
};

export const markBookingAsPaid = async (params: {
  prisma: PrismaClient;
  bookingId: string;
}): Promise<void> => {
  const { prisma, bookingId } = params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "COMPLETED",
      remainingBalanceCents: 0,
    },
  });

  await logPaymentAudit({
    bookingId: booking.id,
    action: "PAYMENT_CONFIRMED",
    amountCents: booking.remainingBalanceCents,
    outcome: "SUCCESS",
    stripePaymentIntentId: booking.stripePaymentIntentId ?? null,
  });
};

export const cancelBooking = async (params: {
  prisma: PrismaClient;
  bookingId: string;
}): Promise<void> => {
  const { prisma, bookingId } = params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "CANCELLED",
      remainingBalanceCents: 0,
    },
  });

  await queueEmailJob({
    bookingId: booking.id,
    customerEmail: booking.customerEmail,
    type: "CANCELLATION",
  });

  invalidateAvailabilityCache();
};
