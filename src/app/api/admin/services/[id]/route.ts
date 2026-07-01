import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import { serviceMediaMetadataSchema, updateAdminServiceRequestSchema } from "@/lib/schemas/api";

export const dynamic = "force-dynamic";

type RouteParams = {
  params: Promise<{ id: string }>;
};

const validatePricing = (params: { priceCents: number; downpaymentCents: number }): boolean => {
  return params.downpaymentCents <= params.priceCents;
};

type ExistingService = Awaited<ReturnType<typeof prisma.service.findUniqueOrThrow>>;
type ParsedUpdate = NonNullable<
  ReturnType<typeof updateAdminServiceRequestSchema.safeParse>["data"]
>;

/** Merge the request payload with the stored record and validate media invariants. */
const validateMergedMedia = (
  existing: ExistingService,
  incoming: ParsedUpdate,
): ReturnType<typeof serviceMediaMetadataSchema.safeParse> => {
  const merged = {
    heroMediaType:
      incoming.heroMediaType !== undefined ? incoming.heroMediaType : existing.heroMediaType,
    heroMediaUrl:
      incoming.heroMediaUrl !== undefined ? incoming.heroMediaUrl : existing.heroMediaUrl,
    heroMediaAltText:
      incoming.heroMediaAltText !== undefined
        ? incoming.heroMediaAltText
        : existing.heroMediaAltText,
    heroPosterUrl:
      incoming.heroPosterUrl !== undefined ? incoming.heroPosterUrl : existing.heroPosterUrl,
    cardMediaType:
      incoming.cardMediaType !== undefined ? incoming.cardMediaType : existing.cardMediaType,
    cardMediaUrl:
      incoming.cardMediaUrl !== undefined ? incoming.cardMediaUrl : existing.cardMediaUrl,
    cardMediaAltText:
      incoming.cardMediaAltText !== undefined
        ? incoming.cardMediaAltText
        : existing.cardMediaAltText,
    isDecorative:
      incoming.isDecorative !== undefined ? incoming.isDecorative : existing.isDecorative,
  };
  return serviceMediaMetadataSchema.safeParse(merged);
};

/** Build the Prisma update input from a validated request payload. */
const buildServiceUpdate = (data: ParsedUpdate): Prisma.ServiceUpdateInput => {
  const update: Prisma.ServiceUpdateInput = {};

  if (data.name !== undefined) update.name = data.name;
  if (data.description !== undefined) update.description = data.description;
  if (data.offeringType !== undefined) update.offeringType = data.offeringType;
  if (data.durationMin !== undefined) update.durationMin = data.durationMin;
  if (data.priceCents !== undefined) update.priceCents = data.priceCents;
  if (data.downpaymentCents !== undefined) update.downpaymentCents = data.downpaymentCents;
  if (data.heroMediaType !== undefined) update.heroMediaType = data.heroMediaType;
  if (data.heroMediaUrl !== undefined) update.heroMediaUrl = data.heroMediaUrl;
  if (data.heroMediaAltText !== undefined) update.heroMediaAltText = data.heroMediaAltText;
  if (data.heroPosterUrl !== undefined) update.heroPosterUrl = data.heroPosterUrl;
  if (data.cardMediaType !== undefined) update.cardMediaType = data.cardMediaType;
  if (data.cardMediaUrl !== undefined) update.cardMediaUrl = data.cardMediaUrl;
  if (data.cardMediaAltText !== undefined) update.cardMediaAltText = data.cardMediaAltText;
  if (data.isDecorative !== undefined) update.isDecorative = data.isDecorative;
  if (data.isActive !== undefined) update.isActive = data.isActive;

  if (data.durationPriceOptions !== undefined) {
    update.durationPriceOptions =
      data.durationPriceOptions === null
        ? Prisma.DbNull
        : (data.durationPriceOptions as Prisma.InputJsonValue);
  }

  return update;
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

  // Validate the post-merge media state so partial updates can't leave the
  // record in an inconsistent state (e.g. clearing heroPosterUrl on a VIDEO).
  const mergedMediaValidation = validateMergedMedia(existing, parsed.data);
  if (!mergedMediaValidation.success) {
    return NextResponse.json(
      { error: "Invalid media state", issues: z.flattenError(mergedMediaValidation.error) },
      { status: 400 },
    );
  }

  const service = await prisma.service.update({
    where: { id },
    data: buildServiceUpdate(parsed.data),
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
