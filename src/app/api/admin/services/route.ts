import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";
import { createAdminServiceRequestSchema } from "@/lib/schemas/api";

export const dynamic = "force-dynamic";

export const GET = async (): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const services = await prisma.service.findMany({
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ services });
};

export const POST = async (request: Request): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const body = await request.json();
  const parsed = createAdminServiceRequestSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: z.flattenError(parsed.error) },
      { status: 400 },
    );
  }

  const data: Prisma.ServiceCreateInput = {
    name: parsed.data.name,
    description: parsed.data.description ?? null,
    offeringType: parsed.data.offeringType,
    durationMin: parsed.data.durationMin,
    priceCents: parsed.data.priceCents,
    downpaymentCents: parsed.data.downpaymentCents,
    heroMediaType: parsed.data.heroMediaType ?? null,
    heroMediaUrl: parsed.data.heroMediaUrl ?? null,
    heroMediaAltText: parsed.data.heroMediaAltText ?? null,
    heroPosterUrl: parsed.data.heroPosterUrl ?? null,
    cardMediaType: parsed.data.cardMediaType ?? null,
    cardMediaUrl: parsed.data.cardMediaUrl ?? null,
    cardMediaAltText: parsed.data.cardMediaAltText ?? null,
    isDecorative: parsed.data.isDecorative ?? null,
    isActive: parsed.data.isActive ?? true,
  };

  if (parsed.data.durationPriceOptions !== undefined) {
    data.durationPriceOptions =
      parsed.data.durationPriceOptions === null
        ? Prisma.DbNull
        : (parsed.data.durationPriceOptions as Prisma.InputJsonValue);
  }

  const service = await prisma.service.create({
    data,
  });

  return NextResponse.json({ service }, { status: 201 });
};
