import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const serviceInputSchema = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().max(5000).nullable().optional(),
    offeringType: z.enum(["SESSION", "EVENT", "RENTAL"]),
    durationMin: z.number().int().positive(),
    priceCents: z.number().int().nonnegative(),
    downpaymentCents: z.number().int().nonnegative(),
    isActive: z.boolean().optional(),
  })
  .refine((value) => value.downpaymentCents <= value.priceCents, {
    message: "Downpayment cannot exceed price",
    path: ["downpaymentCents"],
  });

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
      isActive: parsed.data.isActive ?? true,
    },
  });

  return NextResponse.json({ service }, { status: 201 });
};
