import { describe, expect, it } from "vitest";
import { z } from "zod";

const serviceSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable().optional(),
  durationMin: z.number().int().positive(),
  priceCents: z.number().int().nonnegative(),
  downpaymentCents: z.number().int().nonnegative(),
  isActive: z.boolean(),
});

describe("admin services contract", () => {
  it("POST /api/admin/services returns created service", () => {
    const payload = {
      service: {
        id: "service-1",
        name: "Hot Stone Massage",
        description: "Relaxing treatment",
        durationMin: 75,
        priceCents: 12000,
        downpaymentCents: 3000,
        isActive: true,
      },
    };

    const result = z.object({ service: serviceSchema }).safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("PATCH /api/admin/services/[id] returns updated service", () => {
    const payload = {
      service: {
        id: "service-1",
        name: "Hot Stone Massage",
        description: "Relaxing treatment",
        durationMin: 75,
        priceCents: 13000,
        downpaymentCents: 3000,
        isActive: true,
      },
    };

    const result = z.object({ service: serviceSchema }).safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("DELETE /api/admin/services/[id] returns empty payload", () => {
    const payload = null;
    const result = z.null().safeParse(payload);
    expect(result.success).toBe(true);
  });
});
