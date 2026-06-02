import { describe, expect, it } from "vitest";

import { serviceSchema } from "@/lib/schemas/entities";

describe("services contract", () => {
  it("GET /api/services returns service list", () => {
    const sample = [
      {
        id: "0f18b4e2-7c0a-4b43-9f4c-9a2b6d5c1f3c",
        name: "Deep Tissue Massage",
        description: "Description",
        offeringType: "SESSION",
        durationMin: 60,
        priceCents: 8000,
        downpaymentCents: 2000,
        durationPriceOptions: [
          { durationMin: 60, priceCents: 8000 },
          { durationMin: 75, priceCents: 8800 },
        ],
        heroMediaType: "IMAGE",
        heroMediaUrl: "/uploads/service-media/hero.jpg",
        heroMediaAltText: "Calm treatment room",
        heroPosterUrl: null,
        cardMediaType: "GIF",
        cardMediaUrl: "/uploads/service-media/card.gif",
        cardMediaAltText: "Massage technique animation",
        isDecorative: false,
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
      offeringType: "SESSION",
      durationMin: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      durationPriceOptions: [{ durationMin: 60, priceCents: 8000 }],
      heroMediaType: "VIDEO",
      heroMediaUrl: "/uploads/service-media/hero.mp4",
      heroMediaAltText: "Therapist performing deep tissue massage",
      heroPosterUrl: "/uploads/service-media/hero-poster.jpg",
      cardMediaType: "IMAGE",
      cardMediaUrl: "/uploads/service-media/card.jpg",
      cardMediaAltText: "Massage oil and towels on table",
      isDecorative: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = serviceSchema.safeParse(sample);
    expect(result.success).toBe(true);
  });

  it("requires alt text when media is not decorative", () => {
    const sample = {
      id: "0f18b4e2-7c0a-4b43-9f4c-9a2b6d5c1f3c",
      name: "Deep Tissue Massage",
      description: "Description",
      offeringType: "SESSION",
      durationMin: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      heroMediaType: "IMAGE",
      heroMediaUrl: "/uploads/service-media/hero.jpg",
      heroMediaAltText: null,
      cardMediaType: "IMAGE",
      cardMediaUrl: "/uploads/service-media/card.jpg",
      cardMediaAltText: null,
      isDecorative: false,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = serviceSchema.safeParse(sample);
    expect(result.success).toBe(false);
  });
});
