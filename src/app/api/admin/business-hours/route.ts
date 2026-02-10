import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);
const businessHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  openingTime: z.union([timeSchema, z.null()]).optional(),
  closingTime: z.union([timeSchema, z.null()]).optional(),
  isOpen: z.boolean(),
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

  const [hours, minutes] = value.split(":").map((part) => Number(part));
  if (Number.isNaN(hours) || Number.isNaN(minutes)) {
    return null;
  }

  return new Date(Date.UTC(1970, 0, 1, hours, minutes, 0));
};

export const GET = async (): Promise<NextResponse> => {
  const businessHours = await prisma.businessHours.findMany({
    orderBy: { dayOfWeek: "asc" },
  });

  const payload = businessHours.map((entry) => ({
    id: entry.id,
    dayOfWeek: entry.dayOfWeek,
    openingTime: toTimeString(entry.openingTime),
    closingTime: toTimeString(entry.closingTime),
    isOpen: entry.isOpen,
  }));

  return NextResponse.json({ businessHours: payload });
};

export const PUT = async (request: Request): Promise<NextResponse> => {
  const body = await request.json();
  const parsed = updateBusinessHoursSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const updated = await prisma.$transaction(
    parsed.data.businessHours.map((entry) =>
      prisma.businessHours.upsert({
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
      }),
    ),
  );

  const payload = updated
    .sort((a, b) => a.dayOfWeek - b.dayOfWeek)
    .map((entry) => ({
      id: entry.id,
      dayOfWeek: entry.dayOfWeek,
      openingTime: toTimeString(entry.openingTime),
      closingTime: toTimeString(entry.closingTime),
      isOpen: entry.isOpen,
    }));

  return NextResponse.json({ businessHours: payload });
};
