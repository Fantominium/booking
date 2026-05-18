import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { getBookedServiceDurationMinutes } from "@/lib/services/booking-duration";
import { createIcsEvent } from "@/lib/services/ics";

export const dynamic = "force-dynamic";

export const GET = async (
  _request: Request,
  context: { params: Promise<{ bookingId: string }> },
): Promise<NextResponse> => {
  const { bookingId } = await context.params;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true },
  });

  const settings = await prisma.systemSettings.findFirst();

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

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

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename=booking-${booking.id}.ics`,
    },
  });
};
