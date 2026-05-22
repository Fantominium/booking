import { describe, expect, it } from "vitest";

import { calculateAvailableSlotsForDate } from "@/lib/services/availability";

describe("availability calculation", () => {
  const baseDate = new Date(Date.UTC(2026, 1, 10));
  const service = { durationMin: 60 };
  const businessHours = [
    {
      dayOfWeek: 1,
      openingTime: new Date("1970-01-01T09:00:00Z"),
      closingTime: new Date("1970-01-01T12:00:00Z"),
      isOpen: true,
      blockedRanges: [],
    },
  ];

  const settings = { maxBookingsPerDay: 5, bufferMinutes: 15 };

  it("returns slots within business hours", () => {
    const slots = calculateAvailableSlotsForDate({
      date: baseDate,
      service,
      bookings: [],
      businessHours,
      overrides: [],
      settings,
    });

    expect(slots.length).toBeGreaterThan(0);
    expect(slots[0].start.toISOString()).toContain("T09:00");
  });

  it("respects date overrides", () => {
    const slots = calculateAvailableSlotsForDate({
      date: baseDate,
      service,
      bookings: [],
      businessHours,
      overrides: [
        {
          startDate: baseDate,
          endDate: baseDate,
          isBlocked: true,
          customOpenTime: null,
          customCloseTime: null,
        },
      ],
      settings,
    });

    expect(slots).toHaveLength(0);
  });

  it("respects buffer time", () => {
    const slots = calculateAvailableSlotsForDate({
      date: baseDate,
      service,
      bookings: [],
      businessHours,
      overrides: [],
      settings: { ...settings, bufferMinutes: 30 },
    });

    expect(slots[0].end.getTime() - slots[0].start.getTime()).toBe(90 * 60 * 1000);
  });

  it("respects unavailable business-hour ranges", () => {
    const slots = calculateAvailableSlotsForDate({
      date: baseDate,
      service,
      bookings: [],
      businessHours: [
        {
          ...businessHours[0],
          blockedRanges: [
            {
              startTime: new Date("1970-01-01T10:00:00Z"),
              endTime: new Date("1970-01-01T10:45:00Z"),
            },
          ],
        },
      ],
      overrides: [],
      settings,
    });

    expect(slots.some((slot) => slot.start.toISOString().includes("T10:00"))).toBe(false);
  });

  it("respects date override ranges", () => {
    const slots = calculateAvailableSlotsForDate({
      date: baseDate,
      service,
      bookings: [],
      businessHours,
      overrides: [
        {
          startDate: new Date(Date.UTC(2026, 1, 9)),
          endDate: new Date(Date.UTC(2026, 1, 11)),
          isBlocked: true,
          customOpenTime: null,
          customCloseTime: null,
        },
      ],
      settings,
    });

    expect(slots).toHaveLength(0);
  });

  it("respects daily booking cap", () => {
    const slots = calculateAvailableSlotsForDate({
      date: baseDate,
      service,
      bookings: [
        {
          startTime: new Date(Date.UTC(2026, 1, 10, 9, 0, 0)),
          endTime: new Date(Date.UTC(2026, 1, 10, 10, 15, 0)),
          status: "CONFIRMED",
        },
        {
          startTime: new Date(Date.UTC(2026, 1, 10, 10, 30, 0)),
          endTime: new Date(Date.UTC(2026, 1, 10, 11, 45, 0)),
          status: "CONFIRMED",
        },
        {
          startTime: new Date(Date.UTC(2026, 1, 10, 12, 0, 0)),
          endTime: new Date(Date.UTC(2026, 1, 10, 13, 15, 0)),
          status: "CONFIRMED",
        },
        {
          startTime: new Date(Date.UTC(2026, 1, 10, 13, 30, 0)),
          endTime: new Date(Date.UTC(2026, 1, 10, 14, 45, 0)),
          status: "CONFIRMED",
        },
        {
          startTime: new Date(Date.UTC(2026, 1, 10, 15, 0, 0)),
          endTime: new Date(Date.UTC(2026, 1, 10, 16, 15, 0)),
          status: "CONFIRMED",
        },
      ],
      businessHours,
      overrides: [],
      settings: { ...settings, maxBookingsPerDay: 1 },
    });

    expect(slots).toHaveLength(0);
  });
});
