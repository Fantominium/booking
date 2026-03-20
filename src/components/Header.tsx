"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import { Breadcrumbs } from "./booking/Breadcrumbs";
import { HamburgerIcon } from "./navigation/HamburgerIcon";

/**
 * Unified Navigation Header Component
 *
 * Context-aware header that adapts based on user journey:
 * - Home page (guest): Logo + Company Name + Theme Toggle (Desktop) | Hamburger + Logo/Name (Mobile)
 * - Booking flow: Logo + Breadcrumbs + Theme Toggle (Desktop) | Hamburger + Logo/Name (Mobile)
 * - Admin (authenticated): Logo + Admin Dropdown + Theme Toggle
 *
 * Mobile Layout (US4):
 * - Hamburger icon on LEFT
 * - Logo + Company Name on RIGHT
 * - Uses flex-row-reverse for visual ordering
 *
 * Features:
 * - Removes "Book Appointment" and "Admin" buttons per spec
 * - Logo always links to home
 * - Identity Protection (SC-002): Admin navigation hidden from guest sessions
 * - Maintains consistent height across contexts (±5px)
 * - WCAG 2.2 AA compliant
 * - Animated hamburger → X transition (R-001)
 */
export function Header(): React.ReactElement {
  const router = useRouter();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdmin = status === "authenticated" && session?.user;
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const adminNavItems = [
    { href: "/admin", label: "Dashboard" },
    { href: "/admin/bookings", label: "Bookings" },
    { href: "/admin/services", label: "Services" },
    { href: "/admin/availability", label: "Availability" },
  ];

  const toggleMenu = useCallback((): void => {
    setIsMenuOpen((prev) => !prev);
  }, []);

  const closeMenu = useCallback((): void => {
    setIsMenuOpen(false);
  }, []);

  const handleSignOut = useCallback(async (): Promise<void> => {
    await signOut({
      redirect: false,
      callbackUrl: "/admin/login",
    });
    closeMenu();
    router.push("/admin/login");
    router.refresh();
  }, [closeMenu, router]);

  // Close mobile menu on Escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent): void => {
      if (event.key === "Escape" && isMenuOpen) {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  // Check if we're in booking flow (show breadcrumbs in mobile menu)
  const isBookingFlow = pathname?.startsWith("/book");

  return (
    <header className="border-border bg-surface-elevated border-b">
      {/* Desktop Layout: Logo Left, Context Center, Actions Right */}
      <div className="mx-auto hidden h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:flex lg:px-8">
        {/* Left: Logo + Company Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <Image src="/logo.svg" alt="TruFlow Logo" width={32} height={32} className="h-8 w-8" />
            <h1 className="text-foreground text-xl font-bold">TruFlow</h1>
          </Link>
        </div>

        {/* Center: Breadcrumbs (non-admin) */}
        <nav className="mx-8 flex flex-1 justify-center">{isAdmin ? null : <Breadcrumbs />}</nav>

        {/* Right: Theme Toggle + Admin Menu */}
        <div className="flex items-center space-x-2">
          {isAdmin ? <HamburgerIcon isOpen={isMenuOpen} onClick={toggleMenu} /> : null}
          {!isMenuOpen ? <ThemeToggle /> : null}
        </div>
      </div>

      {/* Mobile Layout: Hamburger Left, Logo+Name Right (flex-row-reverse) */}
      <div className="mx-auto flex h-16 max-w-7xl flex-row-reverse items-center justify-between px-4 md:hidden">
        {/* Right visually (first in DOM): Logo + Company Name */}
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2" onClick={closeMenu}>
            <Image src="/logo.svg" alt="TruFlow Logo" width={32} height={32} className="h-8 w-8" />
            <h1 className="text-foreground text-lg font-bold">TruFlow</h1>
          </Link>
        </div>

        {/* Left visually (second in DOM): Hamburger Icon */}
        <HamburgerIcon isOpen={isMenuOpen} onClick={toggleMenu} />
      </div>

      {/* Dropdown Menu */}
      {isMenuOpen && (
        <div
          id="mobile-menu"
          data-testid="mobile-menu"
          className={`border-border bg-surface-elevated border-t ${isAdmin ? "" : "md:hidden"}`}
        >
          <nav className="space-y-1 px-4 py-3" role="navigation" aria-label="Mobile navigation">
            {/* Home Link */}
            <Link
              href="/"
              onClick={closeMenu}
              className="block rounded-md px-3 py-2 text-base font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
            >
              Home
            </Link>

            {/* Booking Flow: Show Breadcrumbs in Mobile Menu */}
            {isBookingFlow && (
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <div className="px-3 py-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Booking Progress
                </div>
                <Breadcrumbs />
              </div>
            )}

            {/* Admin: All admin functions in dynamic menu */}
            {isAdmin && (
              <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
                <div className="px-3 py-2 text-xs font-semibold tracking-wide text-gray-500 uppercase dark:text-gray-400">
                  Admin
                </div>
                <ul className="space-y-1 px-3 pb-2">
                  {adminNavItems.map(({ href, label }) => {
                    const isCurrent =
                      pathname === href || (href !== "/admin" && pathname?.startsWith(href));

                    return (
                      <li key={href}>
                        <Link
                          href={href}
                          onClick={closeMenu}
                          className={`block rounded-md px-3 py-2 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset ${
                            isCurrent
                              ? "bg-gray-100 text-gray-900 dark:bg-gray-700 dark:text-gray-100"
                              : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
                          }`}
                          aria-current={isCurrent ? "page" : undefined}
                        >
                          {label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <div className="px-3 pb-2">
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="block w-full rounded-md px-3 py-2 text-left text-sm font-medium text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:outline-none focus:ring-inset dark:text-gray-300 dark:hover:bg-gray-800"
                  >
                    Sign out
                  </button>
                </div>
              </div>
            )}

            {/* Theme Toggle */}
            <div className="border-t border-gray-200 pt-2 dark:border-gray-700">
              <div className="flex items-center justify-between px-3 py-2">
                <span className="text-base font-medium text-gray-700 dark:text-gray-300">
                  Theme
                </span>
                <ThemeToggle />
              </div>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
