"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export interface NavSegment {
  label: string;
  href: string;
  current: boolean;
  priority: number; // Lower = higher priority (kept during truncation)
  icon: "home" | "book" | "calendar" | "checkmark";
}

/**
 * Maps booking flow paths to breadcrumb segments with icon types
 * Following the spec: Home > Services > Date & Time > Details > Payment > Confirmation
 */
const BOOKING_FLOW_SEGMENTS: Record<
  string,
  { label: string; priority: number; icon: "home" | "book" | "checkmark" }
> = {
  "/book": { label: "Services", priority: 1, icon: "book" },
  "/book/success": { label: "Confirmation", priority: 5, icon: "checkmark" },
};

/**
 * Map service pages to booking icon
 * /book/[serviceId] represents the session/booking page
 */
const isServicePage = (pathname: string): boolean => {
  return /^\/book\/[a-f0-9-]+$/.test(pathname) && !pathname.endsWith("/success");
};

/**
 * Custom hook to generate breadcrumbs based on the current path
 *
 * Rules:
 * - Only displays during booking flow (paths starting with /book)
 * - Always includes "Home" as first segment
 * - Maps current path to appropriate label and icon
 * - Priority used for mobile truncation (Home > ... > Current)
 * - Navigation logic:
 *   - From service page: can go back to services list or home
 *   - From confirmation: can only go home
 */
export function useBreadcrumbs(): NavSegment[] | null {
  const pathname = usePathname();

  return useMemo(() => {
    // Only show breadcrumbs during booking flow
    if (!pathname?.startsWith("/book")) {
      return null;
    }

    const segments: NavSegment[] = [
      {
        label: "Home",
        href: "/",
        current: false,
        priority: 0, // Highest priority - always shown
        icon: "home",
      },
    ];

    // Check for confirmation page first
    if (pathname === "/book/success") {
      segments.push({
        label: "Confirmation",
        href: pathname,
        current: true,
        priority: 5,
        icon: "checkmark",
      });
      return segments;
    }

    // Check if it's a service page (booking session)
    if (isServicePage(pathname)) {
      segments.push({
        label: "Booking",
        href: "/book",
        current: false,
        priority: 1,
        icon: "book",
      });
      segments.push({
        label: "Session",
        href: pathname,
        current: true,
        priority: 2,
        icon: "calendar",
      });
      return segments;
    }

    // Check for services list page
    const stepInfo = BOOKING_FLOW_SEGMENTS[pathname as keyof typeof BOOKING_FLOW_SEGMENTS];
    if (stepInfo) {
      segments.push({
        label: stepInfo.label,
        href: pathname,
        current: true,
        priority: stepInfo.priority,
        icon: stepInfo.icon,
      });
    }

    return segments;
  }, [pathname]);
}
