"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import { projectRegistry } from "@/project/projectRegistry";
import type { ApiError } from "@/types/api";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Database,
  FileText,
  Lock,
  RefreshCw,
  ShieldAlert,
  Store,
  Tag,
  Users,
} from "lucide-react";

interface OwnerMetrics {
  tenants: number;
  vendors: number;
  products: number;
  apiStatus: string;
  dbStatus: string;
}

type LoadState = "loading" | "error" | "ready";

export default function OwnerPage() {
  const [metrics, setMetrics] = useState<OwnerMetrics>({
    tenants: 0,
    vendors: 0,
    products: 0,
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
        const [tenantsRes, vendorsRes, productsRes, healthRes] =
          await Promise.all([
            api.getTenants().catch(() => null),
            api.getVendors().catch(() => null),
            api.getProducts().catch(() => null),
            api.getHealth().catch(() => null),
          ]);

        if (!mountedRef.current) return;

        setMetrics({
          tenants: tenantsRes?.data.length ?? 0,
          vendors: vendorsRes?.data.length ?? 0,
          products: productsRes?.data.length ?? 0,
          apiStatus: healthRes?.data.checks.api ?? "unavailable",
          dbStatus: healthRes?.data.checks.database ?? "unavailable",
        });
        setLoadState("ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load owner dashboard data");
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
        const [tenantsRes, vendorsRes, productsRes, healthRes] =
          await Promise.all([
            api.getTenants().catch(() => null),
            api.getVendors().catch(() => null),
            api.getProducts().catch(() => null),
            api.getHealth().catch(() => null),
          ]);

        if (!mountedRef.current) return;

        setMetrics({
          tenants: tenantsRes?.data.length ?? 0,
          vendors: vendorsRes?.data.length ?? 0,
          products: productsRes?.data.length ?? 0,
          apiStatus: healthRes?.data.checks.api ?? "unavailable",
          dbStatus: healthRes?.data.checks.database ?? "unavailable",
        });
        setLoadState("ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load owner dashboard data");
        setLoadState("error");
      }
    }

    void loadData();
  }

  return (
    <AppShell dashboard="owner">
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">Owner Control Center</h1>
              <Badge>Executive Dashboard</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Platform oversight using Phase 5 read-only API data
            </p>
          </div>

          <div
            className="rounded-lg border px-4 py-3 mb-8"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <strong>Read-Only Mode:</strong> Owner frontend is read-only in Phase 6.
                Auth/RBAC, revenue actions, settlements, write operations, and financial
                execution are deferred.
              </div>
            </div>
          </div>

          {loadState === "loading" && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
              <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading owner dashboard data...
              </span>
            </div>
          )}

          {loadState === "error" && (
            <div
              className="rounded-lg border p-6 text-center"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            >
              <AlertTriangle className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--state-danger)" }} />
              <h3 className="text-sm font-semibold">Failed to load owner data</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {error}
              </p>
              <Button variant="outline" className="mt-4" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {loadState === "ready" && (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
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
              </div>

              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Platform Health</h2>
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

              <div className="mb-8">
                <h2 className="text-lg font-semibold mb-4">Oversight</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Link
                    href="/owner/vendors"
                    className="rounded-xl border p-5 hover:border-primary/50 transition-colors"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <Store className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                    <h3 className="font-semibold text-sm mt-3">Vendor Oversight</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Review platform vendors from the read-only API
                    </p>
                    <div className="mt-3">
                      <Badge>READ-ONLY</Badge>
                    </div>
                  </Link>

                  <Link
                    href="/owner/products"
                    className="rounded-xl border p-5 hover:border-primary/50 transition-colors"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <Tag className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                    <h3 className="font-semibold text-sm mt-3">Product Oversight</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Review all platform products without write actions
                    </p>
                    <div className="mt-3">
                      <Badge>READ-ONLY</Badge>
                    </div>
                  </Link>

                  <Link
                    href="/owner/platform"
                    className="rounded-xl border p-5 hover:border-primary/50 transition-colors"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <Activity className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
                    <h3 className="font-semibold text-sm mt-3">Platform Health Detail</h3>
                    <p className="mt-1 text-xs" style={{ color: "var(--text-muted)" }}>
                      Monitor platform health status and version information
                    </p>
                    <div className="mt-3">
                      <Badge>READ-ONLY</Badge>
                    </div>
                  </Link>

                  {[
                    { title: "Risk & Compliance", desc: "Compliance workflows require later auth/RBAC", icon: ShieldAlert },
                    { title: "Financial Controls", desc: "Revenue and settlement actions remain deferred", icon: BarChart3 },
                    { title: "Audit Reports", desc: "Audit read views are not available in Phase 6", icon: FileText },
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

              <Card title="Development Progress">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Current Phase</div>
                    <div className="mt-1 text-sm font-medium">{projectRegistry.currentPhase}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Overall Progress</div>
                    <div className="mt-1 text-sm font-medium">{projectRegistry.overallCompletion}%</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Last Completed</div>
                    <div className="mt-1 text-sm font-medium">{projectRegistry.lastCompletedTask}</div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Next Planned</div>
                    <div className="mt-1 text-sm font-medium">{projectRegistry.nextPlannedTask}</div>
                  </div>
                </div>
              </Card>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
