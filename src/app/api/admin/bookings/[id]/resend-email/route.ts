import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { queueEmailJob } from "@/lib/services/email";

export const POST = async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  const { id } = await context.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const emailType = booking.status === "CANCELLED" ? "CANCELLATION" : "CONFIRMATION";

  await queueEmailJob({
    bookingId: booking.id,
    customerEmail: booking.customerEmail,
    type: emailType,
  });

  return NextResponse.json({ ok: true });
};
