"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api-client";
import type { ApiError, VendorSummary } from "@/types/api";
import {
  ArrowLeft,
  AlertTriangle,
  Lock,
  RefreshCw,
  ShieldAlert,
  Store,
} from "lucide-react";

type LoadState = "loading" | "error" | "ready" | "empty";

export default function OwnerVendorsPage() {
  const [vendors, setVendors] = useState<VendorSummary[]>([]);
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
    async function loadVendors() {
      setLoadState("loading");
      setError(null);

      try {
        const res = await api.getVendors();
        if (!mountedRef.current) return;

        setVendors(res.data);
        setLoadState(res.data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load vendors");
        setLoadState("error");
      }
    }

    void loadVendors();
  }, []);

  function handleRetry() {
    async function loadVendors() {
      setLoadState("loading");
      setError(null);

      try {
        const res = await api.getVendors();
        if (!mountedRef.current) return;

        setVendors(res.data);
        setLoadState(res.data.length === 0 ? "empty" : "ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load vendors");
        setLoadState("error");
      }
    }

    void loadVendors();
  }

  function formatDate(dateStr: string): string {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateStr;
    }
  }

  return (
    <AppShell dashboard="owner">
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link
              href="/owner"
              className="inline-flex items-center gap-1 text-sm mb-3 hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Owner
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">Vendor Oversight</h1>
              <Badge>Read-Only</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Review all platform vendors without approval, suspension, or edit actions
            </p>
          </div>

          <div
            className="rounded-lg border px-4 py-3 mb-8"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <strong>Deferred Actions:</strong> Vendor approval, suspension, escalation,
                financial controls, write operations, and auth/RBAC enforcement are not available.
              </div>
            </div>
          </div>

          {loadState === "loading" && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
              <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading vendor oversight...
              </span>
            </div>
          )}

          {loadState === "error" && (
            <div
              className="rounded-lg border p-6 text-center"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            >
              <AlertTriangle className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--state-danger)" }} />
              <h3 className="text-sm font-semibold">Failed to load vendors</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {error}
              </p>
              <Button variant="outline" className="mt-4" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {loadState === "empty" && (
            <EmptyState
              icon={<Store className="h-12 w-12" />}
              title="No vendors found"
              description="There are no vendors available for owner oversight yet."
              action={
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              }
            />
          )}

          {loadState === "ready" && (
            <>
              <div className="mb-4 flex items-center justify-between gap-3">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {vendors.length} vendor{vendors.length !== 1 ? "s" : ""} under oversight
                </span>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              <div className="hidden md:block overflow-x-auto">
                <table
                  className="w-full rounded-lg overflow-hidden"
                  style={{ borderCollapse: "separate", borderSpacing: 0 }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "var(--surface-muted)" }}>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Vendor Name
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Vendor ID
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Tenant ID
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Status
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Created
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendors.map((vendor) => (
                      <tr
                        key={vendor.id}
                        className="border-t"
                        style={{ borderColor: "var(--border-default)" }}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{vendor.name}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {vendor.id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {vendor.tenantId.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="status">{vendor.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {formatDate(vendor.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" disabled title="Owner action (deferred)">
                              Review
                            </Button>
                            <Lock className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {vendors.map((vendor) => (
                  <div
                    key={vendor.id}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{vendor.name}</h3>
                        <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>
                          ID: {vendor.id.slice(0, 8)}...
                        </p>
                      </div>
                      <Badge variant="status">{vendor.status}</Badge>
                    </div>
                    <div className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                      Tenant: {vendor.tenantId.slice(0, 8)}...
                    </div>
                    <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t" style={{ borderColor: "var(--border-default)" }}>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Created: {formatDate(vendor.createdAt)}
                      </span>
                      <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          Actions deferred
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </AppShell>
  );
}
