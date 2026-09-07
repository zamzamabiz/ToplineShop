"use client";

import { useState, useRef, useEffect, useSyncExternalStore } from "react";
import {
  getDashboardTheme,
  setDashboardTheme,
  resolveTheme,
} from "@/theme/themeStorage";
import { THEME_IDS, DEFAULT_THEME } from "@/theme/theme.types";
import type { ThemeId } from "@/theme/theme.types";
import { THEMES } from "@/theme/themeRegistry";
import { ChevronDown, Monitor, Check } from "lucide-react";

const themeColors: Record<string, string[]> = {
  "emerald-night": ["#22C55E", "#14B8A6", "#081411"],
  "mint-executive": ["#15803D", "#0F8F83", "#F4FAF7"],
  "midnight-shell": ["#16A34A", "#0D9488", "#10221D"],
  "ivory-shell": ["#34D399", "#2DD4BF", "#F6FBF8"],
  "sea-glass": ["#0F766E", "#158F78", "#EFF8F7"],
  "sage-slate": ["#3F7857", "#578F7A", "#26352F"],
};

interface DashboardThemeOverrideProps {
  dashboard: string;
}

const emptySubscribe = () => () => {};

export function DashboardThemeOverride({
  dashboard,
}: DashboardThemeOverrideProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const storedPref = useSyncExternalStore(
    emptySubscribe,
    () => getDashboardTheme(dashboard),
    () => "global" as const
  );
  const resolvedId = useSyncExternalStore(
    emptySubscribe,
    () => resolveTheme(dashboard),
    () => DEFAULT_THEME
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [open]);

  function handleSelect(value: "global" | ThemeId) {
    setDashboardTheme(dashboard, value);
    const resolved = resolveTheme(dashboard);
    document.documentElement.setAttribute("data-theme", resolved);
    setOpen(false);
  }

  const currentLabel =
    storedPref === "global"
      ? "Use Global Theme"
      : THEMES[storedPref]?.name || "Theme";

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors"
        style={{
          color: "var(--text-secondary)",
          backgroundColor: open ? "var(--interactive-hover)" : "transparent",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.backgroundColor = "transparent";
        }}
        aria-label="Override dashboard theme"
        aria-expanded={open}
      >
        <Monitor size={16} />
        <span className="hidden sm:inline">{currentLabel}</span>
        <ChevronDown size={12} />
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-64 rounded-xl shadow-lg z-50 py-2"
          style={{
            backgroundColor: "var(--surface-primary)",
            border: "1px solid var(--border-default)",
          }}
          role="menu"
        >
          <div
            className="px-3 py-2 text-xs font-semibold uppercase tracking-wider"
            style={{ color: "var(--text-muted)" }}
          >
            Dashboard Theme
          </div>

          <button
            onClick={() => handleSelect("global")}
            className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors"
            style={{
              backgroundColor:
                storedPref === "global" ? "var(--interactive-active)" : "transparent",
              color: "var(--text-primary)",
            }}
            onMouseEnter={(e) => {
              if (storedPref !== "global")
                e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
            }}
            onMouseLeave={(e) => {
              if (storedPref !== "global")
                e.currentTarget.style.backgroundColor = "transparent";
            }}
            role="menuitem"
          >
            <div className="flex gap-1 flex-shrink-0">
              {(themeColors[resolvedId] || []).map((c, i) => (
                <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <span className="flex-1">Use Global Theme</span>
            {storedPref === "global" && (
              <Check size={14} style={{ color: "var(--brand-primary)" }} />
            )}
          </button>

          <div className="my-1 mx-3" style={{ borderTop: "1px solid var(--border-subtle)" }} />

          {THEME_IDS.map((id) => {
            const t = THEMES[id];
            const tc = themeColors[id] || [];
            const isActive = storedPref === id;
            return (
              <button
                key={id}
                onClick={() => handleSelect(id)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-left transition-colors"
                style={{
                  backgroundColor: isActive ? "var(--interactive-active)" : "transparent",
                  color: "var(--text-primary)",
                }}
                onMouseEnter={(e) => {
                  if (!isActive)
                    e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
                }}
                onMouseLeave={(e) => {
                  if (!isActive)
                    e.currentTarget.style.backgroundColor = "transparent";
                }}
                role="menuitem"
              >
                <div className="flex gap-1 flex-shrink-0">
                  {tc.map((c, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <span className="flex-1">{t.name}</span>
                {isActive && <Check size={14} style={{ color: "var(--brand-primary)" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
