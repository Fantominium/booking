import { NextResponse } from "next/server";

import { createBookingRequestSchema } from "@/lib/schemas/api";
import { createBookingWithLock, attachPaymentIntent } from "@/lib/services/booking";
import { createPaymentIntent } from "@/lib/services/payment";
import { prisma } from "@/lib/prisma";
import { isAppError } from "@/lib/errors";
import { resolveServiceDurationOption } from "@/lib/service-duration-options";

export const dynamic = "force-dynamic";

export const POST = async (request: Request): Promise<NextResponse> => {
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

  const service = await prisma.service.findUnique({
    where: { id: parsed.data.serviceId },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const settings = await prisma.systemSettings.findFirst();

  if (!settings) {
    return NextResponse.json({ error: "System settings missing" }, { status: 500 });
  }

  try {
    const selectedOption = resolveServiceDurationOption(service, parsed.data.selectedDurationMin);

    const booking = await createBookingWithLock({
      prisma,
      input: {
        serviceId: service.id,
        customerName: parsed.data.customerName,
        customerEmail: parsed.data.customerEmail,
        customerPhone: parsed.data.customerPhone,
        startTime: new Date(parsed.data.startTime),
        paymentMethod: parsed.data.paymentMethod,
        serviceDurationMin: selectedOption.durationMin,
        bufferMinutes: settings.bufferMinutes,
        priceCents: selectedOption.priceCents,
        downpaymentCents: selectedOption.downpaymentCents,
      },
    });

    if (parsed.data.paymentMethod === "BANK_TRANSFER") {
      return NextResponse.json({
        id: booking.id,
        status: "PENDING",
        paymentMethod: "BANK_TRANSFER",
        paymentState: "PENDING_BANK_TRANSFER",
        clientSecret: null,
        bankTransferReference: booking.bankTransferReference,
        bankTransferInstructions: settings.bankTransferInstructions,
      });
    }

    const intent = await createPaymentIntent({
      bookingId: booking.id,
      amountCents: selectedOption.downpaymentCents,
      currency: "usd",
    });

    await attachPaymentIntent({
      prisma,
      bookingId: booking.id,
      paymentIntentId: intent.id,
    });

    return NextResponse.json({
      id: booking.id,
      status: "PENDING",
      paymentMethod: "CARD",
      paymentState: "UNPAID",
      paymentIntentId: intent.id,
      clientSecret: intent.clientSecret,
      bankTransferReference: null,
      bankTransferInstructions: null,
    });
  } catch (error) {
    if (isAppError(error) && error.code === "BOOKING_CONFLICT") {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }

    console.error("Booking creation error:", error);
    return NextResponse.json({ error: "Unable to create booking" }, { status: 500 });
  }
};
