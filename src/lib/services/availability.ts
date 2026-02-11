import { addMinutes, differenceInMinutes, isBefore } from "date-fns";

export type AvailabilitySlot = {
  start: Date;
  end: Date;
};

type BookingStatus = "PENDING" | "CONFIRMED" | "COMPLETED" | "CANCELLED";

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
};

type DateOverrideInput = {
  date: Date;
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

const buildDateWithTime = (date: Date, time: Date): Date => {
  const { hours, minutes } = getTimeParts(time);
  return new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), hours, minutes, 0),
  );
};

const isOverlapping = (a: AvailabilitySlot, b: AvailabilitySlot): boolean => {
  return a.start < b.end && a.end > b.start;
};

const getDailyBookingsCount = (bookings: BookingInput[]): number => {
  return bookings.filter((booking) => booking.status !== "CANCELLED").length;
};

export const calculateAvailableSlotsForDate = (params: {
  date: Date;
  service: ServiceInput;
  bookings: BookingInput[];
  businessHours: BusinessHoursInput[];
  overrides: DateOverrideInput[];
  settings: SystemSettingsInput;
}): AvailabilitySlot[] => {
  const { date, service, bookings, businessHours, overrides, settings } = params;

  if (getDailyBookingsCount(bookings) >= settings.maxBookingsPerDay) {
    return [];
  }

  const override = overrides.find(
    (entry) => entry.date.toISOString().slice(0, 10) === date.toISOString().slice(0, 10),
  );

  if (override?.isBlocked) {
    return [];
  }

  const dayConfig = businessHours.find((entry) => entry.dayOfWeek === getDayOfWeek(date));

  const openingTime = override?.customOpenTime ?? dayConfig?.openingTime ?? null;
  const closingTime = override?.customCloseTime ?? dayConfig?.closingTime ?? null;

  if (!dayConfig?.isOpen || !openingTime || !closingTime) {
    return [];
  }

  const slotDuration = service.durationMin + settings.bufferMinutes;
  const dayStart = buildDateWithTime(date, openingTime);
  const dayEnd = buildDateWithTime(date, closingTime);

  const intervalMinutes = 15;
  const totalMinutes = differenceInMinutes(dayEnd, dayStart);
  const steps = Math.max(Math.floor(totalMinutes / intervalMinutes) + 1, 0);

  const slotStarts = Array.from({ length: steps }, (_, index) =>
    addMinutes(dayStart, index * intervalMinutes),
  ).filter((start) => isBefore(addMinutes(start, slotDuration), addMinutes(dayEnd, 1)));

  return slotStarts
    .map((start) => ({
      start,
      end: addMinutes(start, slotDuration),
    }))
    .filter(
      (slot) =>
        !bookings.some((booking) =>
          isOverlapping(slot, { start: booking.startTime, end: booking.endTime }),
        ),
    );
};
