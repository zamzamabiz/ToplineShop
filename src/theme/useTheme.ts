"use client";

import { useSyncExternalStore } from "react";
import { useThemeContext } from "./ThemeProvider";
import {
  getDashboardTheme,
  setDashboardTheme,
  resolveTheme,
} from "./themeStorage";
import type { ThemeId } from "./theme.types";
import { DEFAULT_THEME } from "./theme.types";

const emptySubscribe = () => () => {};

export function useTheme() {
  const { themeId, setTheme, themes } = useThemeContext();
  const current = themes.find((t) => t.id === themeId) || themes[0];
  return { theme: current, themeId, setTheme, themes };
}

export function useDashboardTheme(dashboard: string) {
  const { themes } = useThemeContext();

  const dashboardPref = useSyncExternalStore(
    emptySubscribe,
    () => getDashboardTheme(dashboard),
    () => "global" as const
  );
  const resolvedId = useSyncExternalStore(
    emptySubscribe,
    () => resolveTheme(dashboard),
    () => DEFAULT_THEME
  );

  function setDashboardOverride(themeId: ThemeId | "global") {
    setDashboardTheme(dashboard, themeId);
    const resolved = resolveTheme(dashboard);
    document.documentElement.setAttribute("data-theme", resolved);
  }

  const current = themes.find((t) => t.id === resolvedId) || themes[0];

  return {
    theme: current,
    themeId: resolvedId,
    dashboardPref,
    setDashboardOverride,
    themes,
    dashboard,
  };
}
