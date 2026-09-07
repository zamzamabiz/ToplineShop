"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";

interface AppShellProps {
  children: React.ReactNode;
  dashboard?: string;
}

export function AppShell({ children, dashboard }: AppShellProps) {
  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{ backgroundColor: "var(--app-canvas)" }}
    >
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Topbar dashboard={dashboard} />
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
