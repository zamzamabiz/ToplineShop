"use client";

import Link from "next/link";
import { Bell, Search, User } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { DashboardThemeOverride } from "./DashboardThemeOverride";

interface TopbarProps {
  dashboard?: string;
}

export function Topbar({ dashboard }: TopbarProps) {
  return (
    <header
      className="flex items-center justify-between h-16 px-6 border-b"
      style={{
        backgroundColor: "var(--topbar-background)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-md border pl-9 pr-3 text-sm focus:outline-none focus:ring-2"
            style={{
              backgroundColor: "var(--input-background)",
              borderColor: "var(--input-border)",
              color: "var(--text-primary)",
              "--tw-ring-color": "var(--input-focus)",
            } as React.CSSProperties}
          />
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/project-management"
          className="text-sm px-3 py-1.5 rounded-md transition-colors"
          style={{ color: "var(--text-secondary)" }}
        >
          Control Center
        </Link>
        {dashboard && <DashboardThemeOverride dashboard={dashboard} />}
        <ThemeSwitcher />
        <button
          className="relative p-2 rounded-md transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <Bell size={18} />
          <span
            className="absolute top- right-1 h-2 w-2 rounded-full"
            style={{ backgroundColor: "var(--brand-primary)" }}
          />
        </button>
        <button
          className="flex items-center gap-2 p-2 rounded-md transition-colors"
          style={{ color: "var(--text-secondary)" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
          }}
        >
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
