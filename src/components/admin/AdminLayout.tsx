"use client";

import React from "react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: Readonly<AdminLayoutProps>): React.ReactElement {
  return (
    <div className="bg-background min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <main className="pb-12">{children}</main>
      </div>
    </div>
  );
}
