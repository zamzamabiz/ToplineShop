import Link from "next/link";
import { Bell, Search, User } from "lucide-react";

export function Topbar() {
  return (
    <header className="flex items-center justify-between h-16 px-6 border-b border-border bg-white dark:bg-zinc-900">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="h-9 w-64 rounded-md border border-input bg-background pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>
      <div className="flex items-center gap-4">
        <Link
          href="/project-management"
          className="text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          Control Center
        </Link>
        <button className="relative p-2 rounded-md hover:bg-muted transition-colors">
          <Bell size={18} />
          <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-primary" />
        </button>
        <button className="flex items-center gap-2 p-2 rounded-md hover:bg-muted transition-colors">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
