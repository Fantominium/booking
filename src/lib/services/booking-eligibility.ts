import type { PrismaClient } from "@prisma/client";
import { formatInTimeZone } from "date-fns-tz";

import { createValidationError } from "@/lib/errors";
import { calculateAvailableSlotsForDate, getBusinessDayBounds } from "@/lib/services/availability";

// Validates business hours, blackout ranges, and date overrides only; lead time,
// overlap, and daily cap are enforced inside the booking transaction.
export const assertStartTimeWithinSchedule = async (params: {
  prisma: PrismaClient;
  startTime: Date;
  serviceDurationMin: number;
  bufferMinutes: number;
  timeZone: string;
}): Promise<void> => {
  const { prisma, startTime, serviceDurationMin, bufferMinutes, timeZone } = params;

  const [businessHoursRaw, overrides] = await Promise.all([
    prisma.businessHours.findMany({ include: { blackoutRanges: true } }),
    prisma.dateOverride.findMany(),
  ]);

  const dayBounds = getBusinessDayBounds(startTime, timeZone);
  const localDate = new Date(
    `${formatInTimeZone(startTime, timeZone, "yyyy-MM-dd")}T00:00:00.000Z`,
  );

  const slots = calculateAvailableSlotsForDate({
    date: localDate,
    service: { durationMin: serviceDurationMin },
    bookings: [],
    businessHours: businessHoursRaw.map((entry) => ({
      ...entry,
      blockedRanges: entry.blackoutRanges,
    })),
    overrides,
    settings: { maxBookingsPerDay: Number.MAX_SAFE_INTEGER, bufferMinutes },
    timeZone,
    now: new Date(dayBounds.start.getTime() - 24 * 60 * 60 * 1000),
  });

  if (!slots.some((slot) => slot.start.getTime() === startTime.getTime())) {
    throw createValidationError("Requested time is outside available booking hours");
  }
};
