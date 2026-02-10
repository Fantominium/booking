import type { Meta, StoryObj } from "@storybook/react";

import { ServiceCard } from "@/components/booking/ServiceCard";

const meta: Meta<typeof ServiceCard> = {
  title: "Booking/ServiceCard",
  component: ServiceCard,
};

export default meta;

type Story = StoryObj<typeof ServiceCard>;

export const Default: Story = {
  args: {
    service: {
      id: "service-1",
      name: "Deep Tissue Massage",
      description: "Deep pressure focused massage.",
      durationMin: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      isActive: true,
    },
  },
};
