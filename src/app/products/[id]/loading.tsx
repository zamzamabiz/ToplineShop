import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";

// Read-only loading skeleton for the public Product Detail route.
// Mirrors the page's layout (breadcrumbs, media + info column, specs, related grid)
// so the perceived shape stays stable while data resolves.

function SkeletonBlock({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-md bg-[var(--surface-muted)] ${className ?? ""}`}
      style={style}
    />
  );
}

export default function ProductDetailLoading() {
  return (
    <AppShell>
      <div
        className="min-h-screen"
        style={{ backgroundColor: "var(--app-canvas)" }}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav
            className="flex items-center gap-1.5 text-sm mb-6"
            style={{ color: "var(--text-muted)" }}
            aria-label="Breadcrumb"
          >
            <Link href="/" className="hover:text-foreground transition-colors">
              Home
            </Link>
            <span>/</span>
            <Link
              href="/products"
              className="hover:text-foreground transition-colors"
            >
              Products
            </Link>
            <span>/</span>
            <SkeletonBlock className="h-4 w-24" />
          </nav>

          <div
            role="status"
            aria-live="polite"
            aria-label="Loading product details"
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12"
          >
            <div
              className="rounded-xl border border-border overflow-hidden"
              style={{ backgroundColor: "var(--surface-primary)" }}
            >
              <SkeletonBlock className="aspect-square w-full rounded-none" />
            </div>

            <div className="space-y-6">
              <div>
                <SkeletonBlock className="h-4 w-32 mb-2" />
                <SkeletonBlock className="h-7 w-3/4 mb-2" />
                <SkeletonBlock className="h-4 w-1/2" />
              </div>

              <div className="flex items-baseline gap-3">
                <SkeletonBlock className="h-8 w-28" />
                <SkeletonBlock className="h-5 w-20" />
              </div>

              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-5 w-40" />
              </div>

              <div className="flex items-center gap-2">
                <SkeletonBlock className="h-6 w-20 rounded-full" />
              </div>

              <SkeletonBlock className="h-16 w-full" />

              <div className="space-y-3 pt-4 border-t border-border">
                <SkeletonBlock className="h-11 w-full rounded-lg" />
                <SkeletonBlock className="h-11 w-full rounded-lg" />
                <SkeletonBlock className="h-3 w-64 mx-auto" />
              </div>

              <div className="rounded-lg p-4 space-y-2 text-sm">
                <SkeletonBlock className="h-4 w-3/4" />
                <SkeletonBlock className="h-4 w-2/3" />
                <SkeletonBlock className="h-4 w-1/2" />
                <SkeletonBlock className="h-4 w-2/3" />
              </div>
            </div>
          </div>

          <div className="mb-12">
            <SkeletonBlock className="h-6 w-40 mb-4" />
            <div className="rounded-xl border border-border overflow-hidden">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="flex"
                  style={{
                    backgroundColor:
                      idx % 2 === 0 ? "var(--surface-muted)" : undefined,
                  }}
                >
                  <SkeletonBlock className="h-10 w-1/3 rounded-none" />
                  <SkeletonBlock className="h-10 flex-1 rounded-none" />
                </div>
              ))}
            </div>
          </div>

          <div className="mb-8">
            <SkeletonBlock className="h-6 w-48 mb-4" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-border overflow-hidden"
                  style={{ backgroundColor: "var(--surface-primary)" }}
                >
                  <SkeletonBlock className="aspect-square w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <SkeletonBlock className="h-4 w-3/4" />
                    <SkeletonBlock className="h-5 w-1/2" />
                    <SkeletonBlock className="h-4 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
