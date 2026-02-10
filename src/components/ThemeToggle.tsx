"use client";

import React from "react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle(): React.ReactElement {
  const { theme, setTheme, resolvedTheme } = useTheme();

  const handleToggle = React.useCallback((): void => {
    if (theme === "system") {
      // If system, switch to opposite of current resolved theme
      setTheme(resolvedTheme === "light" ? "dark" : "light");
    } else if (theme === "light") {
      setTheme("dark");
    } else {
      setTheme("light");
    }
  }, [resolvedTheme, setTheme, theme]);

  const getIcon = (): React.ReactElement => {
    if (resolvedTheme === "dark") {
      return (
        <svg
          className="h-5 w-5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
          />
        </svg>
      );
    }
    return (
      <svg
        className="h-5 w-5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
        />
      </svg>
    );
  };

  const getLabel = (): string => {
    return resolvedTheme === "light" ? "Switch to dark mode" : "Switch to light mode";
  };

  return (
    <button
      onClick={handleToggle}
      data-testid="theme-toggle"
      className="hover:bg-surface hover:text-foreground focus:ring-primary rounded-lg p-2 text-neutral-600 transition-colors focus:ring-2 focus:ring-offset-2 focus:outline-none"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  );
}
