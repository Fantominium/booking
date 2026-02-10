"use client";

import React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { ThemeToggle } from "../ThemeToggle";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const { data: session } = useSession();

  const handleSignOut = React.useCallback(async (): Promise<void> => {
    await signOut({
      redirect: false,
      callbackUrl: "/admin/login",
    });
    router.push("/admin/login");
    router.refresh();
  }, [router]);

  const navItems = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/bookings", label: "Bookings", icon: "📅" },
    { href: "/admin/services", label: "Services", icon: "💆" },
    { href: "/admin/availability", label: "Availability", icon: "⏰" },
  ];

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="border-border bg-surface-elevated border-b">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-4">
            <Link href="/admin" className="flex items-center space-x-2">
              <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
                <span className="text-primary text-lg font-bold">T</span>
              </div>
              <h1 className="text-foreground text-xl font-bold">TruFlow Admin</h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            {session?.user?.email && (
              <span className="hidden text-sm text-neutral-600 md:block">{session.user.email}</span>
            )}
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="hover:bg-surface hover:text-foreground focus:ring-primary flex min-h-[44px] items-center rounded-lg px-3 py-2 text-sm font-medium text-neutral-600 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
              aria-label="Sign out"
            >
              Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Navigation */}
        <nav className="flex space-x-1 overflow-x-auto py-4" role="navigation">
          {navItems.map(({ href, label, icon }) => {
            const isActive = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={`focus:ring-primary flex min-h-[44px] items-center space-x-2 rounded-lg px-3 py-2 text-sm font-medium whitespace-nowrap transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none ${
                  isActive
                    ? "bg-primary text-white"
                    : "hover:bg-surface hover:text-foreground text-neutral-600"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Main content */}
        <main className="pb-12">{children}</main>
      </div>
    </div>
  );
}
