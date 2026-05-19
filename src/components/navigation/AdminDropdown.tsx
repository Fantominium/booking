/**
 * AdminDropdown Component
 *
 * Renders a dropdown navigation for authenticated admin sessions.
 * Button text updates based on current admin subpath (Dashboard, Services, Bookings, Availability).
 *
 * Requirements:
 * - FR-016: Button shows current section name
 * - FR-017: Dropdown contains 4 sections (Dashboard, Services, Bookings, Availability)
 * - SC-004: Keyboard accessible (Arrow keys, Tab, Escape)
 * - WCAG 2.2 AA: aria-expanded, aria-haspopup, role="navigation"
 */

/* eslint-disable react/no-unescaped-entities */

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown } from "lucide-react";

interface AdminSection {
  label: string;
  href: string;
}

const ADMIN_SECTIONS: AdminSection[] = [
  { label: "Dashboard", href: "/admin" },
  { label: "Services", href: "/admin/services" },
  { label: "Bookings", href: "/admin/bookings" },
  { label: "Availability", href: "/admin/availability" },
];

export const AdminDropdown = (): JSX.Element => {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);

  // Determine current section based on pathname
  const getCurrentSection = (): string => {
    const section = ADMIN_SECTIONS.find((s) => {
      if (s.href === "/admin") {
        return pathname === "/admin";
      }
      return pathname?.startsWith(s.href);
    });
    return section?.label ?? "Dashboard";
  };

  const currentSection = getCurrentSection();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLButtonElement>): void => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setIsOpen(true);
      // Focus first link after state update
      setTimeout(() => {
        firstLinkRef.current?.focus();
      }, 0);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setIsOpen(false);
      buttonRef.current?.focus();
    }
  }, []);

  const handleLinkClick = useCallback((): void => {
    setIsOpen(false);
  }, []);

  const handleButtonClick = useCallback((): void => {
    setIsOpen((prev) => !prev);
  }, []);

  const renderSection = useCallback(
    (section: AdminSection, index: number): JSX.Element => {
      const isCurrent =
        pathname === section.href ||
        (section.href !== "/admin" && pathname?.startsWith(section.href));

      const linkRef = index === 0 ? firstLinkRef : undefined;
      const ariaCurrent = isCurrent ? ("page" as const) : undefined;
      const linkClassName = `block px-4 py-2 text-sm hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset dark:hover:bg-gray-700 ${
        isCurrent
          ? "bg-gray-100 font-semibold text-gray-900 dark:bg-gray-700 dark:text-gray-100"
          : "text-gray-700 dark:text-gray-300"
      }`;

      return (
        <li key={section.href}>
          <Link
            ref={linkRef}
            href={section.href}
            onClick={handleLinkClick}
            aria-current={ariaCurrent}
            className={linkClassName}
          >
            {section.label}
          </Link>
        </li>
      );
    },
    [pathname, handleLinkClick],
  );

  const chevronClassName = isOpen
    ? "lucide-chevron-down h-4 w-4 transition-transform duration-200 rotate-180"
    : "lucide-chevron-down h-4 w-4 transition-transform duration-200";

  return (
    <div ref={dropdownRef} className="relative">
      <button
        ref={buttonRef}
        onClick={handleButtonClick}
        onKeyDown={handleKeyDown}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className="flex min-h-11 min-w-11 items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100 dark:hover:bg-gray-700"
        type="button"
      >
        <span>{currentSection}</span>
        <ChevronDown className={chevronClassName} aria-hidden="true" />
      </button>

      {isOpen && (
        <nav
          role="navigation"
          aria-label="Admin navigation"
          className="absolute right-0 z-10 mt-2 w-48 rounded-md border border-gray-300 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800"
        >
          <ul className="py-1">{ADMIN_SECTIONS.map(renderSection)}</ul>
        </nav>
      )}
    </div>
  );
};
