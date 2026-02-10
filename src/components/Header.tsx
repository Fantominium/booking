"use client";

import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Header(): React.ReactElement {
  return (
    <header className="border-border bg-surface-elevated border-b">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
          <Link href="/" className="flex items-center space-x-2">
            <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
              <span className="text-primary text-lg font-bold">T</span>
            </div>
            <h1 className="text-foreground text-xl font-bold">TruFlow</h1>
          </Link>
        </div>

        <nav className="hidden items-center space-x-4 md:flex">
          <Link href="/book" className="hover:text-foreground text-neutral-600 transition-colors">
            Book Appointment
          </Link>
          <Link href="/admin" className="hover:text-foreground text-neutral-600 transition-colors">
            Admin
          </Link>
        </nav>

        <div className="flex items-center space-x-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
