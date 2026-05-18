import { createTheme, type Theme } from "@mui/material/styles";
import type {} from "@mui/x-data-grid/themeAugmentation";

type ThemeMode = "light" | "dark";

export const createAccessibleMuiTheme = (mode: ThemeMode): Theme => {
  const isDark = mode === "dark";

  return createTheme({
    palette: {
      mode,
      primary: {
        main: isDark ? "#90caf9" : "#1565c0",
      },
      secondary: {
        main: isDark ? "#ffcc80" : "#b26a00",
      },
      background: {
        default: isDark ? "#121212" : "#fcfdff",
        paper: isDark ? "#1e1e1e" : "#ffffff",
      },
      text: {
        primary: isDark ? "#ffffff" : "#0f172a",
        secondary: isDark ? "rgba(255, 255, 255, 0.88)" : "#334155",
      },
      divider: isDark ? "rgba(255, 255, 255, 0.24)" : "#cbd5e1",
      error: {
        main: isDark ? "#ff8a80" : "#c62828",
      },
      success: {
        main: isDark ? "#81c784" : "#2e7d32",
      },
      warning: {
        main: isDark ? "#ffb74d" : "#ed6c02",
      },
      info: {
        main: isDark ? "#64b5f6" : "#0288d1",
      },
    },
    shape: {
      borderRadius: 12,
    },
    typography: {
      fontFamily: "var(--font-inter), Inter, system-ui, -apple-system, Segoe UI, sans-serif",
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDark ? "#121212" : "#fcfdff",
            color: isDark ? "#ffffff" : "#0f172a",
          },
        },
      },
      MuiDataGrid: {
        styleOverrides: {
          root: {
            borderColor: isDark ? "rgba(255, 255, 255, 0.24)" : "#cbd5e1",
            backgroundColor: isDark ? "#1e1e1e" : "#ffffff",
            color: isDark ? "#ffffff" : "#0f172a",
          },
          columnHeaders: {
            backgroundColor: isDark ? "#252525" : "#f8fafc",
            color: isDark ? "#ffffff" : "#0f172a",
          },
          cell: {
            borderColor: isDark ? "rgba(255, 255, 255, 0.16)" : "#e2e8f0",
          },
          footerContainer: {
            borderTopColor: isDark ? "rgba(255, 255, 255, 0.24)" : "#cbd5e1",
            backgroundColor: isDark ? "#252525" : "#f8fafc",
          },
        },
      },
    },
  });
};
