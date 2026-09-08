"use client";

import { useState, useRef, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import type { ProductSummary, ApiError } from "@/types/api";
import {
  ArrowLeft,
  AlertTriangle,
  RefreshCw,
  ShieldAlert,
  Lock,
} from "lucide-react";

type LoadState = "loading" | "error" | "ready" | "not-found";

export default function OwnerProductDetailPage() {
  const params = useParams();
  const id = params.id as string;

  const [product, setProduct] = useState<ProductSummary | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    async function loadProduct() {
      setLoadState("loading");
      setError(null);
      try {
        const res = await api.getProduct(id);
        if (!mountedRef.current) return;
        setProduct(res.data);
        setLoadState("ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 404) { setLoadState("not-found"); }
        else { setError(apiErr.message || "Failed to load product"); setLoadState("error"); }
      }
    }
    void loadProduct();
  }, [id]);

  function handleRetry() {
    async function loadProduct() {
      setLoadState("loading");
      setError(null);
      try {
        const res = await api.getProduct(id);
        if (!mountedRef.current) return;
        setProduct(res.data);
        setLoadState("ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        if (apiErr.status === 404) { setLoadState("not-found"); }
        else { setError(apiErr.message || "Failed to load product"); setLoadState("error"); }
      }
    }
    void loadProduct();
  }

  function formatDate(dateStr: string): string {
    try { return new Date(dateStr).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }); }
    catch { return dateStr; }
  }

  return (
    <AppShell dashboard="owner">
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <Link href="/owner/products" className="inline-flex items-center gap-1 text-sm mb-3 hover:underline" style={{ color: "var(--text-muted)" }}>
              <ArrowLeft className="h-4 w-4" /> Back to Product Oversight
            </Link>
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-bold">Product Detail</h1>
              <Badge>Read-Only</Badge>
            </div>
          </div>

          <div className="rounded-lg border px-4 py-3 mb-8" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}>
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <strong>Deferred Actions:</strong> Product moderation, approval, deletion, pricing, inventory, and settlement actions are not available.
              </div>
            </div>
          </div>

          {loadState === "loading" && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
              <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>Loading product...</span>
            </div>
          )}

          {loadState === "error" && (
            <div className="rounded-lg border p-6 text-center" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
              <AlertTriangle className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--state-danger)" }} />
              <h3 className="text-sm font-semibold">Failed to load product</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>{error}</p>
              <Button variant="outline" className="mt-4" onClick={handleRetry}><RefreshCw className="h-4 w-4" /> Retry</Button>
            </div>
          )}

          {loadState === "not-found" && (
            <div className="rounded-lg border p-6 text-center" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
              <h3 className="text-sm font-semibold">Product Not Found</h3>
              <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>The product you are looking for does not exist.</p>
              <Link href="/owner/products" className="inline-block mt-4 text-sm hover:underline" style={{ color: "var(--brand-primary)" }}>Back to product oversight</Link>
            </div>
          )}

          {loadState === "ready" && product && (
            <Card title="Product Information">
              <div className="grid gap-4 sm:grid-cols-2">
                <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Name</div><div className="mt-1 text-sm font-medium">{product.name}</div></div>
                <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Status</div><div className="mt-1"><Badge variant="status">{product.status}</Badge></div></div>
                <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Product ID</div><div className="mt-1 text-sm font-mono">{product.id}</div></div>
                <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Vendor ID</div><div className="mt-1 text-sm font-mono">{product.vendorId}</div></div>
                <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Category ID</div><div className="mt-1 text-sm font-mono">{product.categoryId}</div></div>
                <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Tenant ID</div><div className="mt-1 text-sm font-mono">{product.tenantId}</div></div>
                <div><div className="text-xs" style={{ color: "var(--text-muted)" }}>Created</div><div className="mt-1 text-sm">{formatDate(product.createdAt)}</div></div>
              </div>
              <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" style={{ color: "var(--text-muted)" }} />
                  <span className="text-sm" style={{ color: "var(--text-muted)" }}>Moderation, approval, and settlement actions are deferred</span>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </AppShell>
  );
}
