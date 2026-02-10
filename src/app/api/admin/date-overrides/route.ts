import { NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const timeSchema = z.string().regex(/^\d{2}:\d{2}$/);
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const createDateOverrideSchema = z.object({
  date: dateSchema,
  isBlocked: z.boolean(),
  customOpenTime: z.union([timeSchema, z.null()]).optional(),
  customCloseTime: z.union([timeSchema, z.null()]).optional(),
  reason: z.string().max(255).nullable().optional(),
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

const parseDateString = (value: string): Date => {
  const [year, month, day] = value.split("-").map((part) => Number(part));
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
};

export const GET = async (): Promise<NextResponse> => {
  const overrides = await prisma.dateOverride.findMany({
    orderBy: { date: "asc" },
  });

  const payload = overrides.map((entry) => ({
    id: entry.id,
    date: entry.date.toISOString().slice(0, 10),
    isBlocked: entry.isBlocked,
    customOpenTime: toTimeString(entry.customOpenTime),
    customCloseTime: toTimeString(entry.customCloseTime),
    reason: entry.reason ?? null,
  }));

  return NextResponse.json({ dateOverrides: payload });
};

export const POST = async (request: Request): Promise<NextResponse> => {
  const body = await request.json();
  const parsed = createDateOverrideSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const entry = await prisma.dateOverride.create({
    data: {
      date: parseDateString(parsed.data.date),
      isBlocked: parsed.data.isBlocked,
      customOpenTime: parseTimeString(parsed.data.customOpenTime ?? null),
      customCloseTime: parseTimeString(parsed.data.customCloseTime ?? null),
      reason: parsed.data.reason ?? null,
    },
  });

  return NextResponse.json(
    {
      id: entry.id,
      date: entry.date.toISOString().slice(0, 10),
      isBlocked: entry.isBlocked,
      customOpenTime: toTimeString(entry.customOpenTime),
      customCloseTime: toTimeString(entry.customCloseTime),
      reason: entry.reason ?? null,
    },
    { status: 201 },
  );
};
