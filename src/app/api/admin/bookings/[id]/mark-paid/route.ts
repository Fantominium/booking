import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { markBookingAsPaid } from "@/lib/services/booking";
import { prisma } from "@/lib/prisma";
import { isAppError } from "@/lib/errors";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const reconciliationSchema = z.object({
  verifiedAmountCents: z.number().int().positive(),
  transferReference: z.string().trim().min(1).max(100),
});

export const POST = async (request: Request, { params }: RouteParams): Promise<NextResponse> => {
  const session = await getAdminSession();
  const verifiedByAdminId = session?.user?.id;
  if (!session || !verifiedByAdminId) {
    return createAdminUnauthorizedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
  const parsed = reconciliationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Verified amount and transfer reference are required" },
      { status: 400 },
    );
  }

  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { service: true },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  let reconciliation;
  try {
    reconciliation = await markBookingAsPaid({
      prisma,
      bookingId: booking.id,
      verifiedAmountCents: parsed.data.verifiedAmountCents,
      transferReference: parsed.data.transferReference,
      verifiedByAdminId,
    });
  } catch (error) {
    if (error instanceof Error && error.message === "Booking not found") {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });
    }
    if (isAppError(error)) {
      return NextResponse.json({ error: error.message }, { status: error.statusCode });
    }
    return NextResponse.json({ error: "Unable to reconcile bank transfer" }, { status: 500 });
  }

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
      status: reconciliation.status,
      paymentState: reconciliation.paymentState,
      emailDeliveryStatus: booking.emailDeliveryStatus,
      downpaymentPaidCents: reconciliation.downpaymentPaidCents,
      remainingBalanceCents: reconciliation.remainingBalanceCents,
    },
  });
};
