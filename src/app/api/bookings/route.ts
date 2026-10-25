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

  const service = await prisma.service.findUnique({
    where: { id: parsed.data.serviceId },
  });

  if (!service?.isActive) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const settings = await prisma.systemSettings.findFirst();

  if (!settings) {
    return NextResponse.json({ error: "System settings missing" }, { status: 500 });
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
    const requestFingerprint = createHmac("sha256", fingerprintSecret)
      .update(
        JSON.stringify({
          serviceId: service.id,
          startTime: startTime.toISOString(),
          requestedDurationMin: parsed.data.selectedDurationMin ?? null,
          resolvedDurationMin: selectedOption.durationMin,
          customerName: parsed.data.customerName,
          customerEmail: parsed.data.customerEmail,
          customerPhone: parsed.data.customerPhone,
          paymentMethod: "BANK_TRANSFER",
          priceCents: selectedOption.priceCents,
          downpaymentCents: selectedOption.downpaymentCents,
        }),
      )
      .digest("hex");

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

    return NextResponse.json({
      id: booking.id,
      status: "PENDING",
      paymentMethod: "BANK_TRANSFER",
      paymentState: "PENDING_BANK_TRANSFER",
      clientSecret: null,
      bankTransferReference: booking.bankTransferReference,
      bankTransferInstructions: settings.bankTransferInstructions,
    });
  } catch (error) {
    if (isAppError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Unable to create booking" }, { status: 500 });
  }
};
