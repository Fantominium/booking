import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { ThemeToggle } from "../../../src/components/ThemeToggle";

// Mock ThemeProvider
const mockSetTheme = vi.fn();
const mockUseTheme = vi.fn();

vi.mock("../../../src/components/ThemeProvider", () => ({
  useTheme: () => mockUseTheme(),
}));

describe("ThemeToggle - Accessibility & Contrast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("High Contrast Requirements (FR-008)", () => {
    it("renders with accessible label", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeToggle />);

      const toggle = screen.getByRole("button");
      expect(toggle).toHaveAccessibleName(/switch to dark mode/i);
    });

    it("updates accessible label based on current theme", () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
      });

      render(<ThemeToggle />);

      const toggle = screen.getByRole("button");
      expect(toggle).toHaveAccessibleName(/switch to light mode/i);
    });

    it("applies high-contrast color classes for light mode", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      const { container } = render(<ThemeToggle />);

      // Icon should use theme-light or theme-dark color
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-theme-dark"); // Moon icon in light mode
    });

    it("applies high-contrast color classes for dark mode", () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
      });

      const { container } = render(<ThemeToggle />);

      // Icon should use high-contrast color
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
      expect(svg).toHaveClass("text-theme-light"); // Sun icon in dark mode
    });
  });

  describe("WCAG 2.2 AA Compliance", () => {
    it("has minimum touch target size (44x44px)", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeToggle />);

      const toggle = screen.getByRole("button");
      // Check for min-h-11 and min-w-11 classes (44px)
      expect(toggle).toHaveClass("min-h-11");
      expect(toggle).toHaveClass("min-w-11");
    });

    it("has focus indicator", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeToggle />);

      const toggle = screen.getByRole("button");
      // Should have focus ring styles
      expect(toggle.className).toMatch(/focus:ring/);
    });

    it("has aria-label for screen readers", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeToggle />);

      const toggle = screen.getByRole("button");
      expect(toggle).toHaveAttribute("aria-label");
    });
  });

  describe("Visual States", () => {
    it("renders sun icon in dark mode", () => {
      mockUseTheme.mockReturnValue({
        theme: "dark",
        setTheme: mockSetTheme,
        resolvedTheme: "dark",
      });

      const { container } = render(<ThemeToggle />);

      // Sun icon has specific path for rays
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });

    it("renders moon icon in light mode", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      const { container } = render(<ThemeToggle />);

      // Moon icon has different path
      const svg = container.querySelector("svg");
      expect(svg).toBeInTheDocument();
    });
  });

  describe("Keyboard Accessibility", () => {
    it("is keyboard focusable", () => {
      mockUseTheme.mockReturnValue({
        theme: "light",
        setTheme: mockSetTheme,
        resolvedTheme: "light",
      });

      render(<ThemeToggle />);

      const toggle = screen.getByRole("button");
      expect(toggle).not.toHaveAttribute("tabindex", "-1");
    });
  });
});
