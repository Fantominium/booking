/**
 * Unit tests for AdminDropdown component
 *
 * Verifies:
 * - FR-016: Dropdown button updates text based on current admin subpath
 * - FR-017: Dropdown contains 4 sections: Dashboard, Services, Bookings, Availability
 * - Accessibility: keyboard navigation, aria-expanded, role="navigation"
 */

import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { AdminDropdown } from "@/components/navigation/AdminDropdown";

// Mock next/navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
  })),
}));

describe("AdminDropdown", () => {
  describe("Button Text Updates", () => {
    it('should show "Dashboard" on /admin root path', () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button", { name: /dashboard/i });
      expect(button).toBeInTheDocument();
      expect(button.textContent).toContain("Dashboard");
    });

    it('should show "Services" on /admin/services', () => {
      vi.mocked(usePathname).mockReturnValue("/admin/services");
      render(<AdminDropdown />);

      const button = screen.getByRole("button", { name: /services/i });
      expect(button.textContent).toContain("Services");
    });

    it('should show "Bookings" on /admin/bookings', () => {
      vi.mocked(usePathname).mockReturnValue("/admin/bookings");
      render(<AdminDropdown />);

      const button = screen.getByRole("button", { name: /bookings/i });
      expect(button.textContent).toContain("Bookings");
    });

    it('should show "Availability" on /admin/availability', () => {
      vi.mocked(usePathname).mockReturnValue("/admin/availability");
      render(<AdminDropdown />);

      const button = screen.getByRole("button", { name: /availability/i });
      expect(button.textContent).toContain("Availability");
    });

    it('should default to "Dashboard" for unknown admin paths', () => {
      vi.mocked(usePathname).mockReturnValue("/admin/settings");
      render(<AdminDropdown />);

      const button = screen.getByRole("button", { name: /dashboard/i });
      expect(button.textContent).toContain("Dashboard");
    });
  });

  describe("Dropdown Menu Structure", () => {
    it("should render 4 navigation links when expanded", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      // FR-017: Dashboard, Services, Bookings, Availability
      expect(screen.getByRole("link", { name: /^dashboard$/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /^services$/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /^bookings$/i })).toBeInTheDocument();
      expect(screen.getByRole("link", { name: /^availability$/i })).toBeInTheDocument();
    });

    it("should have correct hrefs for all links", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      fireEvent.click(screen.getByRole("button"));

      expect(screen.getByRole("link", { name: /^dashboard$/i })).toHaveAttribute("href", "/admin");
      expect(screen.getByRole("link", { name: /^services$/i })).toHaveAttribute(
        "href",
        "/admin/services",
      );
      expect(screen.getByRole("link", { name: /^bookings$/i })).toHaveAttribute(
        "href",
        "/admin/bookings",
      );
      expect(screen.getByRole("link", { name: /^availability$/i })).toHaveAttribute(
        "href",
        "/admin/availability",
      );
    });

    it("should highlight current section in dropdown", () => {
      vi.mocked(usePathname).mockReturnValue("/admin/services");
      render(<AdminDropdown />);

      fireEvent.click(screen.getByRole("button"));

      const servicesLink = screen.getByRole("link", { name: /^services$/i });
      // Current item should have aria-current or different styling
      expect(servicesLink).toHaveAttribute("aria-current", "page");
    });
  });

  describe("Accessibility", () => {
    it('should have aria-expanded="false" when collapsed', () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it('should have aria-expanded="true" when expanded', () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      expect(button).toHaveAttribute("aria-expanded", "true");
    });

    it('should have aria-haspopup="menu"', () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      expect(button).toHaveAttribute("aria-haspopup", "menu");
    });

    it("should support keyboard navigation with Arrow Down", async () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      button.focus();
      fireEvent.keyDown(button, { key: "ArrowDown" });

      // Should expand and focus first item
      expect(button).toHaveAttribute("aria-expanded", "true");
      const firstLink = screen.getByRole("link", { name: /^dashboard$/i });
      await waitFor(() => {
        expect(firstLink).toHaveFocus();
      });
    });

    it("should close dropdown on Escape key", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      fireEvent.keyDown(button, { key: "Escape" });
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it('should have role="navigation" on dropdown container', () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      fireEvent.click(screen.getByRole("button"));

      const nav = screen.getByRole("navigation");
      expect(nav).toBeInTheDocument();
      expect(nav).toHaveAttribute("aria-label", "Admin navigation");
    });

    it("should meet 44x44px minimum touch target for button", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");

      // Tailwind classes: min-h-11 min-w-11 = 44px
      expect(button.className).toMatch(/min-h-11/);
      expect(button.className).toMatch(/min-w-11/);
    });
  });

  describe("Dropdown State Management", () => {
    it("should toggle dropdown on button click", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");

      // Initially collapsed
      expect(button).toHaveAttribute("aria-expanded", "false");

      // Click to expand
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      // Click to collapse
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("should close dropdown when clicking outside", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      const { container } = render(<AdminDropdown />);

      const button = screen.getByRole("button");
      fireEvent.click(button);
      expect(button).toHaveAttribute("aria-expanded", "true");

      // Click outside
      fireEvent.mouseDown(container);
      expect(button).toHaveAttribute("aria-expanded", "false");
    });

    it("should close dropdown after selecting a link", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      fireEvent.click(button);

      const servicesLink = screen.getByRole("link", { name: /^services$/i });
      fireEvent.click(servicesLink);

      // After navigation, dropdown should close
      expect(button).toHaveAttribute("aria-expanded", "false");
    });
  });

  describe("Down Arrow Icon", () => {
    it("should render ChevronDown icon from lucide-react", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      const svg = button.querySelector("svg");

      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("lucide-chevron-down");
    });

    it("should rotate arrow when expanded", () => {
      vi.mocked(usePathname).mockReturnValue("/admin");
      render(<AdminDropdown />);

      const button = screen.getByRole("button");
      const svg = button.querySelector("svg");

      // Initially down (0deg or no transform)
      expect(svg).not.toHaveClass("rotate-180");

      // Expanded - arrow points up (180deg)
      fireEvent.click(button);
      expect(svg).toHaveClass("rotate-180");
    });
  });
});
