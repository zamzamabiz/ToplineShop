"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api-client";
import type { ApiError } from "@/types/api";
import {
  Users,
  Store,
  Tag,
  ShieldAlert,
  Headphones,
  Settings,
  BarChart3,
  FileText,
  AlertTriangle,
  RefreshCw,
  Database,
  Activity,
  Lock,
} from "lucide-react";

interface AdminMetrics {
  tenants: number;
  vendors: number;
  products: number;
  categories: number;
  apiStatus: string;
  dbStatus: string;
}

type LoadState = "loading" | "error" | "ready";

export default function AdminPage() {
  const [metrics, setMetrics] = useState<AdminMetrics>({
    tenants: 0,
    vendors: 0,
    products: 0,
    categories: 0,
    apiStatus: "unknown",
    dbStatus: "unknown",
  });
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    async function loadData() {
      setLoadState("loading");
      setError(null);

      try {
        const [tenantsRes, vendorsRes, productsRes, categoriesRes, healthRes] =
          await Promise.all([
            api.getTenants().catch(() => null),
            api.getVendors().catch(() => null),
            api.getProducts().catch(() => null),
            api.getCategories().catch(() => null),
            api.getHealth().catch(() => null),
          ]);

        if (!mountedRef.current) return;

        setMetrics({
          tenants: tenantsRes?.data.length ?? 0,
          vendors: vendorsRes?.data.length ?? 0,
          products: productsRes?.data.length ?? 0,
          categories: categoriesRes?.data.length ?? 0,
          apiStatus: healthRes?.data.checks.api ?? "unavailable",
          dbStatus: healthRes?.data.checks.database ?? "unavailable",
        });
        setLoadState("ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load admin data");
        setLoadState("error");
      }
    }

    void loadData();
  }, []);

  function handleRetry() {
    async function loadData() {
      setLoadState("loading");
      setError(null);

      try {
        const [tenantsRes, vendorsRes, productsRes, categoriesRes, healthRes] =
          await Promise.all([
            api.getTenants().catch(() => null),
            api.getVendors().catch(() => null),
            api.getProducts().catch(() => null),
            api.getCategories().catch(() => null),
            api.getHealth().catch(() => null),
          ]);

        if (!mountedRef.current) return;

        setMetrics({
          tenants: tenantsRes?.data.length ?? 0,
          vendors: vendorsRes?.data.length ?? 0,
          products: productsRes?.data.length ?? 0,
          categories: categoriesRes?.data.length ?? 0,
          apiStatus: healthRes?.data.checks.api ?? "unavailable",
          dbStatus: healthRes?.data.checks.database ?? "unavailable",
        });
        setLoadState("ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load admin data");
        setLoadState("error");
      }
    }

    void loadData();
  }

  return (
    <AppShell dashboard="admin">
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <Badge>Platform Operations</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Manage users, vendors, categories, and platform settings
            </p>
          </div>

          {/* Safety Banner */}
          <div
            className="rounded-lg border px-4 py-3 mb-8"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <strong>Read-Only Mode:</strong> Admin frontend is read-only in Phase 6.
                Auth/RBAC is not implemented. Approval, moderation, write, payment, settlement,
                and destructive actions are not available.
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loadState === "loading" && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
              <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading admin data...
              </span>
            </div>
          )}

          {/* Error State */}
          {loadState === "error" && (
            <div
              className="rounded-lg border p-6 text-center"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            >
              <AlertTriangle className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--state-danger)" }} />
              <h3 className="text-sm font-semibold">Failed to load admin data</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {error}
              </p>
              <Button variant="outline" className="mt-4" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {/* Ready State */}
          {loadState === "ready" && (
            <>
              {/* Platform Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 mb-8">
                <MetricCard
                  label="Tenants"
                  value={metrics.tenants}
                  icon={<Users className="h-5 w-5" />}
                />
                <MetricCard
                  label="Vendors"
                  value={metrics.vendors}
                  icon={<Store className="h-5 w-5" />}
                />
                <MetricCard
                  label="Products"
                  value={metrics.products}
                  icon={<Tag className="h-5 w-5" />}
                />
                <MetricCard
                  label="Categories"
                  value={metrics.categories}
                  icon={<BarChart3 className="h-5 w-5" />}
                />
              </div>

              {/* System Health */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">System Health</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div
                    className="rounded-xl border p-4 flex items-center gap-3"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <Activity className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                    <div>
                      <div className="text-sm font-medium">API Status</div>
                      <Badge variant="status">{metrics.apiStatus}</Badge>
                    </div>
                  </div>
                  <div
                    className="rounded-xl border p-4 flex items-center gap-3"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <Database className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                    <div>
                      <div className="text-sm font-medium">Database Status</div>
                      <Badge variant="status">{metrics.dbStatus}</Badge>
                    </div>
                  </div>
                </div>
              </div>

              {/* Admin Tools */}
              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Administration</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {/* Vendor Management - Available */}
                  <Link
                    href="/admin/vendors"
                    className="rounded-xl border p-5 hover:border-primary/50 transition-colors"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <Store className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                    <h3 className="font-semibold text-sm mt-3">Vendor Management</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      View and manage platform vendors
                    </p>
                    <div className="mt-3">
                      <Badge>READ-ONLY</Badge>
                    </div>
                  </Link>

                  {/* Product Management - Available */}
                  <Link
                    href="/admin/products"
                    className="rounded-xl border p-5 hover:border-primary/50 transition-colors"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <Tag className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                    <h3 className="font-semibold text-sm mt-3">Product Management</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      View all products on the platform
                    </p>
                    <div className="mt-3">
                      <Badge>READ-ONLY</Badge>
                    </div>
                  </Link>

                  {/* Category Management - Available */}
                  <Link
                    href="/admin/categories"
                    className="rounded-xl border p-5 hover:border-primary/50 transition-colors"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <BarChart3 className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                    <h3 className="font-semibold text-sm mt-3">Category Management</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      View and organize product categories
                    </p>
                    <div className="mt-3">
                      <Badge>READ-ONLY</Badge>
                    </div>
                  </Link>

                  {/* Other tools - Deferred */}
                  {[
                    { title: "User Management", desc: "View, suspend, and manage platform users", icon: Users },
                    { title: "Content Moderation", desc: "Review flagged content and listings", icon: ShieldAlert },
                    { title: "Support Queue", desc: "Manage customer and vendor support tickets", icon: Headphones },
                    { title: "Platform Settings", desc: "Configure platform-wide settings", icon: Settings },
                    { title: "Analytics", desc: "Platform-wide analytics and reporting", icon: BarChart3 },
                    { title: "Audit Logs", desc: "System activity and change history", icon: FileText },
                  ].map((item) => (
                    <div
                      key={item.title}
                      className="rounded-xl border p-5 opacity-60"
                      style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                    >
                      <div className="flex items-center gap-2">
                        <item.icon className="h-5 w-5" style={{ color: "var(--text-muted)" }} />
                        <Lock className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                      </div>
                      <h3 className="font-semibold text-sm mt-3">{item.title}</h3>
                      <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                        {item.desc}
                      </p>
                      <div className="mt-3">
                        <Badge>DEFERRED</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
