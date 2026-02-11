import { NextResponse } from "next/server";

import {
  buildAvailabilityCacheKey,
  getAvailabilityCache,
  setAvailabilityCache,
} from "@/lib/cache/availability";
import { calculateAvailableSlotsForDate } from "@/lib/services/availability";
import { prisma } from "@/lib/prisma";

const parseDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const addDays = (date: Date, days: number): Date => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export const GET = async (
  request: Request,
  context: { params: Promise<{ serviceId: string }> },
): Promise<NextResponse> => {
  const { serviceId } = await context.params;
  const { searchParams } = new URL(request.url);
  const startDateParam = searchParams.get("startDate");
  const endDateParam = searchParams.get("endDate");
  const dateParam = searchParams.get("date");

  if (!startDateParam) {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const settings = await prisma.systemSettings.findFirst();

  if (!settings) {
    return NextResponse.json({ error: "System settings missing" }, { status: 500 });
  }

  const businessHours = await prisma.businessHours.findMany();
  const overrides = await prisma.dateOverride.findMany();

  const cacheKey = buildAvailabilityCacheKey({
    serviceId: service.id,
    startDate: startDateParam,
    endDate: endDateParam,
    date: dateParam,
  });
  const cached = getAvailabilityCache<Record<string, unknown>>(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  if (dateParam) {
    const targetDate = parseDate(dateParam);
    const dayBookings = await prisma.booking.findMany({
      where: {
        serviceId: service.id,
        startTime: {
          gte: targetDate,
          lt: addDays(targetDate, 1),
        },
      },
    });

    const slots = calculateAvailableSlotsForDate({
      date: targetDate,
      service,
      bookings: dayBookings,
      businessHours,
      overrides,
      settings,
    });

    const payload = {
      date: dateParam,
      slots: slots.map((slot) => ({
        start: slot.start.toISOString(),
        end: slot.end.toISOString(),
      })),
    };

    setAvailabilityCache(cacheKey, payload);
    return NextResponse.json(payload);
  }

  const startDate = parseDate(startDateParam);
  const endDate = endDateParam ? parseDate(endDateParam) : startDate;

  let dates: string[] = [];
  let cursor = startDate;

  while (cursor <= endDate) {
    const dayBookings = await prisma.booking.findMany({
      where: {
        serviceId: service.id,
        startTime: {
          gte: cursor,
          lt: addDays(cursor, 1),
        },
      },
    });

    const slots = calculateAvailableSlotsForDate({
      date: cursor,
      service,
      bookings: dayBookings,
      businessHours,
      overrides,
      settings,
    });

    if (slots.length > 0) {
      dates = [...dates, cursor.toISOString().slice(0, 10)];
    }

    cursor = addDays(cursor, 1);
  }

  const payload = { dates };
  setAvailabilityCache(cacheKey, payload);
  return NextResponse.json(payload);
};
