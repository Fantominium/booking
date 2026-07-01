import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import { updateAdminServiceRequestSchema } from "@/lib/schemas/api";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const validatePricing = (params: { priceCents: number; downpaymentCents: number }): boolean => {
  return params.downpaymentCents <= params.priceCents;
};

export const PATCH = async (request: Request, { params }: RouteParams): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const { id } = await params;
  const body = await request.json();
  const parsed = updateAdminServiceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: z.flattenError(parsed.error) },
      { status: 400 },
    );
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

  const data: Prisma.ServiceUpdateInput = {};

  if (parsed.data.name !== undefined) {
    data.name = parsed.data.name;
  }
  if (parsed.data.description !== undefined) {
    data.description = parsed.data.description;
  }
  if (parsed.data.offeringType !== undefined) {
    data.offeringType = parsed.data.offeringType;
  }
  if (parsed.data.durationMin !== undefined) {
    data.durationMin = parsed.data.durationMin;
  }
  if (parsed.data.priceCents !== undefined) {
    data.priceCents = parsed.data.priceCents;
  }
  if (parsed.data.downpaymentCents !== undefined) {
    data.downpaymentCents = parsed.data.downpaymentCents;
  }
  if (parsed.data.heroMediaType !== undefined) {
    data.heroMediaType = parsed.data.heroMediaType;
  }
  if (parsed.data.heroMediaUrl !== undefined) {
    data.heroMediaUrl = parsed.data.heroMediaUrl;
  }
  if (parsed.data.heroMediaAltText !== undefined) {
    data.heroMediaAltText = parsed.data.heroMediaAltText;
  }
  if (parsed.data.heroPosterUrl !== undefined) {
    data.heroPosterUrl = parsed.data.heroPosterUrl;
  }
  if (parsed.data.cardMediaType !== undefined) {
    data.cardMediaType = parsed.data.cardMediaType;
  }
  if (parsed.data.cardMediaUrl !== undefined) {
    data.cardMediaUrl = parsed.data.cardMediaUrl;
  }
  if (parsed.data.cardMediaAltText !== undefined) {
    data.cardMediaAltText = parsed.data.cardMediaAltText;
  }
  if (parsed.data.isDecorative !== undefined) {
    data.isDecorative = parsed.data.isDecorative;
  }
  if (parsed.data.isActive !== undefined) {
    data.isActive = parsed.data.isActive;
  }

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
