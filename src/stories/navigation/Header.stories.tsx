import type { Meta, StoryObj } from "@storybook/react";
import { Header } from "../../src/components/Header";
import { usePathname } from "next/navigation";

// Mock next/navigation
const meta: Meta<typeof Header> = {
  title: "Navigation/Header",
  component: Header,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Context-aware navigation header that adapts based on user journey. Implements the Unified Navigation specification (001-unified-navigation).",
      },
    },
  },
  decorators: [
    (Story, context) => {
      // Mock usePathname based on story args
      const mockPathname = context.args.pathname || "/";

      // Override the mock
      if (typeof usePathname === "function") {
        (usePathname as any).mockReturnValue?.(mockPathname);
      }

      return (
        <div className="bg-background min-h-screen">
          <Story />
          <div className="p-8">
            <p className="text-sm text-neutral-500">
              Current path: <code className="bg-surface rounded px-2 py-1">{mockPathname}</code>
            </p>
          </div>
        </div>
      );
    },
  ],
  argTypes: {
    pathname: {
      control: "select",
      options: ["/", "/book", "/book/time", "/book/details", "/book/payment", "/book/confirmation"],
      description: "Simulated pathname for testing different states",
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

/**
 * Home Page State
 * - Logo + Company Name
 * - No breadcrumbs
 * - No "Book Appointment" or "Admin" buttons
 * - Theme toggle in top-right
 */
export const HomePage: Story = {
  args: {
    pathname: "/",
  },
};

/**
 * Booking Flow - Services Step
 * - Shows breadcrumbs: Home > Services
 * - Logo links to home
 */
export const BookingServices: Story = {
  args: {
    pathname: "/book",
  },
};

/**
 * Booking Flow - Date & Time Step
 * - Shows breadcrumbs: Home > Date & Time
 */
export const BookingDateTime: Story = {
  args: {
    pathname: "/book/time",
  },
};

/**
 * Booking Flow - Details Step
 * - Shows breadcrumbs: Home > Details
 */
export const BookingDetails: Story = {
  args: {
    pathname: "/book/details",
  },
};

/**
 * Booking Flow - Payment Step
 * - Shows breadcrumbs: Home > Payment
 */
export const BookingPayment: Story = {
  args: {
    pathname: "/book/payment",
  },
};

/**
 * Booking Flow - Confirmation Step
 * - Shows breadcrumbs: Home > Confirmation
 */
export const BookingConfirmation: Story = {
  args: {
    pathname: "/book/confirmation",
  },
};

/**
 * Mobile Viewport - Home
 * Test at 320px width
 */
export const MobileHome: Story = {
  args: {
    pathname: "/",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};

/**
 * Mobile Viewport - Booking with Truncation
 * Breadcrumbs should show: Home > ... > Payment
 */
export const MobileBooking: Story = {
  args: {
    pathname: "/book/payment",
  },
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
  },
};
