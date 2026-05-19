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
    expect(screen.getByTestId("service-price")).toHaveTextContent("$80.00");

    await user.click(screen.getByRole("button", { name: "75 min" }));

    expect(screen.getByRole("button", { name: "75 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$88.00");
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
    expect(screen.getByTestId("service-price")).toHaveTextContent("$65.00");

    await user.click(screen.getByRole("button", { name: "70 min" }));

    expect(screen.getByRole("button", { name: "70 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$95.00");
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
    expect(screen.getByTestId("service-price")).toHaveTextContent("$150.00");

    await user.click(screen.getByRole("button", { name: "65 min" }));

    expect(screen.getByRole("button", { name: "65 min" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByTestId("service-price")).toHaveTextContent("$165.00");
  });
});
