import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const durationPriceOptionSchema = z.object({
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
});

const serviceInputSchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().max(5000).nullable().optional(),
    offeringType: z.enum(["SESSION", "EVENT", "RENTAL"]),
    durationMin: z.number().int().positive(),
    priceCents: z.number().int().nonnegative(),
    downpaymentCents: z.number().int().nonnegative(),
    durationPriceOptions: z.array(durationPriceOptionSchema).max(10).optional().nullable(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.downpaymentCents <= value.priceCents, {
    message: "Downpayment cannot exceed price",
    path: ["downpaymentCents"],
  })
  .refine(
    (value) => {
      const options = value.durationPriceOptions ?? [];
      return new Set(options.map((option) => option.durationMin)).size === options.length;
    },
    {
      message: "Duration options must be unique",
      path: ["durationPriceOptions"],
    },
  )
  .refine(
    (value) => {
      const options = value.durationPriceOptions ?? [];
      return options.length > 0;
    },
    {
      message: "At least one duration option is required",
      path: ["durationPriceOptions"],
    },
  );

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
  const parsed = serviceInputSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const service = await prisma.service.create({
    data: {
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      offeringType: parsed.data.offeringType,
      durationMin: parsed.data.durationMin,
      priceCents: parsed.data.priceCents,
      downpaymentCents: parsed.data.downpaymentCents,
      durationPriceOptions: parsed.data.durationPriceOptions,
      isActive: parsed.data.isActive ?? true,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
};
