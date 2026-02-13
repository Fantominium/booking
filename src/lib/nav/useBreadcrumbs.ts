"use client";

import { usePathname } from "next/navigation";
import { useMemo } from "react";

export interface NavSegment {
  label: string;
  href: string;
  current: boolean;
  priority: number; // Lower = higher priority (kept during truncation)
}

/**
 * Maps booking flow paths to breadcrumb segments
 * Following the spec: Home > Services > Date & Time > Details > Payment > Confirmation
 */
const BOOKING_FLOW_SEGMENTS: Record<string, { label: string; priority: number }> = {
  "/book": { label: "Services", priority: 1 },
  "/book/time": { label: "Date & Time", priority: 2 },
  "/book/details": { label: "Details", priority: 3 },
  "/book/payment": { label: "Payment", priority: 4 },
  "/book/confirmation": { label: "Confirmation", priority: 5 },
};

/**
 * Custom hook to generate breadcrumbs based on the current path
 *
 * Rules:
 * - Only displays during booking flow (paths starting with /book)
 * - Always includes "Home" as first segment
 * - Maps current path to appropriate label
 * - Priority used for mobile truncation (Home > ... > Current)
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
      },
    ];

    // Find the matching booking step
    const stepInfo = BOOKING_FLOW_SEGMENTS[pathname as keyof typeof BOOKING_FLOW_SEGMENTS];
    if (stepInfo) {
      segments.push({
        label: stepInfo.label,
        href: pathname,
        current: true,
        priority: stepInfo.priority,
      });
    }

    return segments;
  }, [pathname]);
}
