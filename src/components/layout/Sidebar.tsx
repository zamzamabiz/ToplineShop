"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Store,
  Tag,
  Package,
  ShoppingCart,
  ShoppingBag,
  Truck,
  Shield,
  Crown,
  Settings,
} from "lucide-react";

const navItems = [
  { label: "Dashboard", href: "/app", icon: LayoutDashboard },
  { label: "Marketplace", href: "/marketplace", icon: Store },
  { label: "Categories", href: "/categories", icon: Tag },
  { label: "Products", href: "/products", icon: Package },
  { label: "B2B Wholesale", href: "/b2b", icon: Truck },
  { label: "Cart", href: "/cart", icon: ShoppingCart },
  { label: "Orders", href: "/orders", icon: ShoppingBag },
  { label: "Vendor SaaS", href: "/vendor", icon: Settings },
  { label: "Admin", href: "/admin", icon: Shield },
  { label: "Owner Control", href: "/owner", icon: Crown },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex flex-col w-64 border-r border-border bg-white dark:bg-zinc-900">
      <div className="flex items-center h-16 px-4 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-sm font-bold text-primary-foreground">T</span>
          </div>
          <span className="font-semibold">ToplineShop</span>
        </Link>
      </div>
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div className="border-t border-border p-4">
        <div className="text-xs text-muted-foreground">
          Phase 1 — Design System
        </div>
      </div>
    </aside>
  );
}
