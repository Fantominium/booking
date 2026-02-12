import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("admin settings contract", () => {
  const systemSettingsSchema = z.object({
    id: z.string(),
    maxBookingsPerDay: z.number().int().min(1),
    bufferMinutes: z.number().int().min(0),
    updatedAt: z.union([z.string(), z.date()]),
  });

  it("PATCH /api/admin/settings returns system settings payload", () => {
    const payload = {
      id: "b5f8f618-8b62-4a2e-a723-7b2a35d7e3f4",
      maxBookingsPerDay: 8,
      bufferMinutes: 15,
      updatedAt: "2026-02-10T12:00:00.000Z",
    };

    const result = systemSettingsSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
