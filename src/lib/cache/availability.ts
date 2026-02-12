import { format, parseISO, startOfDay, addMinutes, differenceInMinutes } from "date-fns";
import type { Booking, BusinessHours } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { getOrSetCached, cacheKeys, CACHE_TTL, invalidateCache } from "@/lib/cache/redis";

export interface TimeSlot {
  time: string; // HH:MM format
  available: boolean;
  reason?: string;
}

export interface AvailabilityResult {
  date: string;
  timeSlots: TimeSlot[];
  totalAvailable: number;
}

type AvailabilityCacheEntry<T> = {
  expiresAt: number;
  value: T;
};

type AvailabilityCacheKeyParams = {
  serviceId: string;
  startDate?: string | null;
  endDate?: string | null;
  date?: string | null;
};

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const availabilityCache = new Map<string, AvailabilityCacheEntry<unknown>>();

export const buildAvailabilityCacheKey = (params: AvailabilityCacheKeyParams): string => {
  const rangeKey = params.date
    ? `date:${params.date}`
    : `range:${params.startDate ?? ""}:${params.endDate ?? ""}`;
  return `availability:${params.serviceId}:${rangeKey}`;
};

export const getAvailabilityCache = <T>(key: string): T | null => {
  const entry = availabilityCache.get(key);
  if (!entry) {
    return null;
  }

  if (Date.now() > entry.expiresAt) {
    availabilityCache.delete(key);
    return null;
  }

  return entry.value as T;
};

export const setAvailabilityCache = <T>(key: string, value: T, ttlMs = DEFAULT_TTL_MS): void => {
  availabilityCache.set(key, { expiresAt: Date.now() + ttlMs, value });
};

// Legacy compatibility functions
export const invalidateAvailabilityCache = (): void => {
  availabilityCache.clear();
};

export const invalidateAvailabilityCacheForService = (serviceId: string): void => {
  Array.from(availabilityCache.keys()).forEach((key) => {
    if (key.startsWith(`availability:${serviceId}:`)) {
      availabilityCache.delete(key);
    }
  });
};

/**
 * Enhanced availability calculation with Redis caching
 */
export async function calculateAvailabilityWithCache(
  serviceId: string,
  date: string,
): Promise<AvailabilityResult> {
  const redisKey = `availability:enhanced:${serviceId}:${date}`;

  return getOrSetCached(redisKey, CACHE_TTL.AVAILABILITY, () =>
    calculateAvailabilityDirect(serviceId, date),
  );
}

/**
 * Direct calculation without caching (for cache misses)
 */
async function calculateAvailabilityDirect(
  serviceId: string,
  date: string,
): Promise<AvailabilityResult> {
  // Get service details
  const service = await prisma.service.findUnique({
    where: { id: serviceId, isActive: true },
  });

  if (!service) {
    return {
      date,
      timeSlots: [],
      totalAvailable: 0,
    };
  }

  // Get business hours (with caching)
  const businessHours = await getBusinessHoursWithCache();

  // Get date overrides (check if specific date has custom hours)
  const dateOverride = await prisma.dateOverride.findUnique({
    where: { date: parseISO(date) },
  });

  // If date is blocked or no business hours available
  if (dateOverride?.isBlocked || (!dateOverride && businessHours.length === 0)) {
    return {
      date,
      timeSlots: [],
      totalAvailable: 0,
    };
  }

  // Get existing bookings for this service and date (with caching)
  const bookings = await getBookingConflictsWithCache(serviceId, date);

  // Determine operating hours for the day
  const targetDate = parseISO(date);
  const dayOfWeek = targetDate.getDay();

  // If we have a date override, use it; otherwise use business hours
  if (dateOverride) {
    // Date override exists - if blocked, no slots available
    if (dateOverride.isBlocked) {
      return {
        date,
        timeSlots: [],
        totalAvailable: 0,
      };
    }
    // Use custom hours if available, otherwise use regular business hours
    const businessHour = businessHours.find((h) => h.dayOfWeek === dayOfWeek);
    if (!businessHour || !businessHour.isOpen) {
      return {
        date,
        timeSlots: [],
        totalAvailable: 0,
      };
    }

    // Use custom times from override or fallback to business hours
    const startTime = dateOverride.customOpenTime || businessHour.openingTime;
    const endTime = dateOverride.customCloseTime || businessHour.closingTime;

    if (!startTime || !endTime) {
      return {
        date,
        timeSlots: [],
        totalAvailable: 0,
      };
    }

    // Convert Date objects to time strings (HH:MM format)
    const startTimeStr = `${startTime.getHours().toString().padStart(2, "0")}:${startTime.getMinutes().toString().padStart(2, "0")}`;
    const endTimeStr = `${endTime.getHours().toString().padStart(2, "0")}:${endTime.getMinutes().toString().padStart(2, "0")}`;

    // Generate time slots for date override
    const timeSlots = generateTimeSlots(startTimeStr, endTimeStr, service.durationMin, bookings);
    return {
      date,
      timeSlots,
      totalAvailable: timeSlots.filter((slot) => slot.available).length,
    };
  } else {
    // No date override - use regular business hours
    const businessHour = businessHours.find((h) => h.dayOfWeek === dayOfWeek);
    if (
      !businessHour ||
      !businessHour.isOpen ||
      !businessHour.openingTime ||
      !businessHour.closingTime
    ) {
      return {
        date,
        timeSlots: [],
        totalAvailable: 0,
      };
    }

    // Convert Date objects to time strings (HH:MM format)
    const startTimeStr = `${businessHour.openingTime.getHours().toString().padStart(2, "0")}:${businessHour.openingTime.getMinutes().toString().padStart(2, "0")}`;
    const endTimeStr = `${businessHour.closingTime.getHours().toString().padStart(2, "0")}:${businessHour.closingTime.getMinutes().toString().padStart(2, "0")}`;

    // Generate time slots for regular business hours
    const timeSlots = generateTimeSlots(startTimeStr, endTimeStr, service.durationMin, bookings);
    return {
      date,
      timeSlots,
      totalAvailable: timeSlots.filter((slot) => slot.available).length,
    };
  }
}

/**
 * Get business hours with caching
 */
async function getBusinessHoursWithCache(): Promise<BusinessHours[]> {
  const cacheKey = cacheKeys.businessHours();

  return getOrSetCached(cacheKey, CACHE_TTL.BUSINESS_HOURS, () =>
    prisma.businessHours.findMany({
      orderBy: { dayOfWeek: "asc" },
    }),
  );
}

/**
 * Get booking conflicts for a service and date with caching
 */
async function getBookingConflictsWithCache(serviceId: string, date: string): Promise<Booking[]> {
  const cacheKey = cacheKeys.bookingConflicts(serviceId, date);

  return getOrSetCached(cacheKey, CACHE_TTL.BOOKING_CONFLICTS, async () => {
    const startOfTargetDay = startOfDay(parseISO(date));
    const endOfTargetDay = new Date(startOfTargetDay);
    endOfTargetDay.setDate(endOfTargetDay.getDate() + 1);

    return prisma.booking.findMany({
      where: {
        serviceId,
        startTime: {
          gte: startOfTargetDay,
          lt: endOfTargetDay,
        },
        status: {
          in: ["CONFIRMED", "PENDING"], // Only block for confirmed/pending bookings
        },
      },
      orderBy: { startTime: "asc" },
    });
  });
}

/**
 * Generate time slots between start and end time
 */
function generateTimeSlots(
  startTime: string,
  endTime: string,
  durationMin: number,
  existingBookings: Booking[],
): TimeSlot[] {
  // Parse time strings (format: "HH:MM")
  const [startHour, startMinute] = startTime.split(":").map(Number);
  const [endHour, endMinute] = endTime.split(":").map(Number);

  // Create start and end times for today
  const start = new Date();
  start.setHours(startHour, startMinute, 0, 0);

  const end = new Date();
  end.setHours(endHour, endMinute, 0, 0);

  const intervalMinutes = 30;
  const totalMinutes = differenceInMinutes(end, start);
  const steps = Math.max(Math.ceil(totalMinutes / intervalMinutes), 0);

  const slotStarts = Array.from({ length: steps }, (_, index) =>
    addMinutes(start, index * intervalMinutes),
  );

  return slotStarts.map((currentSlot) => {
    const slotEndTime = addMinutes(currentSlot, durationMin);

    const hasConflict = existingBookings.some((booking) => {
      const bookingStart = booking.startTime;
      const bookingEnd = addMinutes(bookingStart, durationMin);

      return currentSlot < bookingEnd && slotEndTime > bookingStart;
    });

    return {
      time: format(currentSlot, "HH:mm"),
      available: !hasConflict,
      reason: hasConflict ? "Already booked" : undefined,
    };
  });
}

/**
 * Invalidate enhanced availability cache when bookings change
 */
export async function invalidateEnhancedAvailabilityCache(
  serviceId: string,
  date?: string,
): Promise<void> {
  await Promise.all([
    invalidateCache.availability(serviceId, date),
    invalidateCache.bookingConflicts(serviceId, date),
  ]);
}
