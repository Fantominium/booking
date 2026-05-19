import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Header } from "@/components/Header";

let mockPathname = "/";

vi.mock("next/image", () => ({
  default: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} {...props} />
  ),
}));

vi.mock("next/navigation", () => ({
  usePathname: () => mockPathname,
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

vi.mock("next-auth/react", () => ({
  useSession: () => ({
    data: null,
    status: "unauthenticated",
  }),
}));

vi.mock("@/components/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme</button>,
}));

vi.mock("@/components/booking/Breadcrumbs", () => ({
  Breadcrumbs: () => <nav aria-label="Breadcrumb">Booking progress</nav>,
}));

vi.mock("@/components/navigation/AdminDropdown", () => ({
  AdminDropdown: () => <button type="button">Dashboard</button>,
}));

describe("Header mobile navigation", () => {
  beforeEach(() => {
    mockPathname = "/";
  });

  it("toggles the mobile dialog and updates aria-expanded", () => {
    render(<Header />);

    const trigger = screen.getByTestId("hamburger-button");
    expect(trigger).toHaveAttribute("aria-expanded", "false");

    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("dialog", { name: "Navigation menu" })).toBeInTheDocument();
  });

  it("shows booking progress in the dialog while on booking routes", () => {
    mockPathname = "/book";
    render(<Header />);

    fireEvent.click(screen.getByTestId("hamburger-button"));

    const dialog = screen.getByRole("dialog", { name: "Navigation menu" });
    expect(within(dialog).getByRole("navigation", { name: "Breadcrumb" })).toBeInTheDocument();
  });

  it("closes the dialog when escape is pressed", () => {
    render(<Header />);

    const trigger = screen.getByTestId("hamburger-button");
    fireEvent.click(trigger);
    fireEvent.keyDown(document, { key: "Escape" });

    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
