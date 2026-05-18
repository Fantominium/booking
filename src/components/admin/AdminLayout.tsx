"use client";

import React from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: Readonly<AdminLayoutProps>): React.ReactElement {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(186,230,253,0.18),transparent_45%),linear-gradient(180deg,#fdfefe_0%,#f5f7fb_100%)] dark:bg-[radial-gradient(circle_at_top,rgba(144,202,249,0.12),transparent_45%),linear-gradient(180deg,#121212_0%,#171717_100%)]">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <main className="pb-12">{children}</main>
      </div>
    </div>
  );
}
