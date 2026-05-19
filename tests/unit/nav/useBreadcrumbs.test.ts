import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useBreadcrumbs } from "../../../src/lib/nav/useBreadcrumbs";

// Mock Next.js navigation
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(),
}));

describe("useBreadcrumbs", () => {
  it("returns null when not in booking flow", () => {
    vi.mocked(usePathname).mockReturnValue("/");
    const { result } = renderHook(() => useBreadcrumbs());
    expect(result.current).toBeNull();
  });

  it("returns null for admin pages", () => {
    vi.mocked(usePathname).mockReturnValue("/admin/services");
    const { result } = renderHook(() => useBreadcrumbs());
    expect(result.current).toBeNull();
  });

  it("returns breadcrumbs for /book (Services step)", () => {
    vi.mocked(usePathname).mockReturnValue("/book");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(2);
    expect(result.current?.[0]).toMatchObject({
      label: "Home",
      href: "/",
      current: false,
      priority: 0,
      icon: "home",
    });
    expect(result.current?.[1]).toMatchObject({
      label: "Services",
      href: "/book",
      current: true,
      priority: 1,
      icon: "book",
    });
  });

  it("returns breadcrumbs for /book/[serviceId] (Booking session page)", () => {
    vi.mocked(usePathname).mockReturnValue("/book/550e8400-e29b-41d4-a716-446655440000");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(3);
    expect(result.current?.[0]).toMatchObject({
      label: "Home",
      href: "/",
      current: false,
      icon: "home",
    });
    expect(result.current?.[1]).toMatchObject({
      label: "Booking",
      href: "/book",
      current: false,
      icon: "book",
    });
    expect(result.current?.[2]).toMatchObject({
      label: "Session",
      current: true,
      icon: "book",
    });
  });

  it("returns breadcrumbs for /book/success (Confirmation page)", () => {
    vi.mocked(usePathname).mockReturnValue("/book/success");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(2);
    expect(result.current?.[0]).toMatchObject({
      label: "Home",
      href: "/",
      current: false,
      priority: 0,
      icon: "home",
    });
    expect(result.current?.[1]).toMatchObject({
      label: "Confirmation",
      href: "/book/success",
      current: true,
      priority: 5,
      icon: "checkmark",
    });
  });

  it("prioritizes Home (0) for mobile truncation", () => {
    vi.mocked(usePathname).mockReturnValue("/book/success");
    const { result } = renderHook(() => useBreadcrumbs());

    // Home should have priority 0 (highest)
    expect(result.current?.[0].priority).toBe(0);
    // Current step should have lower priority
    expect(result.current?.[1].priority).toBeGreaterThan(0);
  });

  it("marks only the current step as current", () => {
    vi.mocked(usePathname).mockReturnValue("/book/550e8400-e29b-41d4-a716-446655440000");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current?.[0].current).toBe(false);
    expect(result.current?.[1].current).toBe(false);
    expect(result.current?.[2].current).toBe(true);
  });

  it("provides correct icons for navigation", () => {
    vi.mocked(usePathname).mockReturnValue("/book/550e8400-e29b-41d4-a716-446655440000");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current?.[0].icon).toBe("home");
    expect(result.current?.[1].icon).toBe("book");
    expect(result.current?.[2].icon).toBe("book");
  });

  it("uses checkmark icon for confirmation page", () => {
    vi.mocked(usePathname).mockReturnValue("/book/success");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current?.[0].icon).toBe("home");
    expect(result.current?.[1].icon).toBe("checkmark");
  });
});
