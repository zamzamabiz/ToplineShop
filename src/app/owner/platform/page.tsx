"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { api } from "@/lib/api-client";
import type { HealthData, VersionData, ApiError } from "@/types/api";
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  ShieldAlert,
  XCircle,
} from "lucide-react";

type LoadState = "loading" | "error" | "ready";

interface PlatformData {
  health: HealthData | null;
  version: VersionData | null;
}

export default function OwnerPlatformPage() {
  const [data, setData] = useState<PlatformData>({ health: null, version: null });
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
        const [healthRes, versionRes] = await Promise.all([
          api.getHealth().catch(() => null),
          api.getVersion().catch(() => null),
        ]);

        if (!mountedRef.current) return;

        setData({
          health: healthRes?.data ?? null,
          version: versionRes?.data ?? null,
        });
        setLoadState("ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load platform health data");
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
        const [healthRes, versionRes] = await Promise.all([
          api.getHealth().catch(() => null),
          api.getVersion().catch(() => null),
        ]);

        if (!mountedRef.current) return;

        setData({
          health: healthRes?.data ?? null,
          version: versionRes?.data ?? null,
        });
        setLoadState("ready");
      } catch (err) {
        if (!mountedRef.current) return;
        const apiErr = err as ApiError;
        setError(apiErr.message || "Failed to load platform health data");
        setLoadState("error");
      }
    }

    void loadData();
  }

  function StatusIcon({ status }: { status: string }) {
    if (status === "ok" || status === "configured") {
      return <CheckCircle className="h-4 w-4" style={{ color: "var(--state-success)" }} />;
    }
    return <XCircle className="h-4 w-4" style={{ color: "var(--state-danger)" }} />;
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
              <h1 className="text-2xl font-bold">Platform Health</h1>
              <Badge>Read-Only</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Monitor platform health status and version information
            </p>
          </div>

          <div
            className="rounded-lg border px-4 py-3 mb-8"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-start gap-3">
              <ShieldAlert className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} />
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                <strong>Read-Only Monitoring:</strong> Health monitoring is read-only.
                Remediation, configuration, deployment, secrets, and infrastructure actions are deferred.
              </div>
            </div>
          </div>

          {loadState === "loading" && (
            <div className="flex items-center justify-center py-20">
              <RefreshCw className="h-6 w-6 animate-spin" style={{ color: "var(--text-muted)" }} />
              <span className="ml-3 text-sm" style={{ color: "var(--text-muted)" }}>
                Loading platform health...
              </span>
            </div>
          )}

          {loadState === "error" && (
            <div
              className="rounded-lg border p-6 text-center"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            >
              <AlertTriangle className="h-8 w-8 mx-auto mb-3" style={{ color: "var(--state-danger)" }} />
              <h3 className="text-sm font-semibold">Failed to load platform health</h3>
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
            <div className="space-y-6">
              {/* Service Info */}
              <Card title="Service Information">
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Service</div>
                    <div className="mt-1 text-sm font-medium">
                      {data.version?.service ?? data.health?.service ?? "unavailable"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Version</div>
                    <div className="mt-1 text-sm font-medium">
                      {data.version?.version ?? data.health?.version ?? "unavailable"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Environment</div>
                    <div className="mt-1 text-sm font-medium">
                      {data.health?.environment ?? "unavailable"}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>Phase</div>
                    <div className="mt-1 text-sm font-medium">
                      {data.version?.phase ?? "unavailable"}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Health Checks */}
              <Card title="Health Checks">
                {data.health?.checks ? (
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(data.health.checks).map(([key, value]) => (
                      <div
                        key={key}
                        className="flex items-center gap-3 rounded-lg border p-3"
                        style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                      >
                        <StatusIcon status={value} />
                        <div>
                          <div className="text-sm font-medium capitalize">{key}</div>
                          <div className="text-xs" style={{ color: "var(--text-muted)" }}>{value}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                    Health check data unavailable
                  </p>
                )}
              </Card>

              {/* Overall Status */}
              <Card title="Overall Status">
                <div className="flex items-center gap-3">
                  {data.health?.status === "ok" ? (
                    <CheckCircle className="h-6 w-6" style={{ color: "var(--state-success)" }} />
                  ) : (
                    <XCircle className="h-6 w-6" style={{ color: "var(--state-danger)" }} />
                  )}
                  <div>
                    <div className="text-sm font-medium">
                      Platform Status: {data.health?.status ?? "unavailable"}
                    </div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Last checked: {new Date().toLocaleString()}
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="ml-auto" onClick={handleRetry}>
                    <RefreshCw className="h-4 w-4" />
                    Refresh
                  </Button>
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
