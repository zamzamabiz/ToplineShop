"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, AlertTriangle, XCircle, CheckCircle2, Clock, Search, Filter,
  CheckCheck, Ban, Download, RefreshCw, Edit3,
} from "lucide-react";
import type {
  TdrQualitySummary,
  TdrQuarantineRecord,
  TdrQuarantineSeverity,
} from "@/types/tdr";

// ---------------------------------------------------------------------------
// Static synthetic mock records — no real trade data
// ---------------------------------------------------------------------------

const WARNING_RECORDS: TdrQuarantineRecord[] = [
  {
    id: "QR-001", batchId: "b-003", sourceName: "EU Trade Data Feed",
    issueType: "HS Code Mismatch", severity: "warning",
    fieldAffected: "hs_code", originalValue: "8471.30.00", suggestedValue: "8471.30",
    whyQuarantined: "HS code contains an extra precision segment not found in the reference table.",
    recommendedAction: "Accept suggestion to normalise to 6-digit HS code.",
    reviewStatus: "needs_review",
  },
  {
    id: "QR-002", batchId: "b-001", sourceName: "Global Trade Registry",
    issueType: "Country Name Variant", severity: "warning",
    fieldAffected: "origin_country", originalValue: "USA", suggestedValue: "United States",
    whyQuarantined: "Country name does not match the ISO 3166-1 standard name in the registry.",
    recommendedAction: "Accept suggestion to use the full ISO country name.",
    reviewStatus: "accepted_suggestion",
  },
  {
    id: "QR-003", batchId: "b-002", sourceName: "Asia-Pacific Customs API",
    issueType: "Date Format Warning", severity: "warning",
    fieldAffected: "shipment_date", originalValue: "14/09/2026", suggestedValue: "2026-09-14",
    whyQuarantined: "Date is in DD/MM/YYYY format. System expects ISO 8601 (YYYY-MM-DD).",
    recommendedAction: "Accept suggestion to normalise date format.",
    reviewStatus: "needs_review",
  },
  {
    id: "QR-004", batchId: "b-006", sourceName: "Global Trade Registry",
    issueType: "Unit of Measure Variant", severity: "warning",
    fieldAffected: "quantity_unit", originalValue: "KGS", suggestedValue: "KG",
    whyQuarantined: "Unit abbreviation variant not found in canonical unit table.",
    recommendedAction: "Accept suggestion or reject and add KGS to approved aliases.",
    reviewStatus: "needs_review",
  },
  {
    id: "QR-005", batchId: "b-003", sourceName: "EU Trade Data Feed",
    issueType: "Currency Code Variant", severity: "warning",
    fieldAffected: "invoice_currency", originalValue: "EURO", suggestedValue: "EUR",
    whyQuarantined: "Currency name used instead of ISO 4217 code.",
    recommendedAction: "Accept suggestion to use the ISO currency code.",
    reviewStatus: "rejected_suggestion",
  },
];

const ERROR_RECORDS: TdrQuarantineRecord[] = [
  {
    id: "QR-010", batchId: "b-013", sourceName: "Asia-Pacific Customs API",
    issueType: "Missing Required Field", severity: "error",
    fieldAffected: "importer_id", originalValue: "(empty)", suggestedValue: "(none — manual entry required)",
    whyQuarantined: "importer_id is a required field. Record cannot be published without it.",
    recommendedAction: "Cannot auto-fix. Escalate to data provider for correction.",
    reviewStatus: "cannot_auto_fix",
  },
  {
    id: "QR-011", batchId: "b-011", sourceName: "Global Trade Registry",
    issueType: "Invalid Country Code", severity: "error",
    fieldAffected: "destination_country", originalValue: "ZZ", suggestedValue: "(none — unknown code)",
    whyQuarantined: "'ZZ' is not a valid ISO 3166-1 alpha-2 country code.",
    recommendedAction: "Cannot auto-fix. Return to source for correction.",
    reviewStatus: "cannot_auto_fix",
  },
  {
    id: "QR-012", batchId: "b-015", sourceName: "EU Trade Data Feed",
    issueType: "Duplicate Shipment Reference", severity: "error",
    fieldAffected: "shipment_ref", originalValue: "EUSHIP-20260901-0042", suggestedValue: "(none — duplicate)",
    whyQuarantined: "Shipment reference already exists from a prior batch. Possible double-submission.",
    recommendedAction: "Investigate source deduplication before accepting.",
    reviewStatus: "needs_review",
  },
  {
    id: "QR-013", batchId: "b-010", sourceName: "EU Trade Data Feed",
    issueType: "Quantity Out of Range", severity: "error",
    fieldAffected: "quantity", originalValue: "-250", suggestedValue: "250",
    whyQuarantined: "Negative quantity is not valid for this record type.",
    recommendedAction: "Accept suggestion only if sign error is confirmed by the data provider.",
    reviewStatus: "needs_review",
  },
];

const FATAL_RECORDS: TdrQuarantineRecord[] = [
  {
    id: "QR-020", batchId: "b-020", sourceName: "Global Trade Registry",
    issueType: "Schema Validation Failure", severity: "fatal",
    fieldAffected: "(entire record)", originalValue: '{"hs":"8471","qty":null}', suggestedValue: "(none — invalid structure)",
    whyQuarantined: "Record does not match the expected schema. Multiple required fields are absent.",
    recommendedAction: "Cannot auto-fix. Reject batch segment and notify the data provider.",
    reviewStatus: "cannot_auto_fix",
  },
  {
    id: "QR-021", batchId: "b-021", sourceName: "Asia-Pacific Customs API",
    issueType: "Fatal Parse Error", severity: "fatal",
    fieldAffected: "(entire record)", originalValue: "(binary / corrupted segment)", suggestedValue: "(none — unreadable)",
    whyQuarantined: "Record segment could not be parsed. File may be partially corrupted.",
    recommendedAction: "Cannot auto-fix. Request a fresh submission from the data provider.",
    reviewStatus: "cannot_auto_fix",
  },
  {
    id: "QR-022", batchId: "b-023", sourceName: "Global Trade Registry",
    issueType: "Multiple Required Fields Missing", severity: "fatal",
    fieldAffected: "hs_code, importer_id, quantity", originalValue: "(all three fields blank)",
    suggestedValue: "(none — multiple required fields missing)",
    whyQuarantined: "Three required fields are blank. Record cannot be processed or published.",
    recommendedAction: "Cannot auto-fix. Escalate to data provider.",
    reviewStatus: "cannot_auto_fix",
  },
];

function buildRecords(quality: TdrQualitySummary): TdrQuarantineRecord[] {
  if (quality.fatal > quality.error && quality.fatal > quality.warning) {
    return [...FATAL_RECORDS, ...ERROR_RECORDS, ...WARNING_RECORDS.slice(0, 2)];
  }
  if (quality.error >= quality.warning) {
    return [...ERROR_RECORDS, ...WARNING_RECORDS, ...FATAL_RECORDS.slice(0, 1)];
  }
  return [...WARNING_RECORDS, ...ERROR_RECORDS.slice(0, 2)];
}

// ---------------------------------------------------------------------------
// Severity display helpers
// ---------------------------------------------------------------------------

const SEVERITY_STYLE: Record<TdrQuarantineSeverity, { bg: string; text: string; label: string }> = {
  warning: { bg: "#fef3c7", text: "#92400e", label: "Warning" },
  error:   { bg: "#ffedd5", text: "#9a3412", label: "Error" },
  fatal:   { bg: "#fee2e2", text: "#991b1b", label: "Fatal" },
};

const REVIEW_STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  needs_review:          { bg: "#dbeafe", text: "#1e40af",  label: "Needs Review" },
  accepted_suggestion:   { bg: "#d1fae5", text: "#065f46",  label: "Accepted" },
  rejected_suggestion:   { bg: "#fee2e2", text: "#991b1b",  label: "Rejected" },
  cannot_auto_fix:       { bg: "#f3f4f6", text: "#374151",  label: "Cannot Auto-fix" },
};

function SeverityBadge({ severity }: { severity: TdrQuarantineSeverity }) {
  const s = SEVERITY_STYLE[severity];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold"
      style={{ backgroundColor: s.bg, color: s.text }}
      aria-label={`Severity: ${s.label}`}
    >
      {s.label}
    </span>
  );
}

function ReviewStatusBadge({ status }: { status: string }) {
  const s = REVIEW_STATUS_STYLE[status] ?? { bg: "#f3f4f6", text: "#374151", label: status };
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function SeverityIcon({ severity }: { severity: TdrQuarantineSeverity }) {
  if (severity === "fatal") return <XCircle className="h-4 w-4 shrink-0" style={{ color: "#dc2626" }} aria-hidden="true" />;
  if (severity === "error") return <AlertTriangle className="h-4 w-4 shrink-0" style={{ color: "#ea580c" }} aria-hidden="true" />;
  return <Clock className="h-4 w-4 shrink-0" style={{ color: "#b45309" }} aria-hidden="true" />;
}

function DisabledAction({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <button
      disabled
      aria-disabled="true"
      title={`${label} — requires backend and Auth/RBAC implementation`}
      aria-label={`${label} — not available in frontend preview`}
      className="inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs cursor-not-allowed opacity-50 focus-visible:outline-none focus-visible:ring-2"
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
// Main component
// ---------------------------------------------------------------------------

interface TdrQuarantineReviewPanelProps {
  quality: TdrQualitySummary;
  onClose: () => void;
}

export function TdrQuarantineReviewPanel({ quality, onClose }: TdrQuarantineReviewPanelProps) {
  const allRecords = buildRecords(quality);

  const [search, setSearch] = useState("");
  const [severityFilter, setSeverityFilter] = useState<TdrQuarantineSeverity | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(allRecords[0]?.id ?? null);

  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  const filtered = allRecords.filter((r) => {
    const matchesSeverity = severityFilter === "all" || r.severity === severityFilter;
    if (!matchesSeverity) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      r.issueType.toLowerCase().includes(q) ||
      r.fieldAffected.toLowerCase().includes(q) ||
      r.sourceName.toLowerCase().includes(q) ||
      r.originalValue.toLowerCase().includes(q) ||
      r.suggestedValue.toLowerCase().includes(q)
    );
  });

  const selected = filtered.find((r) => r.id === selectedId) ?? filtered[0] ?? null;

  function resetFilters() {
    setSearch("");
    setSeverityFilter("all");
  }

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      role="presentation"
      aria-label="Close quarantine review panel"
    >
      <div
        className="relative w-full max-w-4xl my-auto rounded-xl shadow-2xl"
        style={{ backgroundColor: "var(--surface-primary)", color: "var(--text-primary)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tdr-qr-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 border-b"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div>
            <h2 id="tdr-qr-title" className="text-sm font-semibold">Quarantine Review Preview</h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Frontend preview only — no backend, database, API, or Auth/RBAC is connected.
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close quarantine review panel"
            className="inline-flex items-center justify-center rounded-md h-8 w-8 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* ── Mock-only warning ── */}
        <div
          className="mx-5 mt-4 rounded-lg border px-4 py-3 flex items-start gap-3 text-xs"
          style={{ borderColor: "#fbbf24", backgroundColor: "#fffbeb", color: "#92400e" }}
          role="note"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong>Synthetic records only — no real trade data is shown.</strong>{" "}
            Production review must be RBAC-gated, server-side paginated, and must never load
            full raw files or millions of rows into the browser.
          </div>
        </div>

        {/* ── Body: list + detail ── */}
        <div className="flex flex-col lg:flex-row gap-0 divide-y lg:divide-y-0 lg:divide-x"
          style={{ divideColor: "var(--border-default)" } as React.CSSProperties}
        >
          {/* ── Left: search, filter, list ── */}
          <div className="lg:w-80 shrink-0 px-4 py-4 flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search records…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search quarantine records"
                className="w-full rounded-md border pl-8 pr-3 py-2 text-xs focus:outline-none focus-visible:ring-2"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--surface-secondary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Severity filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                <Filter className="inline h-3 w-3 mr-1" aria-hidden="true" />
                Severity:
              </span>
              {(["all", "warning", "error", "fatal"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSeverityFilter(s)}
                  aria-pressed={severityFilter === s}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium border transition-opacity focus-visible:outline-none focus-visible:ring-2"
                  style={
                    severityFilter === s
                      ? { backgroundColor: "var(--brand-primary)", color: "#fff", borderColor: "var(--brand-primary)" }
                      : { backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)", borderColor: "var(--border-default)" }
                  }
                >
                  {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>

            {/* Record list */}
            {filtered.length === 0 ? (
              <div className="rounded-lg border px-4 py-6 text-center" style={{ borderColor: "var(--border-default)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No quarantine records match the current filters.
                </p>
                <button
                  type="button"
                  onClick={resetFilters}
                  className="mt-3 text-xs underline focus-visible:outline-none focus-visible:ring-2"
                  style={{ color: "var(--brand-primary)" }}
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <ul
                className="space-y-1 overflow-y-auto"
                style={{ maxHeight: "360px" }}
                aria-label="Quarantine records list"
              >
                {filtered.map((r) => (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      aria-pressed={selected?.id === r.id}
                      className="w-full text-left rounded-lg border px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 transition-opacity hover:opacity-80"
                      style={{
                        borderColor: selected?.id === r.id ? "var(--brand-primary)" : "var(--border-default)",
                        backgroundColor: selected?.id === r.id ? "var(--surface-secondary)" : "transparent",
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <SeverityIcon severity={r.severity} />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {r.issueType}
                          </p>
                          <p className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {r.fieldAffected} · {r.id}
                          </p>
                        </div>
                        <SeverityBadge severity={r.severity} />
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} of {allRecords.length} records
            </p>
          </div>

          {/* ── Right: selected record detail ── */}
          <div className="flex-1 px-5 py-4 overflow-y-auto" style={{ maxHeight: "520px" }}>
            {!selected ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Select a record from the list to see details.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Identity */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {selected.issueType}
                    </h3>
                    <div className="flex gap-2 shrink-0">
                      <SeverityBadge severity={selected.severity} />
                      <ReviewStatusBadge status={selected.reviewStatus} />
                    </div>
                  </div>

                  <dl
                    className="rounded-lg border divide-y text-xs"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    {[
                      { label: "Record ID", value: <code className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{selected.id}</code> },
                      { label: "Batch ID",  value: <code className="font-mono text-xs" style={{ color: "var(--text-muted)" }}>{selected.batchId}</code> },
                      { label: "Source",    value: selected.sourceName },
                      { label: "Field",     value: <code className="font-mono text-xs" style={{ color: "var(--text-secondary)" }}>{selected.fieldAffected}</code> },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-3 px-3 py-2">
                        <dt className="w-24 shrink-0" style={{ color: "var(--text-muted)" }}>{label}</dt>
                        <dd className="flex-1 font-medium" style={{ color: "var(--text-primary)" }}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Values */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>
                    Values
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      className="rounded-lg border px-3 py-3"
                      style={{ borderColor: "#fca5a5", backgroundColor: "#fff1f2" }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: "#991b1b" }}>Original value</p>
                      <code className="text-xs font-mono break-all" style={{ color: "#7f1d1d" }}>
                        {selected.originalValue}
                      </code>
                    </div>
                    <div
                      className="rounded-lg border px-3 py-3"
                      style={{ borderColor: "#6ee7b7", backgroundColor: "#f0fdf4" }}
                    >
                      <p className="text-xs font-semibold mb-1" style={{ color: "#065f46" }}>Suggested value</p>
                      <code className="text-xs font-mono break-all" style={{ color: "#064e3b" }}>
                        {selected.suggestedValue}
                      </code>
                    </div>
                  </div>
                </div>

                {/* Why quarantined + recommended action */}
                <div className="space-y-3">
                  <div
                    className="rounded-lg border px-3 py-3 text-xs"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
                  >
                    <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Why quarantined</p>
                    <p style={{ color: "var(--text-muted)" }}>{selected.whyQuarantined}</p>
                  </div>
                  <div
                    className="rounded-lg border px-3 py-3 text-xs"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
                  >
                    <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Recommended reviewer action</p>
                    <p style={{ color: "var(--text-muted)" }}>{selected.recommendedAction}</p>
                  </div>
                </div>

                {/* Large-data note */}
                <div
                  className="rounded-lg border px-3 py-2.5 text-xs"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)", color: "var(--text-muted)" }}
                  role="note"
                >
                  <strong style={{ color: "var(--text-secondary)" }}>Production note:</strong>{" "}
                  Fetch each record page from the server. Never load all raw quarantine rows into the browser.
                  Full review requires server-side pagination and Auth/RBAC enforcement.
                </div>

                {/* Disabled actions */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>
                    Review Actions
                    <span className="ml-2 text-xs normal-case font-normal" style={{ color: "var(--text-muted)" }}>
                      — Backend / Auth required
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <DisabledAction
                      icon={<CheckCheck className="h-3.5 w-3.5" aria-hidden="true" />}
                      label="Accept Suggestion"
                    />
                    <DisabledAction
                      icon={<Ban className="h-3.5 w-3.5" aria-hidden="true" />}
                      label="Reject Suggestion"
                    />
                    <DisabledAction
                      icon={<Edit3 className="h-3.5 w-3.5" aria-hidden="true" />}
                      label="Mark for Manual Review"
                    />
                    <DisabledAction
                      icon={<CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />}
                      label="Save Decision"
                    />
                    <DisabledAction
                      icon={<Download className="h-3.5 w-3.5" aria-hidden="true" />}
                      label="Export Clean Rows"
                    />
                    <DisabledAction
                      icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />}
                      label="Re-run Validation"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ── */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-3 border-t"
          style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
        >
          <p className="text-xs" style={{ color: "var(--text-muted)" }}>
            Preview only — no real review actions are performed.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-md border px-4 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--surface-secondary)",
              color: "var(--text-primary)",
            }}
          >
            <X className="h-3.5 w-3.5" aria-hidden="true" />
            Close
          </button>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}
