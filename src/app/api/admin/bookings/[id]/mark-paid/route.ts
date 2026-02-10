import { NextResponse } from "next/server";

import { markBookingAsPaid } from "@/lib/services/booking";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

export const POST = async (_request: Request, { params }: RouteParams): Promise<NextResponse> => {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { service: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  await markBookingAsPaid({ prisma, bookingId: booking.id });

  return NextResponse.json({
    booking: {
      id: booking.id,
      serviceId: booking.serviceId,
      serviceName: booking.service.name,
      customerName: booking.customerName,
      customerEmail: booking.customerEmail,
      customerPhone: booking.customerPhone,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      status: "COMPLETED",
      downpaymentPaidCents: booking.downpaymentPaidCents,
      remainingBalanceCents: 0,
    },
  });
};
