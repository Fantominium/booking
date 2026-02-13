/**
 * Storybook Stories: Admin Header States
 *
 * Visual documentation for Header component in authenticated admin sessions.
 *
 * Stories:
 * - AdminDashboard: /admin root with "Dashboard" button
 * - AdminServices: /admin/services with "Services" button
 * - AdminBookings: /admin/bookings with "Bookings" button
 * - AdminAvailability: /admin/availability with "Availability" button
 * - AdminDropdownExpanded: Dropdown menu open showing all sections
 * - MobileAdminDashboard: Mobile view with admin dropdown
 */

import type { Meta, StoryObj } from "@storybook/react";
import { SessionProvider } from "next-auth/react";
import { Header } from "@/components/Header";

// Mock usePathname
const mockPathname = (path: string) => {
  const { usePathname } = require("next/navigation");
  usePathname.mockReturnValue(path);
};

// Mock session for authenticated admin
const mockSession = {
  user: {
    id: "admin-1",
    email: "admin@truflow.test",
  },
  expires: "2025-12-31",
};

const meta: Meta<typeof Header> = {
  title: "Navigation/Header/Admin",
  component: Header,
  decorators: [
    (Story) => (
      <SessionProvider session={mockSession}>
        <Story />
      </SessionProvider>
    ),
  ],
  parameters: {
    layout: "fullscreen",
    nextjs: {
      appDirectory: true,
      navigation: {
        pathname: "/admin",
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof Header>;

/**
 * Admin Dashboard - Default State
 * Path: /admin
 * Button: "Dashboard"
 */
export const AdminDashboard: Story = {
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
};

/**
 * Admin Services
 * Path: /admin/services
 * Button: "Services"
 */
export const AdminServices: Story = {
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
};

/**
 * Admin Bookings
 * Path: /admin/bookings
 * Button: "Bookings"
 */
export const AdminBookings: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/admin/bookings",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/admin/bookings");
  },
};

/**
 * Admin Availability
 * Path: /admin/availability
 * Button: "Availability"
 */
export const AdminAvailability: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: "/admin/availability",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/admin/availability");
  },
};

/**
 * Admin Dropdown Expanded
 * Path: /admin
 * State: Dropdown menu open
 *
 * Note: Storybook cannot directly control component state.
 * This story documents the expanded state visually.
 * To interact: Click the "Dashboard" button in Storybook canvas.
 */
export const AdminDropdownExpanded: Story = {
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
    // Auto-click dropdown button to show expanded state
    const button = canvasElement.querySelector('button[aria-haspopup="menu"]');
    if (button) {
      (button as HTMLButtonElement).click();
    }
  },
};

/**
 * Mobile Admin Dashboard
 * Viewport: 320px (mobile)
 * Layout: Logo top-left, Admin dropdown centered below header
 */
export const MobileAdminDashboard: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
    nextjs: {
      navigation: {
        pathname: "/admin",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/admin");
  },
};

/**
 * Mobile Admin Services
 * Viewport: 320px
 * Button: "Services"
 */
export const MobileAdminServices: Story = {
  parameters: {
    viewport: {
      defaultViewport: "mobile",
    },
    nextjs: {
      navigation: {
        pathname: "/admin/services",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/admin/services");
  },
};

/**
 * Tablet Admin Dashboard
 * Viewport: 768px
 */
export const TabletAdminDashboard: Story = {
  parameters: {
    viewport: {
      defaultViewport: "tablet",
    },
    nextjs: {
      navigation: {
        pathname: "/admin",
      },
    },
  },
  beforeEach: () => {
    mockPathname("/admin");
  },
};
