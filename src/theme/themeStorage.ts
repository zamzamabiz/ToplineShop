import type { ThemeId } from "./theme.types";
import { THEME_IDS, DEFAULT_THEME, STORAGE_KEY_GLOBAL, STORAGE_KEY_PREFIX } from "./theme.types";

function isThemeId(value: string): value is ThemeId {
  return (THEME_IDS as readonly string[]).includes(value);
}

export function getGlobalTheme(): ThemeId {
  if (typeof window === "undefined") return DEFAULT_THEME;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_GLOBAL);
    if (stored && isThemeId(stored)) return stored;
  } catch {}
  return DEFAULT_THEME;
}

export function setGlobalTheme(themeId: ThemeId): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY_GLOBAL, themeId);
  } catch {}
}

export function getDashboardTheme(dashboard: string): ThemeId | "global" {
  if (typeof window === "undefined") return "global";
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY_PREFIX}.${dashboard}`);
    if (stored === "global") return "global";
    if (stored && isThemeId(stored)) return stored;
  } catch {}
  return "global";
}

export function setDashboardTheme(dashboard: string, themeId: ThemeId | "global"): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${STORAGE_KEY_PREFIX}.${dashboard}`, themeId);
  } catch {}
}

export function resolveTheme(dashboard?: string): ThemeId {
  if (dashboard) {
    const dashPref = getDashboardTheme(dashboard);
    if (dashPref !== "global") return dashPref;
  }
  return getGlobalTheme();
}
