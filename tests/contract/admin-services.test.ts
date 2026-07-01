import { describe, expect, it } from "vitest";
import { z } from "zod";

import { serviceMediaMetadataSchema } from "@/lib/schemas/api";
import { serviceSchema } from "@/lib/schemas/entities";

describe("admin services contract", () => {
  it("POST /api/admin/services returns created service", () => {
    const payload = {
      service: {
        id: "0f18b4e2-7c0a-4b43-9f4c-9a2b6d5c1f3c",
        name: "Hot Stone Massage",
        description: "Relaxing treatment",
        offeringType: "SESSION",
        durationMin: 75,
        priceCents: 12000,
        downpaymentCents: 3000,
        durationPriceOptions: null,
        heroMediaType: null,
        heroMediaUrl: null,
        heroMediaAltText: null,
        heroPosterUrl: null,
        cardMediaType: null,
        cardMediaUrl: null,
        cardMediaAltText: null,
        isDecorative: null,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };

    const result = z.object({ service: serviceSchema }).safeParse(payload);
    expect(result.success).toBe(true);
  });

  it("PATCH /api/admin/services/[id] returns updated service with media fields", () => {
    const payload = {
      service: {
        id: "0f18b4e2-7c0a-4b43-9f4c-9a2b6d5c1f3c",
        name: "Hot Stone Massage",
        description: "Relaxing treatment",
        offeringType: "SESSION",
        durationMin: 75,
        priceCents: 13000,
        downpaymentCents: 3000,
        durationPriceOptions: null,
        heroMediaType: "IMAGE",
        heroMediaUrl: "/uploads/service-media/hero.jpg",
        heroMediaAltText: "Warm stones on back",
        heroPosterUrl: null,
        cardMediaType: "IMAGE",
        cardMediaUrl: "/uploads/service-media/card.jpg",
        cardMediaAltText: "Stone arrangement",
        isDecorative: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
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

  it("PATCH merged-state: clearing heroPosterUrl on a VIDEO service is rejected", () => {
    // Simulates: existing service has heroMediaType=VIDEO + heroMediaUrl set.
    // PATCH sends only heroPosterUrl: null — the merged result must be invalid.
    const mergedState = {
      heroMediaType: "VIDEO",
      heroMediaUrl: "/uploads/service-media/hero.mp4",
      heroMediaAltText: "Massage in motion",
      heroPosterUrl: null, // cleared by partial PATCH
      cardMediaType: null,
      cardMediaUrl: null,
      cardMediaAltText: null,
      isDecorative: false,
    };

    const result = serviceMediaMetadataSchema.safeParse(mergedState);
    expect(result.success).toBe(false);
    const paths = result.error?.issues.map((i) => i.path[0]);
    expect(paths).toContain("heroPosterUrl");
  });

  it("PATCH merged-state: valid VIDEO with poster is accepted", () => {
    const mergedState = {
      heroMediaType: "VIDEO",
      heroMediaUrl: "/uploads/service-media/hero.mp4",
      heroMediaAltText: "Massage in motion",
      heroPosterUrl: "/uploads/service-media/poster.jpg",
      cardMediaType: null,
      cardMediaUrl: null,
      cardMediaAltText: null,
      isDecorative: false,
    };

    const result = serviceMediaMetadataSchema.safeParse(mergedState);
    expect(result.success).toBe(true);
  });
});
