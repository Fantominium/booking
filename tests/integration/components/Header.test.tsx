import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { Header } from "../../../src/components/Header";
import { usePathname } from "next/navigation";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
  })),
}));

// Mock next-auth/react
vi.mock("next-auth/react", () => ({
  useSession: vi.fn(() => ({
    data: null,
    status: "unauthenticated",
  })),
  SessionProvider: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock ThemeToggle to simplify testing
vi.mock("../../../src/components/ThemeToggle", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle">Theme Toggle</button>,
}));

describe("Header - State Transitions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Guest User Journey", () => {
    it("renders logo and company name on home page", () => {
      vi.mocked(usePathname).mockReturnValue("/");
      render(<Header />);

      expect(screen.getAllByText("TruFlow").length).toBeGreaterThan(0);
    });

    it("does not render breadcrumbs on home page", () => {
      vi.mocked(usePathname).mockReturnValue("/");
      render(<Header />);

      expect(screen.queryByRole("navigation", { name: /breadcrumb/i })).not.toBeInTheDocument();
    });

    it("does not render 'Book Appointment' button", () => {
      vi.mocked(usePathname).mockReturnValue("/");
      render(<Header />);

      expect(screen.queryByText("Book Appointment")).not.toBeInTheDocument();
    });

    it("does not render 'Admin' link", () => {
      vi.mocked(usePathname).mockReturnValue("/");
      render(<Header />);

      expect(screen.queryByText("Admin")).not.toBeInTheDocument();
    });
  });

  describe("Booking Flow Journey", () => {
    it("renders breadcrumbs when entering booking flow at /book", () => {
      vi.mocked(usePathname).mockReturnValue("/book");
      render(<Header />);

      // Should show breadcrumbs navigation
      const breadcrumbs = screen.queryByRole("navigation", { name: /breadcrumb/i });
      expect(breadcrumbs).toBeInTheDocument();
    });

    it("updates breadcrumbs when progressing through booking steps", () => {
      const { rerender } = render(<Header />);

      // Step 1: Services
      vi.mocked(usePathname).mockReturnValue("/book");
      rerender(<Header />);
      expect(screen.getByText("Services")).toBeInTheDocument();

      // Step 2: Date & Time
      vi.mocked(usePathname).mockReturnValue("/book/time");
      rerender(<Header />);
      expect(screen.getByText("Date & Time")).toBeInTheDocument();

      // Step 3: Details
      vi.mocked(usePathname).mockReturnValue("/book/details");
      rerender(<Header />);
      expect(screen.getByText("Details")).toBeInTheDocument();
    });

    it("maintains logo link to home during booking flow", () => {
      vi.mocked(usePathname).mockReturnValue("/book/payment");
      render(<Header />);

      const logoLinks = screen.getAllByRole("link", { name: /truflow/i });
      logoLinks.forEach((link) => {
        expect(link).toHaveAttribute("href", "/");
      });
    });
  });

  describe("Theme Toggle", () => {
    it("renders theme toggle in all contexts", () => {
      vi.mocked(usePathname).mockReturnValue("/");
      render(<Header />);

      expect(screen.getByTestId("theme-toggle")).toBeInTheDocument();
    });
  });

  describe("Layout Stability", () => {
    it("maintains consistent header height across contexts", () => {
      const { container: homeContainer } = render(<Header />);
      vi.mocked(usePathname).mockReturnValue("/");
      const homeHeader = homeContainer.querySelector("header");
      const homeHeight = homeHeader?.offsetHeight;

      const { unmount } = render(<Header />);
      unmount();

      vi.mocked(usePathname).mockReturnValue("/book");
      const { container: bookingContainer } = render(<Header />);
      const bookingHeader = bookingContainer.querySelector("header");
      const bookingHeight = bookingHeader?.offsetHeight;

      // Header height should be consistent (within 5px tolerance per SC-002)
      expect(Math.abs((homeHeight || 0) - (bookingHeight || 0))).toBeLessThanOrEqual(5);
    });
  });
});
