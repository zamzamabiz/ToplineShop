"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api-client";
import type { CategorySummary, ApiError } from "@/types/api";
import {
  BarChart3,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Lock,
} from "lucide-react";

type LoadState = "loading" | "error" | "ready" | "empty";

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategorySummary[]>([]);
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
    async function loadCategories() {
      setLoadState("loading");
      setError(null);

      try {
        const res = await api.getCategories();
        if (!mountedRef.current) return;

        if (res.data.length === 0) {
          setLoadState("empty");
        } else {
          setCategories(res.data);
          setLoadState("ready");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load categories");
        setLoadState("error");
      }
    }

    void loadCategories();
  }, []);

  function handleRetry() {
    async function loadCategories() {
      setLoadState("loading");
      setError(null);

      try {
        const res = await api.getCategories();
        if (!mountedRef.current) return;

        if (res.data.length === 0) {
          setLoadState("empty");
        } else {
          setCategories(res.data);
          setLoadState("ready");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load categories");
        setLoadState("error");
      }
    }

    void loadCategories();
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
    <AppShell dashboard="admin">
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-1 text-sm mb-3 hover:underline"
              style={{ color: "var(--text-muted)" }}
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Admin
            </Link>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Category Management</h1>
              <Badge>Read-Only</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              View all product categories on the platform
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
                <strong>Deferred Actions:</strong> Category create, edit, delete, and reorder
                actions are not available. Write APIs and auth/RBAC are not implemented.
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loadState === "loading" && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
              <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading categories...
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
              <h3 className="text-sm font-semibold">Failed to load categories</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
                {error}
              </p>
              <Button variant="outline" className="mt-4" onClick={handleRetry}>
                <RefreshCw className="h-4 w-4" />
                Retry
              </Button>
            </div>
          )}

          {/* Empty State */}
          {loadState === "empty" && (
            <EmptyState
              icon={<BarChart3 className="h-12 w-12" />}
              title="No categories found"
              description="There are no categories on the platform yet."
              action={
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              }
            />
          )}

          {/* Category List */}
          {loadState === "ready" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {categories.length} categor{categories.length !== 1 ? "ies" : "y"} found
                </span>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table
                  className="w-full rounded-lg overflow-hidden"
                  style={{ borderCollapse: "separate", borderSpacing: 0 }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "var(--surface-muted)" }}>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Category Name
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Category ID
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Tenant ID
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Parent ID
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Sort Order
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
                    {categories.map((category) => (
                      <tr
                        key={category.id}
                        className="border-t"
                        style={{ borderColor: "var(--border-default)" }}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{category.name}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {category.id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {category.tenantId.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {category.parentId ? `${category.parentId.slice(0, 8)}...` : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {category.sortOrder}
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="status">{category.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {formatDate(category.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/admin/categories/${category.id}`}
                              className="inline-flex items-center justify-center rounded-md text-sm font-medium h-9 px-3 hover:opacity-80 transition-colors"
                              style={{ backgroundColor: "transparent", color: "var(--text-secondary)" }}
                            >
                              View
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{category.name}</h3>
                        <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>
                          ID: {category.id.slice(0, 8)}...
                        </p>
                      </div>
                      <Badge variant="status">{category.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      {category.parentId && (
                        <span>Parent: {category.parentId.slice(0, 8)}...</span>
                      )}
                      <span>Sort: {category.sortOrder}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border-default)" }}>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Created: {formatDate(category.createdAt)}
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
