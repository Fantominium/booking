"use client";

import { Menu, X } from "lucide-react";

interface HamburgerIconProps {
  isOpen: boolean;
  onClick: (event: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  ariaLabel?: string;
  controlsId?: string;
  testId?: string;
}

export const HamburgerIcon = ({
  isOpen,
  onClick,
  className = "",
  ariaLabel,
  controlsId = "mobile-navigation-modal",
  testId = "hamburger-button",
}: HamburgerIconProps): JSX.Element => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-haspopup="dialog"
      aria-expanded={isOpen}
      aria-label={ariaLabel ?? (isOpen ? "Close menu" : "Open menu")}
      aria-controls={controlsId}
      data-testid={testId}
      className={`relative flex min-h-11 min-w-11 items-center justify-center rounded-xl border border-slate-300 bg-white/95 p-2 text-slate-900 transition hover:bg-slate-100 focus:ring-2 focus:ring-slate-900 focus:ring-offset-2 focus:outline-none dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:hover:bg-slate-700 ${className}`}
    >
      <Menu
        aria-hidden="true"
        className={`absolute h-5 w-5 transition duration-200 ${
          isOpen ? "scale-75 opacity-0" : "scale-100 opacity-100"
        }`}
      />
      <X
        aria-hidden="true"
        className={`absolute h-5 w-5 transition duration-200 ${
          isOpen ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
      />
    </button>
  );
};
