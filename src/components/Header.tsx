"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

import { ThemeToggle } from "./ThemeToggle";
import { Breadcrumbs } from "./booking/Breadcrumbs";
import { HamburgerIcon } from "./navigation/HamburgerIcon";
import { AdminDropdown } from "./navigation/AdminDropdown";

const OFFERING_LABELS = {
  SESSION: "Session",
  EVENT: "Event",
  RENTAL: "Rental",
} as const;

const ADMIN_NAV_ITEMS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/bookings", label: "Bookings" },
  { href: "/admin/services", label: "Services" },
  { href: "/admin/availability", label: "Availability" },
];

const GUEST_NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/book?type=SESSION", label: `${OFFERING_LABELS.SESSION}s` },
  { href: "/book?type=EVENT", label: `${OFFERING_LABELS.EVENT}s` },
  { href: "/book?type=RENTAL", label: `${OFFERING_LABELS.RENTAL}s` },
  { href: "/book", label: "All offerings" },
];

export function Header(): React.ReactElement {
  const router = useRouter();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const isAdmin =
    status === "authenticated" &&
    typeof session?.user === "object" &&
    session?.user !== null &&
    "role" in session.user &&
    session.user.role === "admin";
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isBookingFlow = pathname?.startsWith("/book") ?? false;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const visibleNavItems = isAdmin ? ADMIN_NAV_ITEMS : GUEST_NAV_ITEMS;

  const activeAdminLabel = useMemo(() => {
    const matchedItem = ADMIN_NAV_ITEMS.find((item) => {
      if (item.href === "/admin") {
        return pathname === "/admin";
      }

      return pathname?.startsWith(item.href);
    });

    return matchedItem?.label ?? "Navigation";
  }, [pathname]);

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

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    document.body.style.overflow = "hidden";

    const focusableElements = dialogRef.current?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements?.[0];
    const lastFocusable = focusableElements?.[focusableElements.length - 1];

    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }

      if (event.key !== "Tab" || !focusableElements || focusableElements.length === 0) {
        return;
      }

      if (event.shiftKey && document.activeElement === firstFocusable) {
        event.preventDefault();
        lastFocusable?.focus();
      } else if (!event.shiftKey && document.activeElement === lastFocusable) {
        event.preventDefault();
        firstFocusable?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", handleKeyDown);
      previousFocusRef.current?.focus();
    };
  }, [closeMenu, isMenuOpen]);

  return (
    <header className="border-border bg-surface-elevated border-b shadow-sm">
      <div className="mx-auto hidden h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:flex lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3">
            <Image src="/logo.svg" alt="TruFlow logo" width={34} height={34} className="h-8 w-8" />
            <h1 className="text-xl font-semibold tracking-[0.02em] text-slate-950 dark:text-slate-50">
              TruFlow
            </h1>
          </Link>
        </div>

        <nav className="mx-8 flex flex-1 justify-center">{isAdminRoute ? null : <Breadcrumbs />}</nav>

        <div className="flex items-center gap-3">
          {isAdmin ? (
            <>
              <AdminDropdown />
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              >
                Sign out
              </button>
            </>
          ) : null}
          <ThemeToggle testId="theme-toggle-desktop" />
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-7xl flex-row-reverse items-center justify-between px-4 md:hidden">
        <div className="flex items-center">
          <Link href="/" className="flex items-center gap-3" onClick={closeMenu}>
            <Image src="/logo.svg" alt="TruFlow logo" width={32} height={32} className="h-8 w-8" />
            <h1 className="text-lg font-semibold text-slate-950 dark:text-slate-50">TruFlow</h1>
          </Link>
        </div>

        <HamburgerIcon isOpen={isMenuOpen} onClick={toggleMenu} ariaLabel="Open menu" />
      </div>

      {isMenuOpen ? (
        <div className="fixed inset-0 z-50 md:hidden" data-testid="mobile-menu">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/55"
            aria-label="Close navigation menu"
            onClick={closeMenu}
          />

          <dialog
            open
            id="mobile-menu"
            ref={dialogRef}
            aria-modal="true"
            aria-label="Navigation menu"
            className="absolute left-0 top-0 m-0 flex h-full w-full max-w-sm flex-col gap-6 border-none bg-white p-5 shadow-2xl dark:bg-slate-900"
          >
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold tracking-[0.16em] text-slate-600 uppercase">
                  {isAdmin ? activeAdminLabel : "Explore TruFlow"}
                </span>
                <span className="text-lg font-semibold text-slate-950 dark:text-slate-50">
                  {isAdmin ? "Admin navigation" : "Booking journeys"}
                </span>
              </div>
              <HamburgerIcon isOpen={isMenuOpen} onClick={closeMenu} />
            </div>

            {isBookingFlow && !isAdminRoute ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <span className="mb-2 block text-xs font-semibold tracking-[0.12em] text-slate-600 uppercase">
                  Booking progress
                </span>
                <Breadcrumbs />
              </div>
            ) : null}

            <nav className="flex flex-col gap-2" aria-label="Mobile navigation">
              {visibleNavItems.map(({ href, label }) => {
                const baseHref = href.split("?")[0];
                const isCurrent = baseHref === "/" ? pathname === "/" : pathname?.startsWith(baseHref);

                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className={`rounded-2xl border px-4 py-3 text-base font-medium transition ${
                      isCurrent
                        ? "border-slate-900 bg-slate-950 text-white"
                        : "border-slate-200 bg-white text-slate-900 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700"
                    }`}
                    aria-current={isCurrent ? "page" : undefined}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>

            <div className="mt-auto flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
              <span className="text-sm font-medium text-slate-800 dark:text-slate-100">Theme</span>
              <ThemeToggle testId="theme-toggle-mobile" />
            </div>

            {isAdmin ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-2xl border border-slate-300 px-4 py-3 text-left text-sm font-medium text-slate-900 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-100 dark:hover:bg-slate-800"
              >
                Sign out
              </button>
            ) : null}
          </dialog>
        </div>
      ) : null}
    </header>
  );
}
