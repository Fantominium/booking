import { addHours, addMinutes } from "date-fns";
import { randomBytes } from "node:crypto";
import type { Prisma, PrismaClient } from "@prisma/client";

import { invalidateAvailabilityCache } from "@/lib/cache/availability";
import { createBookingConflictError, createValidationError } from "@/lib/errors";
import { queueEmailJob } from "@/lib/services/email";
import { dispatchEmailOutbox, enqueueOutboxEmail } from "@/lib/services/email-outbox";
import { getBookedServiceDurationMinutes } from "@/lib/services/booking-duration";
import { resolveServiceDurationOption } from "@/lib/service-duration-options";

export type CreateBookingInput = {
  serviceId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  startTime: Date;
  paymentMethod: "CARD" | "BANK_TRANSFER";
  serviceDurationMin: number;
  bufferMinutes: number;
  priceCents: number;
  downpaymentCents: number;
  maxBookingsPerDay: number;
  dayStart: Date;
  dayEnd: Date;
  idempotencyKey: string;
  requestFingerprint: string;
  minimumLeadTimeMinutes: number;
};

// Prompt delivery after commit; failures are retried by the scheduled outbox dispatcher.
const dispatchEmailOutboxBestEffort = async (prisma: PrismaClient): Promise<void> => {
  try {
    await dispatchEmailOutbox({ prisma });
  } catch {
    // Rows stay undispatched and are picked up by the scheduled dispatcher.
  }
};

const lockExistingBooking = async (
  tx: Prisma.TransactionClient,
  params: {
    startTime: Date;
    endTime: Date;
  },
): Promise<boolean> => {
  const rows = await tx.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "bookings"
    WHERE "start_time" < ${params.endTime}
      AND "end_time" > ${params.startTime}
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
  bankTransferReference: string | null;
  replayed: boolean;
}> => {
  const { prisma, input } = params;

  const endTime = addMinutes(input.startTime, input.serviceDurationMin + input.bufferMinutes);
  const bankTransferReference =
    input.paymentMethod === "BANK_TRANSFER"
      ? `TF-${input.startTime.getUTCFullYear()}-${randomBytes(6).toString("hex").toUpperCase()}`
      : null;

  const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    // Prisma cannot deserialize pg_advisory_xact_lock's void result, so select a constant instead.
    await tx.$queryRaw`
      SELECT 1 AS locked FROM (
        SELECT pg_advisory_xact_lock(hashtext('booking-resource:shared-provider')::bigint)
      ) AS resource_lock
    `;

    await tx.bookingIdempotency.deleteMany({
      where: { expiresAt: { lte: new Date() } },
    });

    const existingIdempotency = await tx.bookingIdempotency.findUnique({
      where: { idempotencyKey: input.idempotencyKey },
      include: { booking: true },
    });

    if (existingIdempotency) {
      if (existingIdempotency.requestFingerprint !== input.requestFingerprint) {
        throw createBookingConflictError(
          "Idempotency key was already used for a different request",
        );
      }

      return { booking: existingIdempotency.booking, replayed: true };
    }

    if (input.startTime.getTime() < Date.now() + input.minimumLeadTimeMinutes * 60 * 1000) {
      throw createValidationError("Bookings must be made at least two hours in advance");
    }

    const hasConflict = await lockExistingBooking(tx, {
      startTime: input.startTime,
      endTime,
    });

    if (hasConflict) {
      throw createBookingConflictError("Slot already booked");
    }

    const dailyBookingCounts = await tx.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM "bookings"
      WHERE "start_time" >= ${input.dayStart}
        AND "start_time" < ${input.dayEnd}
        AND "status" NOT IN ('CANCELLED', 'EXPIRED')
    `;

    if ((dailyBookingCounts[0]?.count ?? 0) >= input.maxBookingsPerDay) {
      throw createBookingConflictError("Daily booking capacity reached");
    }

    const booking = await tx.booking.create({
      data: {
        serviceId: input.serviceId,
        customerName: input.customerName,
        customerEmail: input.customerEmail,
        customerPhone: input.customerPhone,
        startTime: input.startTime,
        endTime,
        paymentMethod: input.paymentMethod,
        paymentState: input.paymentMethod === "BANK_TRANSFER" ? "PENDING_BANK_TRANSFER" : "UNPAID",
        bankTransferReference,
        transferExpiresAt:
          input.paymentMethod === "BANK_TRANSFER" ? addHours(new Date(), 24) : null,
        reviewGraceExpiresAt: null,
        remainingBalanceCents: Math.max(input.priceCents - input.downpaymentCents, 0),
        downpaymentPaidCents: 0,
      },
    });

    await tx.bookingIdempotency.create({
      data: {
        idempotencyKey: input.idempotencyKey,
        requestFingerprint: input.requestFingerprint,
        bookingId: booking.id,
        expiresAt: addMinutes(new Date(), 7 * 24 * 60),
      },
    });

    return { booking, replayed: false };
  });

  if (!result.replayed) {
    invalidateAvailabilityCache();
  }

  return {
    id: result.booking.id,
    endTime: result.booking.endTime,
    bankTransferReference: result.booking.bankTransferReference ?? bankTransferReference,
    replayed: result.replayed,
  };
};

export const confirmBookingStatus = async (params: {
  prisma: PrismaClient;
  bookingId: string;
  downpaymentPaidCents?: number;
}): Promise<void> => {
  const { prisma, bookingId, downpaymentPaidCents } = params;

  const booking = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CONFIRMED" },
    include: { service: true },
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      downpaymentPaidCents: Math.max(downpaymentPaidCents ?? booking.downpaymentPaidCents, 0),
      paymentState: "DEPOSIT_PAID",
    },
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
  verifiedAmountCents: number;
  transferReference: string;
  verifiedByAdminId: string;
}): Promise<{
  status: "PENDING" | "CONFIRMED";
  paymentState:
    | "PENDING_BANK_TRANSFER"
    | "PENDING_BANK_TRANSFER_REVIEW"
    | "DEPOSIT_PAID"
    | "PAID_IN_FULL";
  downpaymentPaidCents: number;
  remainingBalanceCents: number;
}> => {
  const { prisma, bookingId, verifiedAmountCents, transferReference, verifiedByAdminId } = params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  if (!booking) {
    throw new Error("Booking not found");
  }

  if (booking.paymentMethod !== "BANK_TRANSFER" || verifiedAmountCents <= 0) {
    throw createValidationError("A positive bank-transfer amount is required");
  }
  if (
    booking.status !== "PENDING" ||
    (booking.paymentState !== "PENDING_BANK_TRANSFER" &&
      booking.paymentState !== "PENDING_BANK_TRANSFER_REVIEW")
  ) {
    throw createBookingConflictError("Booking is no longer pending bank-transfer reconciliation");
  }

  const settings = await prisma.systemSettings.findFirst();
  const bufferMinutes = Math.max(settings?.bufferMinutes ?? 60, 60);
  const serviceDurationMin = getBookedServiceDurationMinutes({
    startTime: booking.startTime,
    endTime: booking.endTime,
    bufferMinutes,
  });
  const pricing = resolveServiceDurationOption(booking.service, serviceDurationMin);
  const totalReceivedCents = booking.downpaymentPaidCents + verifiedAmountCents;

  if (totalReceivedCents > pricing.priceCents) {
    throw createValidationError("Verified transfer exceeds the outstanding booking amount");
  }

  const isConfirmed = totalReceivedCents >= pricing.downpaymentCents;
  const paymentState =
    totalReceivedCents >= pricing.priceCents
      ? "PAID_IN_FULL"
      : isConfirmed
        ? "DEPOSIT_PAID"
        : booking.paymentState;
  const nextStatus = isConfirmed ? "CONFIRMED" : "PENDING";
  const remainingBalanceCents = Math.max(pricing.priceCents - totalReceivedCents, 0);

  await prisma.$transaction(async (tx) => {
    const duplicateReference = await tx.paymentAuditLog.findUnique({
      where: { externalTransferReference: transferReference },
    });
    if (duplicateReference) {
      throw createBookingConflictError("Transfer reference has already been reconciled");
    }

    const transition = await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: "PENDING",
        paymentMethod: "BANK_TRANSFER",
        paymentState: { in: ["PENDING_BANK_TRANSFER", "PENDING_BANK_TRANSFER_REVIEW"] },
        downpaymentPaidCents: booking.downpaymentPaidCents,
      },
      data: {
        status: nextStatus,
        paymentState,
        downpaymentPaidCents: totalReceivedCents,
        remainingBalanceCents,
      },
    });

    if (transition.count !== 1) {
      throw createBookingConflictError("Booking is no longer pending bank-transfer reconciliation");
    }

    await tx.paymentAuditLog.create({
      data: {
        bookingId,
        action: "PAYMENT_RECEIVED",
        amountCents: verifiedAmountCents,
        externalTransferReference: transferReference,
        verifiedByAdminId,
        outcome: isConfirmed ? "SUCCESS" : "PENDING",
      },
    });

    if (isConfirmed) {
      await enqueueOutboxEmail(tx, {
        bookingId,
        customerEmail: booking.customerEmail,
        type: "CONFIRMATION",
      });
    }
  });

  if (isConfirmed) {
    await dispatchEmailOutboxBestEffort(prisma);
  }

  return {
    status: nextStatus,
    paymentState,
    downpaymentPaidCents: totalReceivedCents,
    remainingBalanceCents,
  };
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

  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    throw createBookingConflictError("Booking cannot be cancelled from its current state");
  }

  const transitioned = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
    const transition = await tx.booking.updateMany({
      where: {
        id: bookingId,
        status: booking.status,
        paymentState: booking.paymentState,
      },
      data: {
        status: "CANCELLED",
        remainingBalanceCents: 0,
      },
    });

    if (transition.count === 1) {
      await enqueueOutboxEmail(tx, {
        bookingId: booking.id,
        customerEmail: booking.customerEmail,
        type: "CANCELLATION",
      });
    }

    return transition.count === 1;
  });

  if (!transitioned) {
    throw createBookingConflictError("Booking cannot be cancelled from its current state");
  }

  invalidateAvailabilityCache();
  await dispatchEmailOutboxBestEffort(prisma);
};
