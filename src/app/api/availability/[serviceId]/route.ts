import { NextResponse } from "next/server";

import {
  buildAvailabilityCacheKey,
  getAvailabilityCache,
  setAvailabilityCache,
} from "@/lib/cache/availability";
import { fromZonedTime } from "date-fns-tz";

import { calculateAvailableSlotsForDate, getBusinessDayBounds } from "@/lib/services/availability";
import { prisma } from "@/lib/prisma";
import { resolveServiceDurationOption } from "@/lib/service-duration-options";

export const dynamic = "force-dynamic";
const BUSINESS_TIME_ZONE = "America/Barbados";

const parseDate = (value: string): Date => {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

const getDayBounds = (date: Date): ReturnType<typeof getBusinessDayBounds> =>
  getBusinessDayBounds(
    fromZonedTime(`${date.toISOString().slice(0, 10)}T00:00:00`, BUSINESS_TIME_ZONE),
    BUSINESS_TIME_ZONE,
  );

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
  const durationMinParam = searchParams.get("durationMin");

  if (!startDateParam) {
    return NextResponse.json({ error: "startDate is required" }, { status: 400 });
  }

  const service = await prisma.service.findUnique({
    where: { id: serviceId, isActive: true },
  });

  if (!service) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  const settings = await prisma.systemSettings.findFirst();

  if (!settings) {
    return NextResponse.json({ error: "System settings missing" }, { status: 500 });
  }

  const businessHoursRaw = await prisma.businessHours.findMany({
    include: { blackoutRanges: true },
  });
  const businessHours = businessHoursRaw.map((entry) => ({
    ...entry,
    blockedRanges: entry.blackoutRanges,
  }));
  const overrides = await prisma.dateOverride.findMany();
  const now = new Date();
  const requestedDuration = Number.parseInt(durationMinParam ?? "", 10);
  const selectedOption = resolveServiceDurationOption(
    service,
    Number.isNaN(requestedDuration) ? undefined : requestedDuration,
  );

  const cacheKey = buildAvailabilityCacheKey({
    serviceId: service.id,
    startDate: startDateParam,
    endDate: endDateParam,
    date: dateParam,
    durationMin: selectedOption.durationMin,
  });
  const cached = getAvailabilityCache<Record<string, unknown>>(cacheKey);

  if (cached) {
    return NextResponse.json(cached);
  }

  if (dateParam) {
    const targetDate = parseDate(dateParam);
    const dayBounds = getDayBounds(targetDate);
    const dayBookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: dayBounds.start,
          lt: dayBounds.end,
        },
      },
    });

    const slots = calculateAvailableSlotsForDate({
      date: targetDate,
      service: {
        ...service,
        durationMin: selectedOption.durationMin,
      },
      bookings: dayBookings,
      businessHours,
      overrides,
      settings,
      timeZone: BUSINESS_TIME_ZONE,
      now,
    });

    const payload = {
      date: dateParam,
      slots: slots.map((slot: (typeof slots)[number]) => ({
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
    const dayBounds = getDayBounds(cursor);
    const dayBookings = await prisma.booking.findMany({
      where: {
        startTime: {
          gte: dayBounds.start,
          lt: dayBounds.end,
        },
      },
    });

    const slots = calculateAvailableSlotsForDate({
      date: cursor,
      service: {
        ...service,
        durationMin: selectedOption.durationMin,
      },
      bookings: dayBookings,
      businessHours,
      overrides,
      settings,
      timeZone: BUSINESS_TIME_ZONE,
      now,
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
