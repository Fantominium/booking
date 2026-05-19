import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const durationPriceOptionSchema = z.object({
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
});

const updateServiceSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  description: z.string().max(5000).nullable().optional(),
  offeringType: z.enum(["SESSION", "EVENT", "RENTAL"]).optional(),
  durationMin: z.number().int().positive().optional(),
  priceCents: z.number().int().nonnegative().optional(),
  downpaymentCents: z.number().int().nonnegative().optional(),
  durationPriceOptions: z.array(durationPriceOptionSchema).max(10).optional().nullable(),
  isActive: z.boolean().optional(),
});

const validatePricing = (params: { priceCents: number; downpaymentCents: number }): boolean => {
  return params.downpaymentCents <= params.priceCents;
};

export const PATCH = async (request: Request, { params }: RouteParams): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateServiceSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (parsed.data.durationPriceOptions) {
    const uniqueDurations = new Set(
      parsed.data.durationPriceOptions.map((option) => option.durationMin),
    );

    if (uniqueDurations.size !== parsed.data.durationPriceOptions.length) {
      return NextResponse.json({ error: "Duration options must be unique" }, { status: 400 });
    }

    if (parsed.data.durationPriceOptions.length === 0) {
      return NextResponse.json(
        { error: "At least one duration option is required" },
        { status: 400 },
      );
    }
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

  const data: Prisma.ServiceUpdateInput = {
    ...(parsed.data.name !== undefined ? { name: parsed.data.name } : {}),
    ...(parsed.data.description !== undefined ? { description: parsed.data.description } : {}),
    ...(parsed.data.offeringType !== undefined ? { offeringType: parsed.data.offeringType } : {}),
    ...(parsed.data.durationMin !== undefined ? { durationMin: parsed.data.durationMin } : {}),
    ...(parsed.data.priceCents !== undefined ? { priceCents: parsed.data.priceCents } : {}),
    ...(parsed.data.downpaymentCents !== undefined
      ? { downpaymentCents: parsed.data.downpaymentCents }
      : {}),
    ...(parsed.data.isActive !== undefined ? { isActive: parsed.data.isActive } : {}),
  };

  if (parsed.data.durationPriceOptions !== undefined) {
    data.durationPriceOptions =
      parsed.data.durationPriceOptions === null
        ? Prisma.DbNull
        : (parsed.data.durationPriceOptions as Prisma.InputJsonValue);
  }

  const service = await prisma.service.update({
    where: { id },
    data,
  });

  return NextResponse.json({ service });
};

export const DELETE = async (_request: Request, { params }: RouteParams): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

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
