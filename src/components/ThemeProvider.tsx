"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  resolvedTheme: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}

interface ThemeProviderProps {
  children: React.ReactNode;
  defaultTheme?: Theme;
}

export function ThemeProvider({
  children,
  defaultTheme = "system",
}: ThemeProviderProps): React.ReactElement {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return defaultTheme;
    }
    const savedTheme = localStorage.getItem("truflow-theme") as Theme | null;
    return savedTheme ?? defaultTheme;
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Handle system theme detection and resolved theme calculation
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolvedTheme = (): void => {
      let newResolvedTheme: "light" | "dark";

      if (theme === "system") {
        newResolvedTheme = mediaQuery.matches ? "dark" : "light";
      } else {
        newResolvedTheme = theme;
      }

      setResolvedTheme(newResolvedTheme);

      // Apply theme to document
      document.documentElement.setAttribute("data-theme", newResolvedTheme);
    };

    updateResolvedTheme();
    mediaQuery.addEventListener("change", updateResolvedTheme);

    return () => {
      mediaQuery.removeEventListener("change", updateResolvedTheme);
    };
  }, [theme]);

  const handleSetTheme = (newTheme: Theme): void => {
    setTheme(newTheme);
    localStorage.setItem("truflow-theme", newTheme);
  };

  const value = {
    theme,
    setTheme: handleSetTheme,
    resolvedTheme,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
