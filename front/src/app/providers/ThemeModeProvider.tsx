"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { createTheme, ThemeProvider, CssBaseline, useMediaQuery } from "@mui/material";

type ThemeMode = "light" | "dark" | "system";

type Ctx = {
  mode: ThemeMode;
  resolvedMode: "light" | "dark";      // actual mode being applied
  setMode: (m: ThemeMode) => void;
  toggle: () => void;                   // light <-> dark (ignores "system")
};

const ThemeModeContext = createContext<Ctx>({
  mode: "system",
  resolvedMode: "light",
  setMode: () => {},
  toggle: () => {},
});

export function useThemeMode() {
  return useContext(ThemeModeContext);
}

export default function ThemeModeProvider({ children }: { children: React.ReactNode }) {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState<ThemeMode>("system");
  const [mounted, setMounted] = useState(false);

  // Load persisted mode once on client
  useEffect(() => {
    const stored = localStorage.getItem("theme") as ThemeMode | null;
    if (stored === "light" || stored === "dark" || stored === "system") setMode(stored);
    setMounted(true);
  }, []);

  // Compute the effective mode applied to MUI
  const resolvedMode: "light" | "dark" =
    mode === "system" ? (prefersDark ? "dark" : "light") : mode;

  // Persist + keep Tailwind (if used) in sync by toggling `dark` class on <html>
  useEffect(() => {
    if (!mounted) return;
    localStorage.setItem("theme", mode);
    document.documentElement.classList.toggle("dark", resolvedMode === "dark");
  }, [mode, resolvedMode, mounted]);

  const theme = useMemo(
    () =>
      createTheme({
        palette: { mode: resolvedMode },
        shape: { borderRadius: 12 },
      }),
    [resolvedMode]
  );

  const toggle = () => setMode((m) => (m === "dark" ? "light" : "dark"));

  // Avoid hydration mismatch flashes
  if (!mounted) {
    return (
      <ThemeModeContext.Provider value={{ mode, resolvedMode, setMode, toggle }}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ThemeModeContext.Provider>
    );
  }

  return (
    <ThemeModeContext.Provider value={{ mode, resolvedMode, setMode, toggle }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}
