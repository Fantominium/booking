import { describe, expect, it } from "vitest";

import { serviceSchema } from "@/lib/schemas/entities";

describe("services contract", () => {
  it("GET /api/services returns service list", () => {
    const sample = [
      {
        id: "0f18b4e2-7c0a-4b43-9f4c-9a2b6d5c1f3c",
        name: "Deep Tissue Massage",
        description: "Description",
        durationMin: 60,
        priceCents: 8000,
        downpaymentCents: 2000,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const result = serviceSchema.array().safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("GET /api/services/[serviceId] returns service", () => {
    const sample = {
      id: "0f18b4e2-7c0a-4b43-9f4c-9a2b6d5c1f3c",
      name: "Deep Tissue Massage",
      description: "Description",
      durationMin: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = serviceSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });
});
