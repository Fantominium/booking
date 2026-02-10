import React, { useId } from "react";

/**
 * Accessibility utilities and constants for WCAG 2.2 AA compliance
 */

// WCAG 2.2 AA minimum touch target size
export const MIN_TOUCH_TARGET_SIZE = 44;

// Common ARIA live regions
export type AriaLive = "polite" | "assertive" | "off";

// Focus trap utilities
export const focusableElementsSelector = [
  "a[href]",
  "area[href]",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "button:not([disabled])",
  "iframe",
  "object",
  "embed",
  "[contenteditable]",
  "[tabindex]:not([tabindex^='-'])",
].join(", ");

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll(focusableElementsSelector));
}

/**
 * Trap focus within a container (useful for modals)
 */
export function trapFocus(container: HTMLElement, event: KeyboardEvent): void {
  const focusableElements = getFocusableElements(container);
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (!firstElement || !lastElement) return;

  if (event.key === "Tab") {
    if (event.shiftKey) {
      // Shift + Tab
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
      }
    } else {
      // Tab
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    }
  }
}

/**
 * Skip to main content link component
 */
export function SkipToMainLink(): React.ReactElement {
  return (
    <a
      href="#main-content"
      data-testid="skip-to-main"
      className="bg-primary focus:ring-offset-primary sr-only z-50 rounded-lg px-4 py-2 text-white focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:outline-none"
      style={{ minHeight: `${MIN_TOUCH_TARGET_SIZE}px` }}
    >
      Skip to main content
    </a>
  );
}

/**
 * Screen reader only text component
 */
interface ScreenReaderOnlyProps {
  children: React.ReactNode;
  as?: keyof JSX.IntrinsicElements;
}

export function ScreenReaderOnly({
  children,
  as: Component = "span",
}: ScreenReaderOnlyProps): React.ReactElement {
  return <Component className="sr-only">{children}</Component>;
}

/**
 * Live region for dynamic content announcements
 */
interface LiveRegionProps {
  children: React.ReactNode;
  priority?: AriaLive;
  atomic?: boolean;
  className?: string;
}

export function LiveRegion({
  children,
  priority = "polite",
  atomic = true,
  className = "",
}: LiveRegionProps): React.ReactElement {
  return (
    <div role="status" aria-live={priority} aria-atomic={atomic} className={`sr-only ${className}`}>
      {children}
    </div>
  );
}

/**
 * Enhanced button component with accessibility features
 */
interface AccessibleButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
}

export function AccessibleButton({
  children,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  disabled,
  className = "",
  ...props
}: AccessibleButtonProps): React.ReactElement {
  const baseClasses = [
    "font-semibold rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
    // Ensure minimum touch target
    `min-h-[${MIN_TOUCH_TARGET_SIZE}px]`,
    "flex items-center justify-center",
  ];

  const variantClass =
    variant === "primary"
      ? "bg-primary text-white hover:bg-primary-dark focus:ring-primary"
      : variant === "secondary"
        ? "bg-surface border-2 border-border text-foreground hover:bg-neutral-100 focus:ring-primary"
        : "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500";

  const sizeClass =
    size === "sm" ? "px-3 py-2 text-sm" : size === "md" ? "px-4 py-3 text-base" : "px-6 py-4 text-lg";

  const allClasses = [...baseClasses, variantClass, sizeClass, className].join(" ");

  return (
    <button
      className={allClasses}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-describedby={loading ? "loading-status" : undefined}
      {...props}
    >
      {loading ? (
        <>
          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
          {loadingText || "Loading..."}
          <span id="loading-status" className="sr-only">
            {loadingText || "Loading, please wait"}
          </span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Enhanced form input with accessibility features
 */
interface AccessibleInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  helperText?: string;
  required?: boolean;
}

export function AccessibleInput({
  label,
  error,
  helperText,
  required,
  id,
  className = "",
  ...props
}: AccessibleInputProps): React.ReactElement {
  const generatedId = useId();
  const inputId = id ?? `input-${generatedId}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;

  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="text-foreground block text-sm font-medium">
        {label}
        {required && (
          <span className="ml-1 text-red-500" aria-label="required">
            *
          </span>
        )}
      </label>

      <input
        id={inputId}
        aria-describedby={[errorId, helperId].filter(Boolean).join(" ") || undefined}
        aria-invalid={error ? "true" : "false"}
        className={[
          "text-foreground focus:ring-opacity-50 block w-full rounded-lg border px-3 py-3 placeholder-neutral-400 transition-colors focus:ring-2 focus:outline-none",
          `min-h-[${MIN_TOUCH_TARGET_SIZE}px]`,
          error
            ? "border-red-500 bg-red-50 focus:border-red-500 focus:ring-red-500"
            : "border-border bg-surface focus:border-primary focus:ring-primary",
          className,
        ].join(" ")}
        required={required}
        {...props}
      />

      {helperText && (
        <p id={helperId} className="text-sm text-neutral-600">
          {helperText}
        </p>
      )}

      {error && (
        <p id={errorId} role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
