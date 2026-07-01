import type { Decorator, Meta, StoryObj } from "@storybook/react";

import { ServiceCard } from "@/components/booking/ServiceCard";

const meta: Meta<typeof ServiceCard> = {
  title: "Booking/ServiceCard",
  component: ServiceCard,
};

export default meta;

type Story = StoryObj<typeof ServiceCard>;

const prefersReducedMotionDecorator: Decorator = (StoryComponent) => {
  globalThis.matchMedia = ((query: string) => ({
    matches: query === "(prefers-reduced-motion: reduce)",
    media: query,
    onchange: null,
    addListener: () => undefined,
    removeListener: () => undefined,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    dispatchEvent: () => false,
  })) as typeof globalThis.matchMedia;

  return <StoryComponent />;
};

export const Default: Story = {
  args: {
    service: {
      id: "service-1",
      name: "Deep Tissue Massage",
      description: "Deep pressure focused massage.",
      offeringType: "SESSION",
      durationMin: 60,
      priceCents: 8000,
      downpaymentCents: 2000,
      isActive: true,
    },
  },
};

export const WithImageBanner: Story = {
  args: {
    service: {
      id: "service-2",
      name: "Sports Massage",
      description: "Performance-focused recovery massage.",
      offeringType: "SESSION",
      durationMin: 60,
      priceCents: 8400,
      downpaymentCents: 2100,
      cardMediaType: "IMAGE",
      cardMediaUrl:
        "https://images.unsplash.com/photo-1544161515-4ab6ce6db874?auto=format&fit=crop&w=1200&q=80",
      cardMediaAltText: "Sports massage in progress",
      isDecorative: false,
      isActive: true,
    },
  },
};

export const WithGifBanner: Story = {
  args: {
    service: {
      id: "service-3",
      name: "Mobility Tune-Up",
      description: "Animated routine preview for mobility-focused work.",
      offeringType: "SESSION",
      durationMin: 60,
      priceCents: 8200,
      downpaymentCents: 2050,
      cardMediaType: "GIF",
      cardMediaUrl: "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif",
      cardMediaAltText: "Animated mobility routine",
      isDecorative: false,
      isActive: true,
    },
  },
};

export const VideoLikePresentation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          "Catalog cards support IMAGE/GIF only; this state uses a cinematic image frame as the card equivalent of hero video art direction.",
      },
    },
  },
  args: {
    service: {
      id: "service-5",
      name: "Recovery Studio Session",
      description: "Cinematic still from hero video adapted for card-safe rendering.",
      offeringType: "SESSION",
      durationMin: 60,
      priceCents: 8600,
      downpaymentCents: 2150,
      cardMediaType: "IMAGE",
      cardMediaUrl:
        "https://images.unsplash.com/photo-1519823551278-64ac92734fb1?auto=format&fit=crop&w=1200&q=80",
      cardMediaAltText: "Relaxation studio scene",
      isDecorative: false,
      isActive: true,
    },
  },
};

export const ReducedMotionFallback: Story = {
  decorators: [prefersReducedMotionDecorator],
  args: {
    service: {
      id: "service-6",
      name: "Guided Mobility Reset",
      description:
        "GIF media falls back to a neutral static surface when reduced motion is preferred.",
      offeringType: "SESSION",
      durationMin: 60,
      priceCents: 8300,
      downpaymentCents: 2075,
      cardMediaType: "GIF",
      cardMediaUrl: "https://media.giphy.com/media/26tn33aiTi1jkl6H6/giphy.gif",
      cardMediaAltText: "Animated mobility routine",
      isDecorative: false,
      isActive: true,
    },
  },
};

export const WithoutMedia: Story = {
  args: {
    service: {
      id: "service-4",
      name: "Wellness Circle",
      description: "No media configured for this offering.",
      offeringType: "EVENT",
      durationMin: 90,
      priceCents: 18000,
      downpaymentCents: 4500,
      isActive: true,
    },
  },
};
