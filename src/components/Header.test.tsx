import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/Header";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignOut = vi.fn();

let mockPathname = "/";
let mockSessionStatus: "loading" | "authenticated" | "unauthenticated" = "unauthenticated";
let mockSessionUser: { email: string } | null = null;

vi.mock("next/image", () => ({
  default: () => <span>Logo</span>,
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
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

  it("shows admin functions in hamburger menu for admin users", () => {
    mockPathname = "/admin/services";
    mockSessionStatus = "authenticated";
    mockSessionUser = { email: "admin@truflow.test" };

    render(<Header />);

    fireEvent.click(screen.getAllByTestId("hamburger-button")[0]);

    expect(screen.getByText("Admin")).toBeInTheDocument();
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Bookings")).toBeInTheDocument();
    expect(screen.getByText("Services")).toBeInTheDocument();
    expect(screen.getByText("Availability")).toBeInTheDocument();
    expect(screen.getByText("Sign out")).toBeInTheDocument();
  });

  it("signs admin out from hamburger menu", async () => {
    mockPathname = "/admin";
    mockSessionStatus = "authenticated";
    mockSessionUser = { email: "admin@truflow.test" };
    mockSignOut.mockResolvedValue(undefined);

    render(<Header />);

    fireEvent.click(screen.getAllByTestId("hamburger-button")[0]);
    await act(async () => {
      fireEvent.click(screen.getByText("Sign out"));
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
