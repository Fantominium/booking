import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/Header";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const mockSignOut = vi.fn();

let mockPathname = "/";
let mockSessionStatus: "loading" | "authenticated" | "unauthenticated" = "unauthenticated";
let mockSessionUser: { email: string; role?: "admin" } | null = null;

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
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
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock("@/components/booking/Breadcrumbs", () => ({
  Breadcrumbs: () => <nav aria-label="Breadcrumb">Breadcrumbs</nav>,
}));

vi.mock("@/components/navigation/AdminDropdown", () => ({
  AdminDropdown: () => <button type="button">Dashboard</button>,
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

  it("renders the TruFlow brand without admin controls for guests", () => {
    render(<Header />);

    expect(screen.getAllByText("TruFlow").length).toBeGreaterThan(0);
    expect(screen.queryByText("Dashboard")).not.toBeInTheDocument();
  });

  it("opens the guest mobile navigation dialog with booking links", () => {
    render(<Header />);

    fireEvent.click(screen.getByTestId("hamburger-button"));

    expect(screen.getByRole("dialog", { name: "Navigation menu" })).toBeInTheDocument();
    expect(screen.getByText("Sessions")).toBeInTheDocument();
    expect(screen.getByText("Events")).toBeInTheDocument();
    expect(screen.getByText("Rentals")).toBeInTheDocument();
  });

  it("shows admin controls on desktop for authenticated admins", () => {
    mockPathname = "/admin";
    mockSessionStatus = "authenticated";
    mockSessionUser = { email: "admin@truflow.test", role: "admin" };

    render(<Header />);

    fireEvent.click(screen.getByTestId("hamburger-button-desktop"));

    expect(screen.getByRole("link", { name: "Dashboard" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Sign out" })).toBeInTheDocument();
  });
});
