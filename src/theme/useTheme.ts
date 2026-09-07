"use client";

import { useThemeContext } from "./ThemeProvider";

export function useTheme() {
  const { themeId, setTheme, themes } = useThemeContext();
  const current = themes.find((t) => t.id === themeId) || themes[0];
  return { theme: current, themeId, setTheme, themes };
}

export function useDashboardTheme(dashboard: string) {
  const { themeId, setTheme, themes } = useThemeContext();
  const current = themes.find((t) => t.id === themeId) || themes[0];
  return { theme: current, themeId, setTheme, themes, dashboard };
}
