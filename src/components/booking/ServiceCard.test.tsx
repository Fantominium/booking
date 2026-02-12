import { render, screen } from "@testing-library/react";
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
          durationMin: 60,
          priceCents: 8000,
          downpaymentCents: 2000,
          isActive: true,
        }}
      />,
    );

    expect(screen.getByText("Deep Tissue Massage")).toBeInTheDocument();
    expect(screen.getByText("60 min")).toBeInTheDocument();
  });
});
