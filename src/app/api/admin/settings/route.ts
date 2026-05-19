import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { invalidateAvailabilityCache } from "@/lib/cache/availability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const updateSettingsSchema = z
  .object({
    maxBookingsPerDay: z.number().int().min(1).optional(),
    bufferMinutes: z.number().int().min(0).optional(),
    bankTransferInstructions: z.string().min(1).max(2000).nullable().optional(),
  })
  .refine(
    (value) =>
      value.maxBookingsPerDay !== undefined ||
      value.bufferMinutes !== undefined ||
      value.bankTransferInstructions !== undefined,
    {
      message: "No settings provided",
    },
  );

const mapSettings = (settings: {
  id: string;
  maxBookingsPerDay: number;
  bufferMinutes: number;
  bankTransferInstructions: string | null;
  updatedAt: Date;
}): Record<string, unknown> => ({
  id: settings.id,
  maxBookingsPerDay: settings.maxBookingsPerDay,
  bufferMinutes: settings.bufferMinutes,
  bankTransferInstructions: settings.bankTransferInstructions,
  updatedAt: settings.updatedAt.toISOString(),
});

export const GET = async (): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const settings = await prisma.systemSettings.findFirst();

  if (!settings) {
    return NextResponse.json({ error: "System settings missing" }, { status: 500 });
  }

  return NextResponse.json(mapSettings(settings));
};

export const PATCH = async (request: Request): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const body = await request.json();
  const parsed = updateSettingsSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const existing = await prisma.systemSettings.findFirst();

  const settings = existing
    ? await prisma.systemSettings.update({
        where: { id: existing.id },
        data: {
          maxBookingsPerDay: parsed.data.maxBookingsPerDay ?? existing.maxBookingsPerDay,
          bufferMinutes: parsed.data.bufferMinutes ?? existing.bufferMinutes,
          bankTransferInstructions:
            parsed.data.bankTransferInstructions === undefined
              ? existing.bankTransferInstructions
              : parsed.data.bankTransferInstructions,
        },
      })
    : await prisma.systemSettings.create({
        data: {
          maxBookingsPerDay: parsed.data.maxBookingsPerDay ?? 8,
          bufferMinutes: parsed.data.bufferMinutes ?? 15,
          bankTransferInstructions: parsed.data.bankTransferInstructions ?? null,
        },
      });

  invalidateAvailabilityCache();

  return NextResponse.json(mapSettings(settings));
};
