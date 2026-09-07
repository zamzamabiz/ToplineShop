import Link from "next/link";
import {
  ArrowRight,
  Store,
  LayoutDashboard,
  ShoppingBag,
  Truck,
  Shield,
  Crown,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
      <header className="border-b" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">T</span>
              </div>
              <span className="text-lg font-semibold">ToplineShop</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link href="/marketplace" className="text-sm font-medium hover:text-foreground transition-colors" style={{ color: "var(--text-muted)" }}>
                Marketplace
              </Link>
              <Link href="/app" className="text-sm font-medium hover:text-foreground transition-colors" style={{ color: "var(--text-muted)" }}>
                App Shell
              </Link>
              <Link href="/project-management" className="text-sm font-medium hover:text-foreground transition-colors" style={{ color: "var(--text-muted)" }}>
                Control Center
              </Link>
              <a
                href="https://github.com/zamzamabiz/ToplineShop"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium hover:text-foreground transition-colors flex items-center gap-1"
                style={{ color: "var(--text-muted)" }}
              >
                GitHub
              </a>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 mb-6">
              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                Phase 1 — Design System + UX Architecture
              </span>
              <span
                className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                style={{ backgroundColor: "rgba(34,197,94,0.1)", color: "var(--state-success)" }}
              >
                #FDD Active
              </span>
            </div>
            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
              ToplineShop
            </h1>
            <p className="mt-4 text-xl" style={{ color: "var(--text-muted)" }}>
              Greenfield Marketplace Platform
            </p>
            <p className="mt-6 text-lg leading-8" style={{ color: "var(--text-muted)" }}>
              Production marketplace being built from zero. Following{" "}
              <strong>#FDD</strong> (Frontend Development First) with{" "}
              <strong>#123</strong> governance protocol. Marketplace layout system
              and responsive UX foundations are now in place.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/marketplace"
                className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors inline-flex items-center gap-2"
              >
                Open Marketplace Preview
                <ArrowRight size={16} />
              </Link>
              <Link
                href="/project-management"
                className="rounded-md border px-6 py-3 text-sm font-semibold hover:bg-muted transition-colors"
                style={{ borderColor: "var(--border-default)" }}
              >
                Project Dashboard
              </Link>
            </div>
          </div>

          <div className="mt-20 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <Link
              href="/marketplace"
              className="rounded-xl border p-6 hover:border-primary/50 transition-colors group"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <Store size={20} className="text-primary" />
                <span className="font-semibold">Marketplace Preview</span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Public marketplace shell with hero, categories, product grid, vendor highlights, and B2B callout.
              </p>
              <div className="mt-4 text-xs text-primary font-medium group-hover:underline">
                Open Marketplace →
              </div>
            </Link>

            <Link
              href="/app"
              className="rounded-xl border p-6 hover:border-primary/50 transition-colors group"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <LayoutDashboard size={20} className="text-primary" />
                <span className="font-semibold">App Shell</span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Application shell with sidebar navigation, topbar, and module cards.
              </p>
              <div className="mt-4 text-xs text-primary font-medium group-hover:underline">
                Open Shell →
              </div>
            </Link>

            <Link
              href="/project-management"
              className="rounded-xl border p-6 hover:border-primary/50 transition-colors group"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            >
              <div className="flex items-center gap-3 mb-3">
                <span className="text-primary font-bold text-lg">P</span>
                <span className="font-semibold">Project Management</span>
              </div>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Dynamic dashboard driven by the canonical project registry.
              </p>
              <div className="mt-4 text-xs text-primary font-medium group-hover:underline">
                Open Dashboard →
              </div>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              { label: "Cart", href: "/cart", icon: ShoppingBag },
              { label: "Orders", href: "/orders", icon: ShoppingBag },
              { label: "B2B Wholesale", href: "/b2b", icon: Truck },
              { label: "Vendor SaaS", href: "/vendor", icon: Store },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border p-4 hover:border-primary/50 transition-colors text-center"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
              >
                <item.icon size={20} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <div className="text-sm font-medium">{item.label}</div>
              </Link>
            ))}
          </div>

          <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
            {[
              { label: "Admin Panel", href: "/admin", icon: Shield },
              { label: "Owner Control", href: "/owner", icon: Crown },
              { label: "Categories", href: "/categories", icon: Store },
            ].map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-lg border p-4 hover:border-primary/50 transition-colors text-center"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
              >
                <item.icon size={20} className="mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                <div className="text-sm font-medium">{item.label}</div>
              </Link>
            ))}
          </div>

          <div className="mt-12 rounded-xl border p-6" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
            <h3 className="font-semibold mb-4">Project Status</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-sm">
              <div>
                <div style={{ color: "var(--text-muted)" }}>Phase</div>
                <div className="font-medium">Phase 2 — Complete</div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)" }}>Frontend</div>
                <div className="font-medium text-blue-600">Frozen</div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)" }}>Backend</div>
                <div className="font-medium" style={{ color: "var(--text-muted)" }}>Phase 7</div>
              </div>
              <div>
                <div style={{ color: "var(--text-muted)" }}>Database</div>
                <div className="font-medium" style={{ color: "var(--text-muted)" }}>Phase 8</div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            ToplineShop v0.1.0 — Greenfield Development
          </p>
        </div>
      </footer>
    </div>
  );
}
