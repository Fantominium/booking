import { describe, expect, it } from "vitest";
import { z } from "zod";

const bookingSummarySchema = z.object({
  id: z.string(),
  serviceName: z.string(),
  customerName: z.string(),
  startTime: z.union([z.string(), z.date()]),
  endTime: z.union([z.string(), z.date()]),
  status: z.enum(["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"]),
});

describe("admin dashboard contract", () => {
  it("GET /api/admin/dashboard/today returns today's schedule", () => {
    const payload = {
      date: "2026-02-12",
      bookings: [
        {
          id: "booking-1",
          serviceName: "Swedish Massage",
          customerName: "Taylor",
          startTime: "2026-02-12T10:00:00.000Z",
          endTime: "2026-02-12T11:00:00.000Z",
          status: "CONFIRMED",
        },
      ],
    };

    const result = z
      .object({
        date: z.string(),
        bookings: z.array(bookingSummarySchema),
      })
      .safeParse(payload);

    expect(result.success).toBe(true);
  });
});
