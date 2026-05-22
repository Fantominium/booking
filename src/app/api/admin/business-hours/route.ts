import { NextResponse } from "next/server";
import { z } from "zod";

import { createAdminUnauthorizedResponse, getAdminSession } from "@/lib/auth/admin";
import { invalidateAvailabilityCache } from "@/lib/cache/availability";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);
const businessHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openingTime: z.union([timeSchema, z.null()]).optional(),
  closingTime: z.union([timeSchema, z.null()]).optional(),
  isOpen: z.boolean(),
  blockedRanges: z
    .array(
      z.object({
        id: z.string().optional(),
        startTime: z.union([timeSchema, z.null()]).optional(),
        endTime: z.union([timeSchema, z.null()]).optional(),
        reason: z.string().max(255).nullable().optional(),
      }),
    )
    .default([]),
});

const updateBusinessHoursSchema = z.object({
  businessHours: z.array(businessHourSchema),
});

const toTimeString = (value: Date | null): string | null => {
  if (!value) {
    return null;
  }

  const hours = value.getUTCHours().toString().padStart(2, "0");
  const minutes = value.getUTCMinutes().toString().padStart(2, "0");
  return `${hours}:${minutes}`;
};

const parseTimeString = (value: string | null | undefined): Date | null => {
  if (!value) {
    return null;
  }

  const [hours, minutes] = value.split(":").map(Number);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
};

const mapBlock = (entry: {
  id: string;
  startTime: Date;
  endTime: Date;
  reason: string | null;
}): { id: string; startTime: string; endTime: string; reason: string | null } => ({
  id: entry.id,
  startTime: toTimeString(entry.startTime) ?? "",
  endTime: toTimeString(entry.endTime) ?? "",
  reason: entry.reason,
});

export const GET = async (): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const businessHours = await prisma.businessHours.findMany({
    orderBy: { dayOfWeek: "asc" },
    include: { blackoutRanges: { orderBy: { startTime: "asc" } } },
  });

  const payload = businessHours.map((entry: (typeof businessHours)[number]) => ({
    id: entry.id,
    dayOfWeek: entry.dayOfWeek,
    openingTime: toTimeString(entry.openingTime),
    closingTime: toTimeString(entry.closingTime),
    isOpen: entry.isOpen,
    blockedRanges: entry.blackoutRanges.map(mapBlock),
  }));

  return NextResponse.json({ businessHours: payload });
};

export const PUT = async (request: Request): Promise<NextResponse> => {
  if (!(await getAdminSession())) {
    return createAdminUnauthorizedResponse();
  }

  const body = await request.json();
  const parsed = updateBusinessHoursSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await prisma.$transaction(async (tx) => {
    const savedBusinessHours = [] as Array<Awaited<ReturnType<typeof tx.businessHours.upsert>>>;

    for (const entry of parsed.data.businessHours) {
      const savedEntry = await tx.businessHours.upsert({
        where: { dayOfWeek: entry.dayOfWeek },
        update: {
          openingTime: parseTimeString(entry.openingTime ?? null),
          closingTime: parseTimeString(entry.closingTime ?? null),
          isOpen: entry.isOpen,
        },
        create: {
          dayOfWeek: entry.dayOfWeek,
          openingTime: parseTimeString(entry.openingTime ?? null),
          closingTime: parseTimeString(entry.closingTime ?? null),
          isOpen: entry.isOpen,
        },
      });

      savedBusinessHours.push(savedEntry);
    }

    await tx.businessHoursBlock.deleteMany({
      where: { businessHoursId: { in: savedBusinessHours.map((entry) => entry.id) } },
    });

    await tx.businessHoursBlock.createMany({
      data: parsed.data.businessHours.flatMap((entry) => {
        const savedEntry = savedBusinessHours.find((item) => item.dayOfWeek === entry.dayOfWeek);

        if (!savedEntry) {
          return [];
        }

        return entry.blockedRanges
          .map((blockedRange) => ({
            businessHoursId: savedEntry.id,
            startTime: parseTimeString(blockedRange.startTime ?? null),
            endTime: parseTimeString(blockedRange.endTime ?? null),
            reason: blockedRange.reason ?? null,
          }))
          .filter(
            (
              blockedRange,
            ): blockedRange is {
              businessHoursId: string;
              startTime: Date;
              endTime: Date;
              reason: string | null;
            } => blockedRange.startTime !== null && blockedRange.endTime !== null,
          );
      }),
    });

    return tx.businessHours.findMany({
      orderBy: { dayOfWeek: "asc" },
      include: { blackoutRanges: { orderBy: { startTime: "asc" } } },
    });
  });

  const payload = [...updated]
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((entry: (typeof updated)[number]) => ({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      openingTime: toTimeString(entry.openingTime),
      closingTime: toTimeString(entry.closingTime),
      isOpen: entry.isOpen,
      blockedRanges: entry.blackoutRanges.map(mapBlock),
    }));

  invalidateAvailabilityCache();

  return NextResponse.json({ businessHours: payload });
};
