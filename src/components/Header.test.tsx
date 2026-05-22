import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/Header";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignOut = vi.fn();

let mockPathname = "/";
let mockSessionStatus: "loading" | "authenticated" | "unauthenticated" = "unauthenticated";
let mockSessionUser: { email: string; role: "admin" } | null = null;

vi.mock("next/image", () => ({
  default: () => <span>Logo</span>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    status: mockSessionStatus,
    data: mockSessionUser ? { user: mockSessionUser } : null,
  }),
  signOut: (args: unknown) => mockSignOut(args),
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button type="button">Theme</button>,
}));

vi.mock("@/components/booking/Breadcrumbs", () => ({
  Breadcrumbs: () => <div>Breadcrumbs</div>,
}));

describe("Header", () => {
  beforeEach(() => {
    mockPathname = "/";
    mockSessionStatus = "unauthenticated";
    mockSessionUser = null;
    mockPush.mockReset();
    mockRefresh.mockReset();
    mockSignOut.mockReset();
  });

  it("hides admin menu items for guest users", () => {
    render(<Header />);

    fireEvent.click(screen.getByTestId("hamburger-button"));

    expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
    expect(screen.getByText("Home")).toBeInTheDocument();
  });

  it("shows admin functions in hamburger menu for admin users", async () => {
    mockPathname = "/admin/services";
    mockSessionStatus = "authenticated";
    mockSessionUser = { email: "admin@truflow.test", role: "admin" };

    render(<Header />);

    fireEvent.click(screen.getByTestId("hamburger-button"));

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    const menu = screen.getByTestId("mobile-menu");
    expect(within(menu).getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Bookings" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Services" })).toBeInTheDocument();
    expect(within(menu).getByRole("link", { name: "Availability" })).toBeInTheDocument();
    expect(within(menu).getByRole("button", { name: /sign out/i })).toBeInTheDocument();
  });

  it("highlights only the current admin section", async () => {
    mockPathname = "/admin/bookings";
    mockSessionStatus = "authenticated";
    mockSessionUser = { email: "admin@truflow.test", role: "admin" };

    render(<Header />);

    fireEvent.click(screen.getByTestId("hamburger-button"));

    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });

    const menu = screen.getByTestId("mobile-menu");
    expect(within(menu).getByRole("link", { name: "Bookings" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(within(menu).getByRole("link", { name: "Dashboard" })).not.toHaveAttribute(
      "aria-current",
      "page",
    );
  });

  it("signs admin out from hamburger menu", async () => {
    mockPathname = "/admin";
    mockSessionStatus = "authenticated";
    mockSessionUser = { email: "admin@truflow.test", role: "admin" };
    mockSignOut.mockResolvedValue(undefined);

    render(<Header />);

    fireEvent.click(screen.getByTestId("hamburger-button"));
    await waitFor(() => {
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
    });
    await act(async () => {
      fireEvent.click(
        within(screen.getByTestId("mobile-menu")).getByRole("button", { name: /sign out/i }),
      );
    });

    await vi.waitFor(() => {
      expect(mockSignOut).toHaveBeenCalledWith({
        redirect: false,
        callbackUrl: "/admin/login",
      });
      expect(mockPush).toHaveBeenCalledWith("/admin/login");
      expect(mockRefresh).toHaveBeenCalled();
    });
  });
});
