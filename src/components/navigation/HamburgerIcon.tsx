/**
 * HamburgerIcon Component
 *
 * Animated hamburger menu icon that morphs into a close (X) icon.
 * Uses pure Tailwind CSS classes for animation - no external libraries.
 *
 * Requirements:
 * - R-001: Pure Tailwind/CSS approach for peak mobile performance
 * - US4 Acceptance 2: Hamburger morphs into close icon on tap
 * - US4 Acceptance 3: Close icon reverts to hamburger on tap
 * - WCAG 2.2 AA: 44x44px touch target, aria-expanded, aria-label
 *
 * Animation:
 * - Top bar: rotates 45deg and translates down
 * - Middle bar: fades out (opacity 0)
 * - Bottom bar: rotates -45deg and translates up
 * - Result: Perfect "X" shape
 */

"use client";

interface HamburgerIconProps {
  isOpen: boolean;
  onClick: () => void;
  className?: string;
}

export const HamburgerIcon = ({
  isOpen,
  onClick,
  className = "",
}: HamburgerIconProps): JSX.Element => {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={isOpen}
      aria-label={isOpen ? "Close menu" : "Open menu"}
      aria-controls="mobile-menu"
      data-testid="hamburger-button"
      className={`relative flex min-h-11 min-w-11 flex-col items-center justify-center rounded-md p-2 text-gray-700 hover:bg-gray-100 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none dark:text-gray-300 dark:hover:bg-gray-800 ${className}`}
    >
      {/* Top Bar */}
      <span
        className={`block h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-in-out ${
          isOpen ? "translate-y-1.5 rotate-45" : ""
        }`}
      />

      {/* Middle Bar */}
      <span
        className={`my-1.5 block h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-in-out ${
          isOpen ? "opacity-0" : "opacity-100"
        }`}
      />

      {/* Bottom Bar */}
      <span
        className={`block h-0.5 w-6 rounded-full bg-current transition-all duration-300 ease-in-out ${
          isOpen ? "-translate-y-1.5 -rotate-45" : ""
        }`}
      />
    </button>
  );
};
