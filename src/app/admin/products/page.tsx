"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { api } from "@/lib/api-client";
import type { ProductSummary, ApiError } from "@/types/api";
import {
  Tag,
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Lock,
} from "lucide-react";

type LoadState = "loading" | "error" | "ready" | "empty";

export default function AdminProductsPage() {
  const [products, setProducts] = useState<ProductSummary[]>([]);
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
    async function loadProducts() {
      setLoadState("loading");
      setError(null);

      try {
        const res = await api.getProducts();
        if (!mountedRef.current) return;

        if (res.data.length === 0) {
          setLoadState("empty");
        } else {
          setProducts(res.data);
          setLoadState("ready");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load products");
        setLoadState("error");
      }
    }

    void loadProducts();
  }, []);

  function handleRetry() {
    async function loadProducts() {
      setLoadState("loading");
      setError(null);

      try {
        const res = await api.getProducts();
        if (!mountedRef.current) return;

        if (res.data.length === 0) {
          setLoadState("empty");
        } else {
          setProducts(res.data);
          setLoadState("ready");
        }
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load products");
        setLoadState("error");
      }
    }

    void loadProducts();
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
              <h1 className="text-2xl font-bold">Product Management</h1>
              <Badge>Read-Only</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              View all products on the platform
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
                <strong>Deferred Actions:</strong> Product creation, edit, moderation, approval,
                deletion, pricing, inventory, and write actions are not available.
                Write APIs and auth/RBAC are not implemented.
              </div>
            </div>
          </div>

          {/* Loading State */}
          {loadState === "loading" && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
              <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading products...
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
              <h3 className="text-sm font-semibold">Failed to load products</h3>
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
              icon={<Tag className="h-12 w-12" />}
              title="No products found"
              description="There are no products on the platform yet."
              action={
                <Button variant="outline" onClick={handleRetry}>
                  <RefreshCw className="h-4 w-4" />
                  Refresh
                </Button>
              }
            />
          )}

          {/* Product List */}
          {loadState === "ready" && (
            <>
              <div className="mb-4 flex items-center justify-between">
                <span className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {products.length} product{products.length !== 1 ? "s" : ""} found
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
                        Product Name
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Product ID
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Vendor ID
                      </th>
                      <th className="text-left text-xs font-medium px-4 py-3" style={{ color: "var(--text-muted)" }}>
                        Category ID
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
                    {products.map((product) => (
                      <tr
                        key={product.id}
                        className="border-t"
                        style={{ borderColor: "var(--border-default)" }}
                      >
                        <td className="px-4 py-3 text-sm font-medium">{product.name}</td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {product.id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {product.vendorId.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {product.categoryId.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                          {product.tenantId.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3">
                          <Badge variant="status">{product.status}</Badge>
                        </td>
                        <td className="px-4 py-3 text-sm" style={{ color: "var(--text-muted)" }}>
                          {formatDate(product.createdAt)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" disabled title="View details (deferred)">
                              View
                            </Button>
                            <Lock className="h-3 w-3" style={{ color: "var(--text-muted)" }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="rounded-xl border p-4"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold text-sm">{product.name}</h3>
                        <p className="text-xs font-mono mt-1" style={{ color: "var(--text-muted)" }}>
                          ID: {product.id.slice(0, 8)}...
                        </p>
                      </div>
                      <Badge variant="status">{product.status}</Badge>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-2 text-xs" style={{ color: "var(--text-muted)" }}>
                      <span>Vendor: {product.vendorId.slice(0, 8)}...</span>
                      <span>Category: {product.categoryId.slice(0, 8)}...</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t" style={{ borderColor: "var(--border-default)" }}>
                      <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                        Created: {formatDate(product.createdAt)}
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
