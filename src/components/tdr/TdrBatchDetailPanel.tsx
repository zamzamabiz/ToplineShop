"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, CheckCircle2, AlertTriangle, XCircle, Clock, Ban,
  ShieldOff, Download, RefreshCw, Send,
} from "lucide-react";
import type { TdrMockBatch, TdrBatchStatus } from "@/types/tdr";

// ---------------------------------------------------------------------------
// Mock detail derivation — computed from existing TdrBatch fields.
// Replace with a single server-side fetch in production.
// ---------------------------------------------------------------------------

type CheckpointState = "done" | "warning" | "error" | "pending" | "disabled";

interface Checkpoint {
  label: string;
  state: CheckpointState;
}

interface QualityIssue {
  label: string;
  count: number;
}

interface MockDetail {
  fileType: string;
  submittedBy: string;
  processingMode: string;
  warningCount: number;
  errorCount: number;
  fatalCount: number;
  publishedCount: number;
  qualityScore: number;
  checkpoints: Checkpoint[];
  issues: QualityIssue[];
}

const SOURCE_CONFIG: Record<string, Pick<MockDetail, "fileType" | "submittedBy">> = {
  "Global Trade Registry":    { fileType: "JSON Feed",           submittedBy: "Auto-Ingest Connector v2" },
  "Asia-Pacific Customs API": { fileType: "REST API Response",   submittedBy: "API Gateway Connector" },
  "EU Trade Data Feed":       { fileType: "CSV Import",          submittedBy: "File Ingest Service" },
  "Americas Logistics Index": { fileType: "SFTP Upload",         submittedBy: "SFTP Ingest Daemon" },
};

const CHECKPOINTS: Record<TdrBatchStatus, Checkpoint[]> = {
  QUEUED: [
    { label: "File received",                  state: "done" },
    { label: "Schema detection",               state: "pending" },
    { label: "Field mapping",                  state: "pending" },
    { label: "Validation",                     state: "pending" },
    { label: "Quarantine review",              state: "pending" },
    { label: "Publish",                        state: "disabled" },
  ],
  PROCESSING: [
    { label: "File received",                  state: "done" },
    { label: "Schema detection",               state: "done" },
    { label: "Field mapping",                  state: "done" },
    { label: "Validation — in progress",       state: "pending" },
    { label: "Quarantine review",              state: "pending" },
    { label: "Publish",                        state: "disabled" },
  ],
  ACCEPTED: [
    { label: "File received",                  state: "done" },
    { label: "Schema detection",               state: "done" },
    { label: "Field mapping",                  state: "done" },
    { label: "Validation complete",            state: "done" },
    { label: "Quarantine review",              state: "done" },
    { label: "Published",                      state: "done" },
  ],
  PARTIAL: [
    { label: "File received",                  state: "done" },
    { label: "Schema detection",               state: "done" },
    { label: "Field mapping",                  state: "warning" },
    { label: "Validation complete (partial)",  state: "warning" },
    { label: "Quarantine review pending",      state: "warning" },
    { label: "Publish — blocked, review first", state: "disabled" },
  ],
  FAILED: [
    { label: "File received",                  state: "done" },
    { label: "Schema detection",               state: "done" },
    { label: "Field mapping",                  state: "error" },
    { label: "Validation failed",              state: "error" },
    { label: "Quarantine review required",     state: "error" },
    { label: "Publish blocked",                state: "disabled" },
  ],
};

const ISSUES: Record<TdrBatchStatus, (q: number) => QualityIssue[]> = {
  ACCEPTED:   (q) => q > 0 ? [
    { label: "HS code mismatch",          count: Math.round(q * 0.40) },
    { label: "Country name variant",      count: Math.round(q * 0.35) },
    { label: "Date format warning",       count: Math.round(q * 0.25) },
  ] : [],
  PARTIAL:    (q) => [
    { label: "Missing HS code",           count: Math.round(q * 0.35) },
    { label: "Invalid country name",      count: Math.round(q * 0.25) },
    { label: "Quantity unit mismatch",    count: Math.round(q * 0.25) },
    { label: "Duplicate shipment ref.",   count: Math.round(q * 0.15) },
  ],
  FAILED:     (q) => [
    { label: "Schema validation failure", count: Math.round(q * 0.40) },
    { label: "Missing required fields",   count: Math.round(q * 0.35) },
    { label: "Fatal parse error",         count: Math.round(q * 0.25) },
  ],
  PROCESSING: () => [],
  QUEUED:     () => [],
};

function buildMockDetail(batch: TdrMockBatch): MockDetail {
  const src = SOURCE_CONFIG[batch.sourceName] ?? {
    fileType: "Data Feed",
    submittedBy: "Ingest Service",
  };
  const q = batch.quarantineCount;

  let warningCount = 0, errorCount = 0, fatalCount = 0;
  if (batch.status === "ACCEPTED") {
    warningCount = Math.round(q * 0.70);
    errorCount   = Math.round(q * 0.25);
    fatalCount   = Math.max(0, q - warningCount - errorCount);
  } else if (batch.status === "PARTIAL") {
    warningCount = Math.round(q * 0.40);
    errorCount   = Math.round(q * 0.40);
    fatalCount   = Math.max(0, q - warningCount - errorCount);
  } else if (batch.status === "FAILED") {
    warningCount = Math.round(q * 0.10);
    errorCount   = Math.round(q * 0.30);
    fatalCount   = Math.max(0, q - warningCount - errorCount);
  }

  const total = batch.acceptedCount + batch.quarantineCount;
  const qualityScore = total > 0
    ? Math.round((batch.acceptedCount / total) * 1000) / 10
    : 0;

  const publishedCount =
    batch.status === "ACCEPTED" ? batch.acceptedCount :
    batch.status === "PARTIAL"  ? Math.round(batch.acceptedCount * 0.7) :
    0;

  const checkpoints = CHECKPOINTS[batch.status] ?? CHECKPOINTS["QUEUED"];

  // Update quarantine checkpoint dynamically for ACCEPTED batches
  const resolvedCheckpoints =
    batch.status === "ACCEPTED" && q > 0
      ? checkpoints.map((c) =>
          c.label === "Quarantine review" ? { ...c, state: "warning" as CheckpointState } : c,
        )
      : checkpoints;

  return {
    ...src,
    processingMode: "Batch Processing (Mock Preview)",
    warningCount,
    errorCount,
    fatalCount,
    publishedCount,
    qualityScore,
    checkpoints: resolvedCheckpoints,
    issues: (ISSUES[batch.status] ?? ISSUES["QUEUED"])(q),
  };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const CHECKPOINT_ICON: Record<CheckpointState, React.ReactNode> = {
  done:     <CheckCircle2 className="h-4 w-4 shrink-0" style={{ color: "#16a34a" }} aria-hidden="true" />,
  warning:  <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ea580c" }} aria-hidden="true" />,
  error:    <XCircle className="h-4 w-4 shrink-0" style={{ color: "#dc2626" }} aria-hidden="true" />,
  pending:  <Clock className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />,
  disabled: <Ban className="h-4 w-4 shrink-0" style={{ color: "var(--text-muted)" }} aria-hidden="true" />,
};

const STATUS_MAP: Record<TdrBatchStatus, { label: string; bg: string; text: string }> = {
  ACCEPTED:   { label: "Accepted",   bg: "#dcfce7", text: "#16a34a" },
  PARTIAL:    { label: "Partial",    bg: "#ffedd5", text: "#ea580c" },
  FAILED:     { label: "Failed",     bg: "#fee2e2", text: "#dc2626" },
  PROCESSING: { label: "Processing", bg: "#dbeafe", text: "#1d4ed8" },
  QUEUED:     { label: "Queued",     bg: "var(--surface-muted)", text: "var(--text-muted)" },
};

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-3 py-1.5">
      <dt className="text-xs w-32 shrink-0" style={{ color: "var(--text-muted)" }}>{label}</dt>
      <dd className="text-xs font-medium flex-1">{children}</dd>
    </div>
  );
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-secondary)" }}>
      {children}
    </h4>
  );
}

function MetricChip({ label, value, color }: { label: string; value: number; color?: string }) {
  return (
    <div
      className="rounded-lg px-3 py-2 text-center"
      style={{ backgroundColor: "var(--surface-secondary)" }}
    >
      <p className="text-lg font-semibold tabular-nums" style={{ color: color ?? "var(--text-primary)" }}>
        {value.toLocaleString()}
      </p>
      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>{label}</p>
    </div>
  );
}

function DisabledActionButton({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      disabled
      aria-disabled="true"
      title={`${label} — requires backend implementation`}
      aria-label={`${label} — not available in frontend preview`}
      className="inline-flex items-center gap-1.5 rounded-md px-3 py-2 text-xs border cursor-not-allowed opacity-50 focus-visible:outline-none focus-visible:ring-2"
      style={{
        borderColor: "var(--border-default)",
        backgroundColor: "var(--surface-secondary)",
        color: "var(--text-secondary)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Main panel component
// ---------------------------------------------------------------------------

export function TdrBatchDetailPanel({
  batch,
  onClose,
}: {
  batch: TdrMockBatch;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const detail = buildMockDetail(batch);
  const statusStyle = STATUS_MAP[batch.status];

  // Escape key handler
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  // Focus the close button on open
  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const content = (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-8 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      aria-label="Close batch detail panel"
      role="presentation"
    >
      {/* Dialog */}
      <div
        className="relative w-full max-w-2xl my-auto rounded-xl shadow-2xl"
        style={{ backgroundColor: "var(--surface-primary)", color: "var(--text-primary)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tdr-detail-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="px-6 py-4 border-b flex items-center justify-between gap-4"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div>
            <h3 id="tdr-detail-title" className="text-sm font-semibold">
              Batch Detail Preview
            </h3>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              {batch.sourceName} — {relativeTime(batch.receivedAt)}
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close batch detail panel"
            className="inline-flex items-center justify-center rounded-md h-8 w-8 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* Mock-only warning banner */}
        <div
          className="mx-6 mt-4 rounded-lg px-4 py-3 flex items-start gap-3 text-xs"
          style={{ backgroundColor: "#fef3c7", color: "#92400e" }}
          role="note"
          aria-label="Mock preview data notice"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong>Mock preview data.</strong>{" "}
            No backend, API, or database is connected. Production batch detail must fetch one batch
            at a time from the server — the browser must never load full raw files or millions of rows.
          </div>
        </div>

        <div className="px-6 pb-6 space-y-6 mt-4">

          {/* Batch Identity */}
          <section aria-labelledby="tdr-section-identity">
            <SectionHeading>
              <span id="tdr-section-identity">Batch Identity</span>
            </SectionHeading>
            <dl
              className="rounded-lg border divide-y"
              style={{ borderColor: "var(--border-default)" }}
            >
              <DetailRow label="Batch ID">
                <code className="text-xs font-mono" style={{ color: "var(--text-muted)" }}>
                  {batch.id}
                </code>
              </DetailRow>
              <DetailRow label="Source">{batch.sourceName}</DetailRow>
              <DetailRow label="Received">{relativeTime(batch.receivedAt)}</DetailRow>
              <DetailRow label="Status">
                <span
                  className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
                  style={{ backgroundColor: statusStyle.bg, color: statusStyle.text }}
                >
                  {statusStyle.label}
                </span>
              </DetailRow>
              <DetailRow label="File type">{detail.fileType}</DetailRow>
              <DetailRow label="Submitted by">{detail.submittedBy}</DetailRow>
              <DetailRow label="Processing mode">
                <span style={{ color: "var(--text-muted)" }}>{detail.processingMode}</span>
              </DetailRow>
            </dl>
          </section>

          {/* Processing Summary */}
          <section aria-labelledby="tdr-section-summary">
            <SectionHeading>
              <span id="tdr-section-summary">Processing Summary</span>
            </SectionHeading>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              <MetricChip label="Accepted"    value={batch.acceptedCount}       color="#16a34a" />
              <MetricChip label="Warning"     value={detail.warningCount}       color={detail.warningCount > 0 ? "#b45309" : undefined} />
              <MetricChip label="Error"       value={detail.errorCount}         color={detail.errorCount > 0 ? "#ea580c" : undefined} />
              <MetricChip label="Fatal"       value={detail.fatalCount}         color={detail.fatalCount > 0 ? "#dc2626" : undefined} />
              <MetricChip label="Published"   value={detail.publishedCount} />
              <div
                className="rounded-lg px-3 py-2 text-center"
                style={{ backgroundColor: "var(--surface-secondary)" }}
              >
                <p
                  className="text-lg font-semibold tabular-nums"
                  style={{ color: detail.qualityScore >= 95 ? "#16a34a" : detail.qualityScore >= 80 ? "#b45309" : "#dc2626" }}
                >
                  {detail.qualityScore.toFixed(1)}%
                </p>
                <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>Quality</p>
              </div>
            </div>
          </section>

          {/* Validation Checkpoints */}
          <section aria-labelledby="tdr-section-checkpoints">
            <SectionHeading>
              <span id="tdr-section-checkpoints">Validation Checkpoints</span>
            </SectionHeading>
            <ol className="space-y-2" aria-label="Batch validation steps">
              {detail.checkpoints.map((cp, i) => (
                <li key={i} className="flex items-center gap-2.5 text-xs">
                  {CHECKPOINT_ICON[cp.state]}
                  <span
                    style={{
                      color: cp.state === "disabled" || cp.state === "pending"
                        ? "var(--text-muted)"
                        : cp.state === "done"
                        ? "var(--text-primary)"
                        : cp.state === "warning"
                        ? "#b45309"
                        : "#dc2626",
                    }}
                  >
                    {cp.label}
                  </span>
                </li>
              ))}
            </ol>
          </section>

          {/* Quality Issues */}
          {detail.issues.length > 0 && (
            <section aria-labelledby="tdr-section-issues">
              <SectionHeading>
                <span id="tdr-section-issues">Top Quality Issues</span>
              </SectionHeading>
              <ul className="space-y-1.5" aria-label="Top quality issues">
                {detail.issues.filter((iss) => iss.count > 0).map((iss, i) => (
                  <li key={i} className="flex items-center justify-between text-xs">
                    <span style={{ color: "var(--text-primary)" }}>{iss.label}</span>
                    <span
                      className="tabular-nums font-medium rounded-full px-2 py-0.5"
                      style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)" }}
                    >
                      ×{iss.count.toLocaleString()}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {detail.issues.length === 0 && (
            <section aria-labelledby="tdr-section-issues-empty">
              <SectionHeading>
                <span id="tdr-section-issues-empty">Quality Issues</span>
              </SectionHeading>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {batch.status === "ACCEPTED" && batch.quarantineCount === 0
                  ? "No quality issues detected — all records passed validation."
                  : "Issue data not available for this batch status."}
              </p>
            </section>
          )}

          {/* Disabled Actions */}
          <section aria-labelledby="tdr-section-actions">
            <SectionHeading>
              <span id="tdr-section-actions">Actions</span>
            </SectionHeading>
            <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
              All batch actions require backend implementation. Planned for future TDR phases.
            </p>
            <div className="flex flex-wrap gap-2">
              <DisabledActionButton icon={<ShieldOff className="h-3.5 w-3.5" aria-hidden="true" />}  label="Review Quarantine" />
              <DisabledActionButton icon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}   label="Export Clean Data" />
              <DisabledActionButton icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}  label="Re-run Validation" />
              <DisabledActionButton icon={<Send className="h-3.5 w-3.5" aria-hidden="true" />}       label="Publish Batch" />
            </div>
          </section>

          {/* Production note + close */}
          <div
            className="rounded-lg px-4 py-3 text-xs"
            style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-muted)" }}
          >
            <strong style={{ color: "var(--text-secondary)" }}>Production note:</strong>{" "}
            batch detail must fetch one batch from the server. Never load full raw files or large record
            sets into the browser. All actions above require backend, database, and Auth/RBAC implementation.
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium border focus-visible:outline-none focus-visible:ring-2"
              style={{
                borderColor: "var(--border-default)",
                backgroundColor: "var(--surface-secondary)",
                color: "var(--text-primary)",
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Close
            </button>
          </div>

        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
