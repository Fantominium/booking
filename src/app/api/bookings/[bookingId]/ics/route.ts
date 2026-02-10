import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createIcsEvent } from "@/lib/services/ics";

export const GET = async (
  _request: Request,
  context: { params: { bookingId: string } },
): Promise<NextResponse> => {
  const booking = await prisma.booking.findUnique({
    where: { id: context.params.bookingId },
    include: { service: true },
  });

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
    durationMinutes: booking.service.durationMin,
    location: "TruFlow Studio",
  });

  return new NextResponse(icsContent, {
    headers: {
      "Content-Type": "text/calendar",
      "Content-Disposition": `attachment; filename=booking-${booking.id}.ics`,
    },
  });
};
