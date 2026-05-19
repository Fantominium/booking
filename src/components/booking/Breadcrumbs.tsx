"use client";

import Link from "next/link";
import { useBreadcrumbs } from "../../lib/nav/useBreadcrumbs";
import {
  HouseIcon,
  BookIcon,
  CalendarIcon,
  CircleCheckIcon,
  ChevronRightIcon,
} from "./BreadcrumbIcons";

/**
 * Breadcrumbs Component
 *
 * Displays navigation breadcrumbs during the booking flow using accessible stencil icons.
 * Features:
 * - Icon-based navigation: house (home), book (booking), checkmark (confirmation)
 * - Fully accessible with ARIA labels and semantic HTML
 * - Responsive design: icons scale and display on all device sizes
 * - Clear visual hierarchy with visual indicators
 * - Tooltip on hover via title attribute for additional context
 *
 * Navigation:
 * - From booking page: can navigate back to services or home
 * - From confirmation: can navigate to home only
 */
export function Breadcrumbs(): React.ReactElement | null {
  const segments = useBreadcrumbs();

  // Don't render if no breadcrumbs (not in booking flow)
  if (!segments) {
    return null;
  }

  const getIconComponent = (icon: string): React.ComponentType<{ className?: string }> => {
    switch (icon) {
      case "home":
        return HouseIcon;
      case "book":
        return BookIcon;
      case "calendar":
        return CalendarIcon;
      case "checkmark":
        return CircleCheckIcon;
      default:
        return HouseIcon;
    }
  };

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-2 py-2">
      <ol className="flex items-center gap-1 sm:gap-2">
        {segments.map((segment, index) => {
          const isLast = index === segments.length - 1;
          const IconComponent = getIconComponent(segment.icon);

          return (
            <li key={segment.href} className="flex items-center gap-2">
              {index > 0 && (
                <ChevronRightIcon className="h-4 w-4 flex-shrink-0 text-neutral-400 sm:h-5 sm:w-5" />
              )}

              {isLast ? (
                <span
                  className="text-foreground flex items-center rounded-md p-1.5 sm:p-2"
                  aria-current="page"
                  aria-label={`${segment.label} — current page`}
                  title={segment.label}
                >
                  <IconComponent className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" />
                </span>
              ) : (
                <Link
                  href={segment.href}
                  aria-label={segment.label}
                  title={segment.label}
                  className="hover:text-foreground flex items-center rounded-md p-1.5 text-neutral-500 transition-colors hover:bg-neutral-100 focus:ring-2 focus:ring-slate-300 focus:ring-offset-1 focus:outline-none sm:p-2"
                >
                  <IconComponent className="h-5 w-5 flex-shrink-0 sm:h-6 sm:w-6" />
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
