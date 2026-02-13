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
    });
    expect(result.current?.[1]).toMatchObject({
      label: "Services",
      href: "/book",
      current: true,
      priority: 1,
    });
  });

  it("returns breadcrumbs for /book/time (Date & Time step)", () => {
    vi.mocked(usePathname).mockReturnValue("/book/time");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(2);
    expect(result.current?.[1]).toMatchObject({
      label: "Date & Time",
      href: "/book/time",
      current: true,
      priority: 2,
    });
  });

  it("returns breadcrumbs for /book/details (Details step)", () => {
    vi.mocked(usePathname).mockReturnValue("/book/details");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(2);
    expect(result.current?.[1]).toMatchObject({
      label: "Details",
      href: "/book/details",
      current: true,
      priority: 3,
    });
  });

  it("returns breadcrumbs for /book/payment (Payment step)", () => {
    vi.mocked(usePathname).mockReturnValue("/book/payment");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(2);
    expect(result.current?.[1]).toMatchObject({
      label: "Payment",
      href: "/book/payment",
      current: true,
      priority: 4,
    });
  });

  it("returns breadcrumbs for /book/confirmation (Confirmation step)", () => {
    vi.mocked(usePathname).mockReturnValue("/book/confirmation");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current).toHaveLength(2);
    expect(result.current?.[1]).toMatchObject({
      label: "Confirmation",
      href: "/book/confirmation",
      current: true,
      priority: 5,
    });
  });

  it("prioritizes Home (0) for mobile truncation", () => {
    vi.mocked(usePathname).mockReturnValue("/book/confirmation");
    const { result } = renderHook(() => useBreadcrumbs());

    // Home should have priority 0 (highest)
    expect(result.current?.[0].priority).toBe(0);
    // Current step should have lower priority
    expect(result.current?.[1].priority).toBeGreaterThan(0);
  });

  it("marks only the current step as current", () => {
    vi.mocked(usePathname).mockReturnValue("/book/time");
    const { result } = renderHook(() => useBreadcrumbs());

    expect(result.current?.[0].current).toBe(false);
    expect(result.current?.[1].current).toBe(true);
  });
});
