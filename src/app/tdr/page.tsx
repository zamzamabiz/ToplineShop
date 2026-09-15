"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Button } from "@/components/ui/Button";
import { TdrPreviewBanner } from "@/components/tdr/TdrPreviewBanner";
import { TdrProjectManagementPanel } from "@/components/tdr/TdrProjectManagementPanel";
import { TdrMetricsGrid } from "@/components/tdr/TdrMetricsGrid";
import { TdrBatchTable } from "@/components/tdr/TdrBatchTable";
import { TdrQualityPanel } from "@/components/tdr/TdrQualityPanel";
import { TdrQuarantinePanel } from "@/components/tdr/TdrQuarantinePanel";
import { TdrSourceHealthPanel } from "@/components/tdr/TdrSourceHealthPanel";
import { TdrImportWorkflowPanel } from "@/components/tdr/TdrImportWorkflowPanel";
import { TDR_SCENARIOS, VIEW_STATE_LABELS } from "@/features/tdr/mockData";
import type { TdrViewState } from "@/types/tdr";
import { DatabaseZap, Upload, EyeOff, Settings, Eye } from "lucide-react";

const VIEW_STATES: TdrViewState[] = ["healthy", "empty", "loading", "warning", "failed", "disabled"];

function SkeletonBox({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ backgroundColor: "var(--surface-secondary)" }}
      aria-hidden="true"
    />
  );
}

function LoadingSkeleton() {
  return (
    <div role="status" aria-label="Loading Trade Data Refinery">
      {/* Visible explanatory banner — clarifies this is a preview state, not a broken page */}
      <div
        className="rounded-xl border px-6 py-5 mb-8 flex items-start gap-4"
        style={{ backgroundColor: "var(--surface-primary)", borderColor: "var(--border-default)" }}
      >
        <div
          className="mt-0.5 h-9 w-9 shrink-0 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "var(--surface-secondary)" }}
          aria-hidden="true"
        >
          <DatabaseZap className="h-5 w-5" style={{ color: "var(--brand-primary)" }} />
        </div>
        <div>
          <p className="text-base font-semibold mb-1">Loading Trade Data Refinery preview…</p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            This is a <strong style={{ color: "var(--text-secondary)" }}>frontend-only skeleton state</strong>.
            No backend, API, or database is connected. The page is not broken — skeleton cards below show the
            layout that will populate once data is available.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border p-6"
            style={{ backgroundColor: "var(--surface-primary)", borderColor: "var(--border-default)" }}
          >
            <SkeletonBox className="h-3 w-24 mb-3" />
            <SkeletonBox className="h-7 w-16" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div
            className="rounded-xl border"
            style={{ backgroundColor: "var(--surface-primary)", borderColor: "var(--border-default)" }}
          >
            <div className="px-6 py-4 border-b" style={{ borderColor: "var(--border-default)" }}>
              <SkeletonBox className="h-4 w-40" />
            </div>
            <div className="p-6 space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <SkeletonBox className="h-4 flex-1" />
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-4 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div
            className="rounded-xl border p-6"
            style={{ backgroundColor: "var(--surface-primary)", borderColor: "var(--border-default)" }}
          >
            <SkeletonBox className="h-4 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonBox key={i} className="h-12 rounded-lg" />
              ))}
            </div>
          </div>
        </div>
        <div className="space-y-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border p-6"
              style={{ backgroundColor: "var(--surface-primary)", borderColor: "var(--border-default)" }}
            >
              <SkeletonBox className="h-4 w-32 mb-4" />
              <SkeletonBox className="h-3 mb-2" />
              <SkeletonBox className="h-3 w-3/4 mb-2" />
              <SkeletonBox className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ModuleDisabledState() {
  return (
    <div
      className="rounded-xl border text-center py-16 px-8"
      style={{ backgroundColor: "var(--surface-primary)", borderColor: "var(--border-default)" }}
      role="status"
      aria-label="Trade Data Refinery module is disabled"
    >
      <EyeOff className="h-12 w-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
      <h2 className="text-xl font-semibold mb-2">Module Disabled</h2>
      <p className="text-sm max-w-md mx-auto" style={{ color: "var(--text-muted)" }}>
        The Trade Data Refinery module is currently disabled for this tenant. Contact your platform administrator to
        enable it.
      </p>
      <div className="mt-6">
        <Button
          variant="outline"
          disabled
          aria-label="Request access — not available in frontend preview"
          title="Access request requires backend and Auth/RBAC implementation"
        >
          <Settings className="h-4 w-4" aria-hidden="true" />
          Request Access
        </Button>
      </div>
    </div>
  );
}

export default function TdrPage() {
  const [viewState, setViewState] = useState<TdrViewState>("healthy");
  const [importWorkflowOpen, setImportWorkflowOpen] = useState(false);

  const scenario =
    viewState !== "loading" && viewState !== "disabled" ? TDR_SCENARIOS[viewState] : null;

  return (
    <AppShell dashboard="tdr">
      <div style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-8">
          <TdrPreviewBanner />

          {/* Page header */}
          <div className="mb-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div className="flex items-center gap-3">
                <DatabaseZap
                  className="h-6 w-6 shrink-0"
                  style={{ color: "var(--brand-primary)" }}
                  aria-hidden="true"
                />
                <div>
                  <h1 className="text-2xl font-bold">Trade Data Refinery</h1>
                  <p className="mt-0.5 text-sm" style={{ color: "var(--text-muted)" }}>
                    Ingest, validate, quarantine, and publish governed trade data records.
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 flex-wrap">
                <span
                  className="inline-flex items-center rounded-full px-3 py-1 text-xs font-medium"
                  style={{ backgroundColor: "#fef3c7", color: "#b45309" }}
                  aria-label="Module status: Frontend Preview"
                >
                  Frontend Preview
                </span>
                <Button
                  variant="outline"
                  onClick={() => setImportWorkflowOpen(true)}
                  aria-label="Open Import Workflow Preview — frontend demonstration only, no ingestion started"
                  title="View the planned import workflow steps — frontend preview only"
                >
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  Import Workflow Preview
                </Button>
                <Button
                  variant="default"
                  disabled
                  aria-label="New Import — backend not connected. Available after #FDD gate G1 and G2."
                  title="Import requires backend and database implementation — not available in this frontend preview"
                >
                  <Upload className="h-4 w-4" aria-hidden="true" />
                  New Import
                </Button>
              </div>
            </div>
          </div>

          {/* Project Management Panel */}
          <TdrProjectManagementPanel isModuleDisabled={viewState === "disabled"} />

          {/* Preview state selector */}
          <div
            className="rounded-lg border px-4 py-3 mb-8 flex items-center gap-3 flex-wrap"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
          >
            <label
              htmlFor="tdr-view-state"
              className="text-xs font-medium shrink-0"
              style={{ color: "var(--text-secondary)" }}
            >
              Preview state:
            </label>
            <select
              id="tdr-view-state"
              value={viewState}
              onChange={(e) => setViewState(e.target.value as TdrViewState)}
              className="text-sm rounded-md border px-3 py-1.5 focus:outline-none focus-visible:ring-2"
              style={{
                backgroundColor: "var(--surface-secondary)",
                borderColor: "var(--border-default)",
                color: "var(--text-primary)",
              }}
            >
              {VIEW_STATES.map((state) => (
                <option key={state} value={state}>
                  {VIEW_STATE_LABELS[state]}
                </option>
              ))}
            </select>
            <span className="text-xs" style={{ color: "var(--text-muted)" }}>
              Switch states to review all required UX scenarios.
            </span>
          </div>

          {/* State-conditional content */}
          {viewState === "loading" && <LoadingSkeleton />}
          {viewState === "disabled" && <ModuleDisabledState />}

          {scenario && (
            <>
              <TdrMetricsGrid metrics={scenario.metrics} />

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <TdrBatchTable key={viewState} batches={scenario.batches} />
                  <TdrSourceHealthPanel sources={scenario.sources} />
                </div>
                <div className="space-y-6">
                  <TdrQualityPanel quality={scenario.quality} />
                  <TdrQuarantinePanel quality={scenario.quality} />
                </div>
              </div>

              {/* Disabled import notice */}
              <div
                className="mt-6 rounded-lg border px-4 py-3 flex items-start gap-3"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
                role="note"
              >
                <Upload className="h-4 w-4 mt-0.5 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  <strong style={{ color: "var(--text-secondary)" }}>New Import is disabled.</strong>{" "}
                  Ingestion, file upload, and data processing require backend and database implementation gated behind
                  #FDD gate G1 (frontend freeze) and G2 (platform Auth/RBAC). Use{" "}
                  <button
                    type="button"
                    onClick={() => setImportWorkflowOpen(true)}
                    className="underline font-medium focus-visible:outline-none focus-visible:ring-2 rounded"
                    style={{ color: "var(--brand-primary)" }}
                  >
                    Import Workflow Preview
                  </button>{" "}
                  to explore the planned import workflow steps.
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {importWorkflowOpen && (
        <TdrImportWorkflowPanel onClose={() => setImportWorkflowOpen(false)} />
      )}
    </AppShell>
  );
}
