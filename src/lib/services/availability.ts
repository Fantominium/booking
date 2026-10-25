import { addMinutes, differenceInMinutes, isBefore } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export type AvailabilitySlot = {
  start: Date;
  end: Date;
};

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";

type ServiceInput = {
  durationMin: number;
};

type BookingInput = {
  startTime: Date;
  endTime: Date;
  status: BookingStatus;
};

type BusinessHoursInput = {
  dayOfWeek: number;
  openingTime: Date | null;
  closingTime: Date | null;
  isOpen: boolean;
  blockedRanges: Array<{
    startTime: Date;
    endTime: Date;
  }>;
};

type DateOverrideInput = {
  startDate: Date;
  endDate: Date;
  isBlocked: boolean;
  customOpenTime: Date | null;
  customCloseTime: Date | null;
};

type SystemSettingsInput = {
  maxBookingsPerDay: number;
  bufferMinutes: number;
};

const getDayOfWeek = (date: Date): number => {
  const utcDay = date.getUTCDay();
  return (utcDay + 6) % 7;
};

const getTimeParts = (time: Date): { hours: number; minutes: number } => {
  return { hours: time.getUTCHours(), minutes: time.getUTCMinutes() };
};

const buildDateWithTime = (date: Date, time: Date, timeZone: string): Date => {
  const { hours, minutes } = getTimeParts(time);
  const dateKey = date.toISOString().slice(0, 10);
  const timeKey = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:00`;
  return fromZonedTime(`${dateKey}T${timeKey}`, timeZone);
};

export const getBusinessDayBounds = (
  instant: Date,
  timeZone: string,
): { start: Date; end: Date } => {
  const local = toZonedTime(instant, timeZone);
  const localDate = new Date(Date.UTC(local.getFullYear(), local.getMonth(), local.getDate()));
  const nextDate = addMinutes(localDate, 24 * 60);
  const localDateKey = localDate.toISOString().slice(0, 10);
  const nextDateKey = nextDate.toISOString().slice(0, 10);

  return {
    start: fromZonedTime(`${localDateKey}T00:00:00`, timeZone),
    end: fromZonedTime(`${nextDateKey}T00:00:00`, timeZone),
  };
};

const isDateWithinRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  const dateKey = date.toISOString().slice(0, 10);
  return (
    dateKey >= startDate.toISOString().slice(0, 10) && dateKey <= endDate.toISOString().slice(0, 10)
  );
};

const isOverlapping = (a: AvailabilitySlot, b: AvailabilitySlot): boolean => {
  return a.start < b.end && a.end > b.start;
};

const getDailyBookingsCount = (bookings: BookingInput[]): number => {
  return bookings.filter(
    (booking) => booking.status !== "CANCELLED" && booking.status !== "EXPIRED",
  ).length;
};

export const calculateAvailableSlotsForDate = (params: {
  date: Date;
  service: ServiceInput;
  bookings: BookingInput[];
  businessHours: BusinessHoursInput[];
  overrides: DateOverrideInput[];
  settings: SystemSettingsInput;
  timeZone: string;
  now: Date;
}): AvailabilitySlot[] => {
  const { date, service, bookings, businessHours, overrides, settings, timeZone, now } = params;

  if (getDailyBookingsCount(bookings) >= settings.maxBookingsPerDay) {
    return [];
  }

  const override = overrides.find((entry) =>
    isDateWithinRange(date, entry.startDate, entry.endDate),
  );

  if (override?.isBlocked) {
    return [];
  }

  const dayConfig = businessHours.find(
    (entry: (typeof businessHours)[number]) => entry.dayOfWeek === getDayOfWeek(date),
  );

  const openingTime = override?.customOpenTime ?? dayConfig?.openingTime ?? null;
  const closingTime = override?.customCloseTime ?? dayConfig?.closingTime ?? null;

  if (!dayConfig?.isOpen || !openingTime || !closingTime) {
    return [];
  }

  const minimumBufferMinutes = Math.max(settings.bufferMinutes, 60);
  const slotDuration = service.durationMin + minimumBufferMinutes;
  const dayStart = buildDateWithTime(date, openingTime, timeZone);
  const dayEnd = buildDateWithTime(date, closingTime, timeZone);

  const intervalMinutes = 15;
  const totalMinutes = differenceInMinutes(dayEnd, dayStart);
  const steps = Math.max(Math.floor(totalMinutes / intervalMinutes) + 1, 0);

  const slotStarts = Array.from({ length: steps }, (_, index) =>
    addMinutes(dayStart, index * intervalMinutes),
  ).filter(
    (start) =>
      !isBefore(start, addMinutes(now, 120)) &&
      isBefore(addMinutes(start, slotDuration), addMinutes(dayEnd, 1)),
  );

  return slotStarts
    .map((start: (typeof slotStarts)[number]) => ({
      start,
      end: addMinutes(start, slotDuration),
    }))
    .filter(
      (slot) =>
        !dayConfig?.blockedRanges.some((blockedRange) =>
          isOverlapping(slot, {
            start: buildDateWithTime(date, blockedRange.startTime, timeZone),
            end: buildDateWithTime(date, blockedRange.endTime, timeZone),
          }),
        ),
    )
    .filter(
      (slot) =>
        !bookings.some(
          (booking: (typeof bookings)[number]) =>
            booking.status !== "CANCELLED" &&
            booking.status !== "EXPIRED" &&
            isOverlapping(slot, {
              start: booking.startTime,
              end: booking.endTime,
            }),
        ),
    );
};
