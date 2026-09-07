"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import type { ThemeId } from "./theme.types";
import { DEFAULT_THEME } from "./theme.types";
import { themes } from "./themeRegistry";
import { getGlobalTheme, setGlobalTheme } from "./themeStorage";

interface ThemeContextValue {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
  themes: typeof themes;
}

const ThemeContext = createContext<ThemeContextValue>({
  themeId: DEFAULT_THEME,
  setTheme: () => {},
  themes,
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

function getInitialTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  return getGlobalTheme();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeId, setThemeId] = useState<ThemeId>(getInitialTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", themeId);
  }, [themeId]);

  const setTheme = useCallback((id: ThemeId) => {
    setThemeId(id);
    setGlobalTheme(id);
  }, []);

  return (
    <ThemeContext.Provider value={{ themeId, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  );
}
