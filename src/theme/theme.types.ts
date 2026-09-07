export const THEME_IDS = [
  "emerald-night",
  "mint-executive",
  "midnight-shell",
  "ivory-shell",
  "sea-glass",
  "sage-slate",
] as const;

export type ThemeId = (typeof THEME_IDS)[number];

export interface ThemeColors {
  canvas: string;
  navigation: string;
  surface: string;
  card: string;
  border: string;
  primary: string;
  secondary: string;
  accent: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  shell?: string;
  shellRaised?: string;
  workspace?: string;
  softSurface?: string;
  shellText?: string;
  workspaceText?: string;
}

export interface ThemeMeta {
  id: ThemeId;
  name: string;
  type: "dark" | "light" | "shell-dark" | "shell-light" | "cool" | "muted";
  colors: ThemeColors;
}

export const STORAGE_KEY_GLOBAL = "toplineshop.theme.global";
export const STORAGE_KEY_PREFIX = "toplineshop.theme.dashboard";
export const DEFAULT_THEME: ThemeId = "midnight-shell";
