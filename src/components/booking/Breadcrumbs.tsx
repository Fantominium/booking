"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useBreadcrumbs } from "../../lib/nav/useBreadcrumbs";

/**
 * Breadcrumbs Component
 *
 * Displays navigation breadcrumbs during the booking flow.
 * Features:
 * - Auto-truncates on mobile (320px): Home > ... > Current
 * - Maintains WCAG 2.2 AA contrast ratios
 * - Semantic HTML with aria-label for accessibility
 *
 * Usage:
 * - Automatically shows/hides based on current path
 * - No props needed - driven by usePathname() internally
 */
export function Breadcrumbs(): React.ReactElement | null {
  const segments = useBreadcrumbs();

  // Don't render if no breadcrumbs (not in booking flow)
  if (!segments) {
    return null;
  }

  // Mobile truncation: Show only Home and Current when space constrained
  const shouldTruncate = segments.length > 2;

  return (
    <nav aria-label="Breadcrumb" className="flex items-center">
      <ol className="flex items-center space-x-2">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const isFirst = index === 0;

          // Mobile truncation logic: show first and last, hide middle
          const hideOnMobile = shouldTruncate && !isFirst && !isLast;

          return (
            <li
              key={segment.href}
              className={`flex items-center ${hideOnMobile ? "hidden sm:flex" : "flex"}`}
            >
              {index > 0 && (
                <ChevronRight className="mr-2 h-4 w-4 text-neutral-400" aria-hidden="true" />
              )}

              {isLast ? (
                <span className="text-foreground font-medium" aria-current="page">
                  {segment.label}
                </span>
              ) : (
                <Link
                  href={segment.href}
                  className="hover:text-foreground text-neutral-600 transition-colors"
                >
                  {segment.label}
                </Link>
              )}
            </li>
          );
        })}

        {/* Ellipsis for truncated middle items on mobile */}
        {shouldTruncate && (
          <li className="flex items-center sm:hidden">
            <ChevronRight className="mr-2 h-4 w-4 text-neutral-400" aria-hidden="true" />
            <span className="text-neutral-400" aria-hidden="true">
              ...
            </span>
          </li>
        )}
      </ol>
    </nav>
  );
}
