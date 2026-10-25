import { NextResponse } from "next/server";
import { createHmac } from "node:crypto";
import { z } from "zod";

import { createBookingRequestSchema } from "@/lib/schemas/api";
import { createBookingWithLock } from "@/lib/services/booking";
import { getBusinessDayBounds } from "@/lib/services/availability";
import { assertStartTimeWithinSchedule } from "@/lib/services/booking-eligibility";
import { prisma } from "@/lib/prisma";
import { isAppError } from "@/lib/errors";
import { resolveServiceDurationOption } from "@/lib/service-duration-options";
import { publicRateLimitResponse } from "@/lib/middleware/rate-limit";

export const dynamic = "force-dynamic";
const MINIMUM_LEAD_TIME_MINUTES = 120;
const BUSINESS_TIME_ZONE = "America/Barbados";

const buildBookingResponse = (
  id: string,
  bankTransferReference: string | null,
  bankTransferInstructions: string | null,
): Record<string, unknown> => ({
  id,
  status: "PENDING",
  paymentMethod: "BANK_TRANSFER",
  paymentState: "PENDING_BANK_TRANSFER",
  clientSecret: null,
  bankTransferReference,
  bankTransferInstructions,
});

export const POST = async (request: Request): Promise<NextResponse> => {
  const rateLimitResponse = await publicRateLimitResponse({
    request,
    namespace: "booking",
    maxRequests: 5,
    windowSeconds: 10 * 60,
  });
  if (rateLimitResponse) {
    return rateLimitResponse as NextResponse;
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = createBookingRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const startTime = new Date(parsed.data.startTime);
  const idempotencyKey = z.string().uuid().safeParse(request.headers.get("Idempotency-Key"));
  if (!idempotencyKey.success) {
    return NextResponse.json(
      { error: "A valid Idempotency-Key header is required" },
      { status: 400 },
    );
  }

  const fingerprintSecret = process.env.IDEMPOTENCY_HMAC_SECRET;
  if (!fingerprintSecret || fingerprintSecret.length < 32) {
    return NextResponse.json({ error: "Booking service is unavailable" }, { status: 503 });
  }

  // Fingerprint only the submitted request so replays survive later price/schedule changes.
  const requestFingerprint = createHmac("sha256", fingerprintSecret)
    .update(
      JSON.stringify({
        serviceId: parsed.data.serviceId,
        startTime: startTime.toISOString(),
        requestedDurationMin: parsed.data.selectedDurationMin ?? null,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone,
        paymentMethod: "BANK_TRANSFER",
      }),
    )
    .digest("hex");

  const settings = await prisma.systemSettings.findFirst();

  if (!settings) {
    return NextResponse.json({ error: "System settings missing" }, { status: 500 });
  }

  const existingIdempotency = await prisma.bookingIdempotency.findUnique({
    where: { idempotencyKey: idempotencyKey.data },
    include: { booking: true },
  });
  if (existingIdempotency && existingIdempotency.expiresAt > new Date()) {
    if (existingIdempotency.requestFingerprint !== requestFingerprint) {
      return NextResponse.json(
        { error: "Idempotency key was already used for a different request" },
        { status: 409 },
      );
    }
    return NextResponse.json(
      buildBookingResponse(
        existingIdempotency.booking.id,
        existingIdempotency.booking.bankTransferReference,
        settings.bankTransferInstructions,
      ),
    );
  }

  const service = await prisma.service.findUnique({
    where: { id: parsed.data.serviceId },
  });

  if (!service?.isActive) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  try {
    const selectedOption = resolveServiceDurationOption(service, parsed.data.selectedDurationMin);
    const businessDay = getBusinessDayBounds(startTime, BUSINESS_TIME_ZONE);
    const bufferMinutes = Math.max(settings.bufferMinutes, 60);
    await assertStartTimeWithinSchedule({
      prisma,
      startTime,
      serviceDurationMin: selectedOption.durationMin,
      bufferMinutes,
      timeZone: BUSINESS_TIME_ZONE,
    });
    const booking = await createBookingWithLock({
      prisma,
      input: {
        serviceId: service.id,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone,
        startTime,
        paymentMethod: parsed.data.paymentMethod,
        serviceDurationMin: selectedOption.durationMin,
        bufferMinutes,
        priceCents: selectedOption.priceCents,
        downpaymentCents: selectedOption.downpaymentCents,
        maxBookingsPerDay: settings.maxBookingsPerDay,
        dayStart: businessDay.start,
        dayEnd: businessDay.end,
        idempotencyKey: idempotencyKey.data,
        requestFingerprint,
        minimumLeadTimeMinutes: MINIMUM_LEAD_TIME_MINUTES,
      },
    });

    return NextResponse.json(
      buildBookingResponse(
        booking.id,
        booking.bankTransferReference,
        settings.bankTransferInstructions,
      ),
    );
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Unable to create booking" }, { status: 500 });
  }
};
