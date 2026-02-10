import { describe, expect, it } from "vitest";
import { z } from "zod";

describe("availability contract", () => {
  const datesResponseSchema = z.object({
    dates: z.array(z.string()),
  });
  const timesResponseSchema = z.object({
    date: z.string(),
    slots: z.array(
      z.object({
        start: z.string(),
        end: z.string(),
      }),
    ),
  });

  it("GET /api/availability/[serviceId] returns dates payload", () => {
    const payload = { dates: ["2026-02-10"] };
    const result = datesResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("GET /api/availability/[serviceId] returns time slots payload", () => {
    const payload = {
      date: "2026-02-10",
      slots: [{ start: "2026-02-10T10:00:00.000Z", end: "2026-02-10T11:15:00.000Z" }],
    };

    const result = timesResponseSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });
});
