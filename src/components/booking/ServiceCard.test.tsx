import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import { ServiceCard } from "@/components/booking/ServiceCard";

describe("ServiceCard", () => {
  it("renders service details", () => {
    render(
      <ServiceCard
        service={{
          id: "service-1",
          name: "Deep Tissue Massage",
          description: "Deep pressure",
          offeringType: "SESSION",
          durationMin: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          isActive: true,
        }}
      />,
    );

    expect(screen.getByText("Deep Tissue Massage")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "60 min" })).toHaveAttribute("aria-pressed", "true");
  });

  it("updates displayed duration and price when a duration badge is selected", async () => {
    const user = userEvent.setup();

    render(
      <ServiceCard
        service={{
          id: "service-2",
          name: "Sports Massage",
          description: "Athletic recovery",
          offeringType: "SESSION",
          durationMin: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          isActive: true,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "60 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$80 Bds");

    await user.click(screen.getByRole("button", { name: "75 min" }));

    expect(screen.getByRole("button", { name: "75 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$88 Bds");
  });

  it("renders custom duration badges configured by admins", async () => {
    const user = userEvent.setup();

    render(
      <ServiceCard
        service={{
          id: "service-4",
          name: "Custom Session",
          description: "Custom badge pricing",
          offeringType: "SESSION",
          durationMin: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          durationPriceOptions: [
            { durationMin: 45, priceCents: 6500 },
            { durationMin: 70, priceCents: 9500 },
          ],
          isActive: true,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "45 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$65 Bds");

    await user.click(screen.getByRole("button", { name: "70 min" }));

    expect(screen.getByRole("button", { name: "70 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$95 Bds");
  });

  it("uses the 50/65 fixed pricing rule for 50-minute sessions", async () => {
    const user = userEvent.setup();

    render(
      <ServiceCard
        service={{
          id: "service-3",
          name: "Aromatherapy Relaxation Massage",
          description: "Soothing therapy",
          offeringType: "SESSION",
          durationMin: 50,
          priceCents: 7000,
          downpaymentCents: 1750,
          isActive: true,
        }}
      />,
    );

    expect(screen.getByRole("button", { name: "50 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$150 Bds");

    await user.click(screen.getByRole("button", { name: "65 min" }));

    expect(screen.getByRole("button", { name: "65 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$165 Bds");
  });

  it("renders card media when configured", () => {
    render(
      <ServiceCard
        service={{
          id: "service-6",
          name: "Aromatherapy",
          description: "Relaxing essential oils",
          offeringType: "SESSION",
          durationMin: 60,
          priceCents: 9000,
          downpaymentCents: 2000,
          cardMediaType: "IMAGE",
          cardMediaUrl: "/uploads/service-media/aroma.jpg",
          cardMediaAltText: "Essential oils and massage stones",
          isDecorative: false,
          isActive: true,
        }}
      />,
    );

    const media = screen.getByTestId("service-card-media");
    expect(media.tagName).toBe("IMG");
    expect(media).toHaveAttribute("alt", "Essential oils and massage stones");
  });

  it("uses static fallback for gif media when reduced motion is preferred", () => {
    globalThis.matchMedia = (query: string) => ({
      matches: query === "(prefers-reduced-motion: reduce)",
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    });

    render(
      <ServiceCard
        service={{
          id: "service-7",
          name: "Recovery Flow",
          description: "Guided recovery session",
          offeringType: "SESSION",
          durationMin: 60,
          priceCents: 9200,
          downpaymentCents: 2300,
          cardMediaType: "GIF",
          cardMediaUrl: "/uploads/service-media/recovery.gif",
          cardMediaAltText: "Animated guided recovery sequence",
          isDecorative: false,
          isActive: true,
        }}
      />,
    );

    const media = screen.getByTestId("service-card-media");
    expect(media.tagName).toBe("DIV");
  });
});
