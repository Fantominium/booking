import { describe, expect, it } from "vitest";
import { z } from "zod";

const serviceInputSchema = z
  .object({
    name: z.string().min(1),
    description: z.string().nullable().optional(),
    durationMin: z.number().int().positive(),
    priceCents: z.number().int().nonnegative(),
    downpaymentCents: z.number().int().nonnegative(),
  })
  .refine((value) => value.downpaymentCents <= value.priceCents, {
    message: "Downpayment cannot exceed price",
  });

describe("service validation", () => {
  it("accepts downpayment less than or equal to price", () => {
    const result = serviceInputSchema.safeParse({
      name: "Hot Stone Massage",
      description: null,
      durationMin: 75,
      priceCents: 12000,
      downpaymentCents: 3000,
    });

    expect(result.success).toBe(true);
  });

  it("rejects downpayment greater than price", () => {
    const result = serviceInputSchema.safeParse({
      name: "Hot Stone Massage",
      description: null,
      durationMin: 75,
      priceCents: 1000,
      downpaymentCents: 3000,
    });

    expect(result.success).toBe(false);
  });
});
