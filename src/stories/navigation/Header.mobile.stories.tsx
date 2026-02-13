/**
 * Storybook Stories: Mobile Header States
 *
 * Visual documentation for Header component in mobile viewports.
 *
 * Stories:
 * - MobileHome: Home page with hamburger left, logo right
 * - MobileHomeMenuOpen: Mobile menu expanded
 * - MobileBookingServices: Booking flow with breadcrumbs in menu
 * - MobileBookingPayment: Payment step with progress in menu
 * - MobileAdmin: Admin session with admin dropdown in menu
 * - TabletHome: Tablet viewport (768px) - transition to desktop layout
 */

import type { Meta, StoryObj } from "@storybook/react";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/Header";

// Mock usePathname
const mockPathname = (path: string) => {
  const { usePathname } = require("next/navigation");
  usePathname.mockReturnValue(path);
};

const meta: Meta<typeof Header> = {
  title: "Navigation/Header/Mobile",
  component: Header,
  parameters: {
    layout: "fullscreen",
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

/**
 * Mobile Home - Guest View
 * Viewport: 320px
 * Layout: Hamburger left, Logo+Name right (flex-row-reverse)
 * Path: /
 */
export const MobileHome: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/");
  },
};

/**
 * Mobile Home - Menu Open
 * State: Hamburger morphed to X, mobile menu expanded
 * Content: Home link, Theme toggle
 */
export const MobileHomeMenuOpen: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/");
  },
  play: async ({ canvasElement }) => {
    // Auto-click hamburger to open menu
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      (hamburger as HTMLButtonElement).click();
    }
  },
};

/**
 * Mobile Booking - Services Step
 * Path: /book/services
 * Menu Content: Home link, Breadcrumbs section, Theme toggle
 */
export const MobileBookingServices: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/book/services",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/book/services");
  },
  play: async ({ canvasElement }) => {
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      (hamburger as HTMLButtonElement).click();
    }
  },
};

/**
 * Mobile Booking - Date & Time Step
 * Path: /book/datetime
 * Shows breadcrumb progress in mobile menu
 */
export const MobileBookingDateTime: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/book/datetime",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/book/datetime");
  },
  play: async ({ canvasElement }) => {
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      (hamburger as HTMLButtonElement).click();
    }
  },
};

/**
 * Mobile Booking - Details Step
 * Path: /book/details
 */
export const MobileBookingDetails: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/book/details",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/book/details");
  },
  play: async ({ canvasElement }) => {
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      (hamburger as HTMLButtonElement).click();
    }
  },
};

/**
 * Mobile Booking - Payment Step
 * Path: /book/payment
 */
export const MobileBookingPayment: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/book/payment",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/book/payment");
  },
  play: async ({ canvasElement }) => {
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      (hamburger as HTMLButtonElement).click();
    }
  },
};

/**
 * Mobile Booking - Confirmation
 * Path: /book/confirmation
 */
export const MobileBookingConfirmation: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/book/confirmation",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/book/confirmation");
  },
  play: async ({ canvasElement }) => {
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      (hamburger as HTMLButtonElement).click();
    }
  },
};

/**
 * Mobile Admin - Dashboard
 * Session: Authenticated admin
 * Menu Content: Home, Admin section (with AdminDropdown), Theme toggle
 */
export const MobileAdmin: Story = {
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: { id: "admin-1", email: "admin@truflow.test" },
          expires: "2025-12-31",
        }}
      >
        <Story />
      </SessionProvider>
    ),
  ],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/admin",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/admin");
  },
  play: async ({ canvasElement }) => {
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      (hamburger as HTMLButtonElement).click();
    }
  },
};

/**
 * Mobile Admin - Services
 * Path: /admin/services
 */
export const MobileAdminServices: Story = {
  decorators: [
    (Story) => (
      <SessionProvider
        session={{
          user: { id: "admin-1", email: "admin@truflow.test" },
          expires: "2025-12-31",
        }}
      >
        <Story />
      </SessionProvider>
    ),
  ],
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/admin/services",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/admin/services");
  },
  play: async ({ canvasElement }) => {
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      (hamburger as HTMLButtonElement).click();
    }
  },
};

/**
 * Tablet Home
 * Viewport: 768px (breakpoint transition)
 * Should show desktop layout (no hamburger)
 */
export const TabletHome: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/");
  },
};

/**
 * Tablet Booking
 * Viewport: 768px
 * Should show breadcrumbs in center nav (no hamburger)
 */
export const TabletBooking: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
    nextjs: {
      navigation: {
        pathname: "/book/services",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/book/services");
  },
};

/**
 * Small Mobile (320px)
 * Smallest supported viewport per FR-004
 */
export const SmallMobileHome: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/");
  },
};

/**
 * Hamburger Animation Showcase
 * Shows closed → open → closed transition
 */
export const HamburgerAnimation: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/");
  },
  play: async ({ canvasElement }) => {
    const hamburger = canvasElement.querySelector('[data-testid="hamburger-button"]');
    if (hamburger) {
      // Open menu
      (hamburger as HTMLButtonElement).click();

      // Wait 500ms
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Close menu
      (hamburger as HTMLButtonElement).click();
    }
  },
};
