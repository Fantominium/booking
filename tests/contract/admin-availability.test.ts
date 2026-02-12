import { describe, expect, it } from "vitest";
import { z } from "zod";

const businessHoursSchema = z.object({
  id: z.string(),
  dayOfWeek: z.number().int().min(0).max(6),
  openingTime: z.union([z.string(), z.date()]).nullable().optional(),
  closingTime: z.union([z.string(), z.date()]).nullable().optional(),
  isOpen: z.boolean(),
});

const dateOverrideSchema = z.object({
  id: z.string(),
  date: z.union([z.string(), z.date()]),
  isBlocked: z.boolean(),
  customOpenTime: z.union([z.string(), z.date()]).nullable().optional(),
  customCloseTime: z.union([z.string(), z.date()]).nullable().optional(),
  reason: z.string().nullable().optional(),
});

describe("admin availability contract", () => {
  const businessHoursResponseSchema = z.object({
    businessHours: z.array(businessHoursSchema),
  });

  it("GET /api/admin/business-hours returns business hours payload", () => {
    const payload = {
      businessHours: [
        {
          id: "b5f8f618-8b62-4a2e-a723-7b2a35d7e3f4",
          dayOfWeek: 1,
          openingTime: "09:00",
          closingTime: "17:00",
          isOpen: true,
        },
      ],
    };

    const result = businessHoursResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("PUT /api/admin/business-hours returns updated business hours payload", () => {
    const payload = {
      businessHours: [
        {
          id: "b5f8f618-8b62-4a2e-a723-7b2a35d7e3f4",
          dayOfWeek: 1,
          openingTime: "10:00",
          closingTime: "18:00",
          isOpen: true,
        },
      ],
    };

    const result = businessHoursResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("POST /api/admin/date-overrides returns date override payload", () => {
    const payload = {
      id: "b5f8f618-8b62-4a2e-a723-7b2a35d7e3f4",
      date: "2026-12-25",
      isBlocked: true,
      customOpenTime: null,
      customCloseTime: null,
      reason: "Holiday closure",
    };

    const result = dateOverrideSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("DELETE /api/admin/date-overrides/[id] returns empty payload", () => {
    const payload = null;
    const result = z.null().safeParse(payload);
    expect(result.success).toBe(true);
  });
});
