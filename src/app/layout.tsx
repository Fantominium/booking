import type { Metadata } from "next";
import { Inter } from "next/font/google";

import { Providers } from "@/components/Providers";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SkipToMainLink } from "@/components/accessibility";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "TruFlow Booking",
  description: "Book your next massage appointment in minutes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): React.ReactElement {
  return (
    <html lang="en">
      <body className={`${inter.variable} antialiased`}>
        <SkipToMainLink />
        <Providers>
          <div className="fixed right-6 bottom-6 z-50">
            <ThemeToggle />
          </div>
          <main id="main-content" tabIndex={-1}>
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
