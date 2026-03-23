"use client";

import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

import { OFFERING_LABELS } from "@/lib/offerings";

import { Breadcrumbs } from "./booking/Breadcrumbs";
import { AdminDropdown } from "./navigation/AdminDropdown";
import { HamburgerIcon } from "./navigation/HamburgerIcon";
import { ThemeToggle } from "./ThemeToggle";

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

const MENU_MODAL_ID = "navigation-menu-modal";

type MenuAnchorStyle = {
  top: number;
  left: number;
  width: number;
  maxHeight: number;
  transformOrigin: "top left" | "top right";
};

const calculateMenuAnchorStyle = (triggerElement: HTMLButtonElement): MenuAnchorStyle => {
  const rect = triggerElement.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const gutter = 12;
  const preferredWidth = viewportWidth >= 768 ? 340 : Math.min(320, viewportWidth - gutter * 2);
  const width = Math.max(260, Math.min(preferredWidth, viewportWidth - gutter * 2));
  const alignLeft = rect.left + rect.width / 2 < viewportWidth / 2;
  const rawLeft = alignLeft ? rect.left : rect.right - width;
  const maxLeft = Math.max(gutter, viewportWidth - width - gutter);
  const left = Math.max(gutter, Math.min(rawLeft, maxLeft));
  const top = rect.bottom + 10;
  const maxHeight = Math.max(220, viewportHeight - top - gutter);

  return {
    top,
    left,
    width,
    maxHeight,
    transformOrigin: alignLeft ? "top left" : "top right",
  };
};

export function Header(): React.ReactElement {
  const router = useRouter();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const canUseDOM = typeof globalThis.window !== "undefined";
  const isAdmin = status === "authenticated" && session?.user?.role === "admin";
  const isAdminRoute = pathname?.startsWith("/admin") ?? false;
  const isBookingFlow = pathname?.startsWith("/book") ?? false;
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [menuAnchorStyle, setMenuAnchorStyle] = useState<MenuAnchorStyle | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);

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

  const closeMenu = useCallback((): void => {
    setIsMenuOpen(false);
  }, []);

  const updateMenuAnchorStyle = useCallback((element?: HTMLButtonElement | null): void => {
    const triggerElement = element ?? triggerRef.current;

    if (!triggerElement) {
      return;
    }

    setMenuAnchorStyle(calculateMenuAnchorStyle(triggerElement));
  }, []);

  const toggleMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>): void => {
      const triggerElement = event.currentTarget;
      triggerRef.current = triggerElement;

      if (isMenuOpen) {
        closeMenu();
        return;
      }

      updateMenuAnchorStyle(triggerElement);
      setIsMenuOpen(true);
    },
    [closeMenu, isMenuOpen, updateMenuAnchorStyle],
  );

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
    const dialogElement = dialogRef.current;

    if (!dialogElement) {
      return;
    }

    if (isMenuOpen && !dialogElement.open) {
      dialogElement.showModal();
    }

    if (!isMenuOpen && dialogElement.open) {
      dialogElement.close();
    }
  }, [isMenuOpen]);

  useEffect(() => {
    const dialogElement = dialogRef.current;

    if (!dialogElement || !isMenuOpen) {
      return;
    }

    document.body.style.overflow = "hidden";

    const focusableElements = dialogElement.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
    );
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];

    firstFocusable?.focus();

    const handleKeyDown = (event: KeyboardEvent): void => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
        return;
      }

      if (event.key !== "Tab" || focusableElements.length === 0) {
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

    const handleViewportChange = (): void => {
      updateMenuAnchorStyle();
    };

    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
      document.removeEventListener("keydown", handleKeyDown);
      triggerRef.current?.focus();
    };
  }, [closeMenu, isMenuOpen, updateMenuAnchorStyle]);

  const handleDialogCancel = useCallback(
    (event: React.SyntheticEvent<HTMLDialogElement>): void => {
      event.preventDefault();
      closeMenu();
    },
    [closeMenu],
  );

  const menuModal =
    canUseDOM && menuAnchorStyle
      ? createPortal(
          <dialog
            id={MENU_MODAL_ID}
            ref={dialogRef}
            aria-labelledby="navigation-menu-title"
            aria-describedby="navigation-menu-description"
            aria-modal="true"
            data-testid="mobile-menu"
            onCancel={handleDialogCancel}
            className="fixed inset-0 m-0 h-screen max-h-none w-screen max-w-none overflow-visible border-none bg-transparent p-0 backdrop:bg-transparent"
          >
            <div className="relative h-full w-full">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={closeMenu}
                className="absolute inset-0 bg-transparent"
              />

              <section
                style={{
                  top: menuAnchorStyle.top,
                  left: menuAnchorStyle.left,
                  width: menuAnchorStyle.width,
                  maxHeight: menuAnchorStyle.maxHeight,
                  transformOrigin: menuAnchorStyle.transformOrigin,
                }}
                className="absolute z-10 flex flex-col gap-5 overflow-y-auto rounded-[1.75rem] border border-slate-200 bg-white/95 p-5 shadow-2xl ring-1 ring-slate-950/6 backdrop-blur supports-backdrop-filter:bg-white/90 dark:border-slate-700 dark:bg-slate-900/95 dark:supports-backdrop-filter:bg-slate-900/88"
              >
                <div className="flex items-start justify-between gap-4 border-b border-slate-200 pb-4 dark:border-slate-700">
                  <div className="flex flex-col gap-1">
                    <span
                      id="navigation-menu-description"
                      className="text-xs font-semibold tracking-[0.16em] text-slate-600 uppercase"
                    >
                      {isAdmin ? activeAdminLabel : "Explore TruFlow"}
                    </span>
                    <span
                      id="navigation-menu-title"
                      className="text-lg font-semibold text-slate-950 dark:text-slate-50"
                    >
                      Navigation menu
                    </span>
                  </div>
                  <HamburgerIcon
                    isOpen={isMenuOpen}
                    onClick={toggleMenu}
                    controlsId={MENU_MODAL_ID}
                    testId="hamburger-button-close"
                  />
                </div>

                {isBookingFlow && !isAdminRoute ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <span className="mb-2 block text-xs font-semibold tracking-[0.12em] text-slate-600 uppercase">
                      Booking progress
                    </span>
                    <Breadcrumbs />
                  </div>
                ) : null}

                <nav className="flex flex-col gap-2" aria-label="Menu navigation">
                  {visibleNavItems.map(({ href, label }) => {
                    const baseHref = href.split("?")[0];
                    const isCurrent =
                      baseHref === "/" ? pathname === "/" : pathname?.startsWith(baseHref);

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

                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
                  <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                    Theme
                  </span>
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
              </section>
            </div>
          </dialog>,
          document.body,
        )
      : null;

  return (
    <>
      <header className="border-border bg-surface-elevated border-b shadow-sm">
        <div className="mx-auto hidden h-16 max-w-7xl items-center justify-between px-4 sm:px-6 md:flex lg:px-8">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-full px-1 py-1 transition hover:opacity-90"
            >
              <Image
                src="/logo.svg"
                alt="TruFlow logo"
                width={36}
                height={36}
                className="h-9 w-9"
              />
              <h1 className="text-xl font-semibold tracking-[0.02em] text-slate-950 dark:text-slate-50">
                TruFlow
              </h1>
            </Link>
          </div>

          <nav className="mx-8 flex flex-1 justify-center">
            {isAdminRoute ? null : <Breadcrumbs />}
          </nav>

          <div className="flex items-center gap-3">
            {isAdmin ? <AdminDropdown /> : null}
            <HamburgerIcon
              isOpen={isMenuOpen}
              onClick={toggleMenu}
              controlsId={MENU_MODAL_ID}
              testId="hamburger-button-desktop"
              className="hidden md:flex"
            />
            {isAdmin ? (
              <button
                type="button"
                onClick={handleSignOut}
                className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100"
              >
                Sign out
              </button>
            ) : null}
            <ThemeToggle testId="theme-toggle-desktop" />
          </div>
        </div>

        <div className="mx-auto flex h-16 max-w-7xl flex-row-reverse items-center justify-between px-4 md:hidden">
          <div className="flex items-center">
            <Link
              href="/"
              className="flex items-center gap-3 rounded-full px-1 py-1 transition hover:opacity-90"
              onClick={closeMenu}
            >
              <Image
                src="/logo.svg"
                alt="TruFlow logo"
                width={34}
                height={34}
                className="h-8.5 w-8.5"
              />
              <h1 className="text-lg font-semibold tracking-[0.02em] text-slate-950 dark:text-slate-50">
                TruFlow
              </h1>
            </Link>
          </div>

          <HamburgerIcon isOpen={isMenuOpen} onClick={toggleMenu} controlsId={MENU_MODAL_ID} />
        </div>
      </header>
      {menuModal}
    </>
  );
}
