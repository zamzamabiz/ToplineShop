"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AppShell } from "@/components/layout/AppShell";

// Read-only route-level error boundary for the public Product Detail route.
// Re-renders the same chrome (AppShell + breadcrumbs) so the failure state
// matches the rest of the marketplace and provides a safe recovery path.

export default function ProductDetailError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Read-only diagnostic hook. The Next.js error boundary already logs the
    // error server-side; we only surface a stable digest for support.
    if (error.digest) {
      // eslint-disable-next-line no-console
      console.error("Product detail route failed:", error.digest);
    }
  }, [error]);

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
            <Link
              href="/"
              className="hover:text-foreground transition-colors"
            >
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
            <span className="text-foreground font-medium">
              Unable to load
            </span>
          </nav>

          <div
            role="alert"
            aria-live="assertive"
            className="rounded-xl border border-border p-10 text-center"
            style={{ backgroundColor: "var(--surface-primary)" }}
          >
            <h1 className="text-xl font-bold mb-2">
              We couldn&rsquo;t load this product
            </h1>
            <p
              className="text-sm mb-6 max-w-md mx-auto"
              style={{ color: "var(--text-muted)" }}
            >
              Something went wrong while preparing this page. Please try
              again, or browse the full catalogue while we recover.
            </p>

            {error.digest && (
              <p
                className="text-xs mb-6 font-mono"
                style={{ color: "var(--text-muted)" }}
              >
                Reference: {error.digest}
              </p>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                type="button"
                onClick={reset}
                className="inline-flex items-center justify-center h-11 px-5 rounded-lg bg-primary text-primary-foreground font-medium text-sm hover:opacity-90 transition-opacity"
              >
                Try again
              </button>
              <Link
                href="/products"
                className="inline-flex items-center justify-center h-11 px-5 rounded-lg border border-border font-medium text-sm hover:bg-[var(--surface-muted)] transition-colors"
              >
                Browse all products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
