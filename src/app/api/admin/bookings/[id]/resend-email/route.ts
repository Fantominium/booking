import { NextResponse } from "next/server";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import { queueEmailJob } from "@/lib/services/email";

export const dynamic = "force-dynamic";

export const POST = async (
  _request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const { id } = await context.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const emailType = booking.status === "CANCELLED" ? "CANCELLATION" : "CONFIRMATION";

  // A fixed job ID would be ignored while the original job is retained; the minute bucket still absorbs double-clicks.
  await queueEmailJob({
    bookingId: booking.id,
    customerEmail: booking.customerEmail,
    type: emailType,
    dedupeKey: `${booking.id}:${emailType}:resend:${Math.floor(Date.now() / 60_000)}`,
  });

  return NextResponse.json({ ok: true });
};
