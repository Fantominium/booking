import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  durationMin: z.number().int().positive().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  downpaymentCents: z.number().int().nonnegative().optional(),
  isActive: z.boolean().optional(),
});

const validatePricing = (params: { priceCents: number; downpaymentCents: number }): boolean => {
  return params.downpaymentCents <= params.priceCents;
};

export const PATCH = async (request: Request, { params }: RouteParams): Promise<NextResponse> => {
  const { id } = await params;
  const body = await request.json();
  const parsed = updateServiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.service.findUnique({
    where: { id },
  });

  if (!existing) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const nextPriceCents = parsed.data.priceCents ?? existing.priceCents;
  const nextDownpayment = parsed.data.downpaymentCents ?? existing.downpaymentCents;

  if (!validatePricing({ priceCents: nextPriceCents, downpaymentCents: nextDownpayment })) {
    return NextResponse.json({ error: "Downpayment cannot exceed price" }, { status: 400 });
  }

  const service = await prisma.service.update({
    where: { id },
    data: {
      name: parsed.data.name ?? existing.name,
      description:
        parsed.data.description === undefined ? existing.description : parsed.data.description,
      durationMin: parsed.data.durationMin ?? existing.durationMin,
      priceCents: nextPriceCents,
      downpaymentCents: nextDownpayment,
      isActive: parsed.data.isActive ?? existing.isActive,
    },
  });

  return NextResponse.json({ service });
};

export const DELETE = async (_request: Request, { params }: RouteParams): Promise<NextResponse> => {
  const { id } = await params;

  const upcomingBooking = await prisma.booking.findFirst({
    where: {
      serviceId: id,
      startTime: { gt: new Date() },
      status: { not: "CANCELLED" },
    },
  });

  if (upcomingBooking) {
    return NextResponse.json({ error: "Service has future bookings" }, { status: 409 });
  }

  await prisma.service.delete({
    where: { id },
  });

  return new NextResponse(null, { status: 204 });
};
