"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
    <aside
      className="flex flex-col w-64 border-r"
      style={{
        backgroundColor: "var(--sidebar-background)",
        borderColor: "var(--border-default)",
      }}
    >
      <div
        className="flex items-center h-16 px-4 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <Link href="/" className="flex items-center gap-2">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: "var(--sidebar-active)" }}
          >
            <span className="text-sm font-bold" style={{ color: "var(--text-inverse)" }}>
              T
            </span>
          </div>
          <span className="font-semibold" style={{ color: "var(--sidebar-text)" }}>
            ToplineShop
          </span>
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
                  className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--interactive-active)" : "transparent",
                    color: isActive ? "var(--sidebar-active)" : "var(--sidebar-text)",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "var(--interactive-hover)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <item.icon size={18} />
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      <div
        className="border-t p-4"
        style={{ borderColor: "var(--border-default)" }}
      >
        <div className="text-xs" style={{ color: "var(--text-muted)" }}>
          Phase 3 - Theme System
        </div>
      </div>
    </aside>
  );
}
