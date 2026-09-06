import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <header className="border-b border-border bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-sm font-bold text-primary-foreground">
                  T
                </span>
              </div>
              <span className="text-lg font-semibold">ToplineShop</span>
            </div>
            <nav className="flex items-center gap-6">
              <Link
                href="/project-management"
                className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Project Control Center
              </Link>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-2xl">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
              ToplineShop
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground">
              Production marketplace platform. Greenfield development following
              #FDD (Frontend Development First) with #123 governance protocol.
            </p>
            <div className="mt-10 flex items-center gap-x-6">
              <Link
                href="/project-management"
                className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors"
              >
                Open Control Center
              </Link>
              <span className="text-sm text-muted-foreground">
                Phase 0 — Foundation & Project Control
              </span>
            </div>
          </div>

          <div className="mt-16 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6">
              <div className="text-sm font-medium text-muted-foreground">
                Status
              </div>
              <div className="mt-2 text-2xl font-bold text-warning">
                In Progress
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Phase 0 — Foundation
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6">
              <div className="text-sm font-medium text-muted-foreground">
                Frontend
              </div>
              <div className="mt-2 text-2xl font-bold text-success">Active</div>
              <div className="mt-1 text-sm text-muted-foreground">
                Next.js + React + TypeScript + Tailwind
              </div>
            </div>
            <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6">
              <div className="text-sm font-medium text-muted-foreground">
                Backend
              </div>
              <div className="mt-2 text-2xl font-bold text-muted-foreground">
                Not Started
              </div>
              <div className="mt-1 text-sm text-muted-foreground">
                Planned — Phase 7
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-border bg-white dark:bg-zinc-900">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-sm text-muted-foreground">
            ToplineShop v0.1.0 — Greenfield Development
          </p>
        </div>
      </footer>
    </div>
  );
}
