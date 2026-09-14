"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X, AlertTriangle, Activity, PauseCircle, Search, Filter,
  Play, RefreshCw, Zap, TestTube, Save,
} from "lucide-react";
import type {
  TdrSourceHealth,
  TdrSourceConfig,
  TdrSourceStatus,
  TdrSourceConfigState,
} from "@/types/tdr";

// ---------------------------------------------------------------------------
// Static synthetic mock configuration — no real credentials or connections
// ---------------------------------------------------------------------------

const CONFIG_BASE: Record<string, Omit<TdrSourceConfig, "id" | "name" | "healthStatus" | "lastSeen" | "batchCount">> = {
  "Global Trade Registry": {
    configState: "ready",
    sourceType: "JSON Feed",
    dataDomain: "Tariff & HS Codes",
    ownerTeam: "Trade Intelligence",
    dataFormat: "JSON (newline-delimited)",
    schedule: "Daily",
    expectedColumnsCount: 24,
    mappingProfile: "GTR-Standard-v2",
    validationProfile: "HS-Code-Strict",
    quarantineRule: "Quarantine on any missing HS code or invalid country",
    ingestionMode: "Server-side batch (planned)",
    retentionNote: "Raw files purged after 90 days per data agreement",
    notes: "Primary global reference feed. High volume. Requires daily refresh.",
  },
  "Asia-Pacific Customs API": {
    configState: "ready",
    sourceType: "REST API",
    dataDomain: "Customs Declarations",
    ownerTeam: "APAC Operations",
    dataFormat: "JSON (REST response)",
    schedule: "Hourly",
    expectedColumnsCount: 31,
    mappingProfile: "APAC-Customs-v1",
    validationProfile: "Customs-Declaration-Strict",
    quarantineRule: "Quarantine on duplicate declaration ref or missing importer ID",
    ingestionMode: "Server-side streaming (planned)",
    retentionNote: "Customs data subject to 7-year retention per APAC compliance",
    notes: "Hourly API pull via connector. Requires API key managed server-side.",
  },
  "EU Trade Data Feed": {
    configState: "needs_review",
    sourceType: "CSV Import",
    dataDomain: "EU Trade Statistics",
    ownerTeam: "EU Compliance",
    dataFormat: "CSV (semicolon-delimited)",
    schedule: "Weekly",
    expectedColumnsCount: 18,
    mappingProfile: "EU-STAT-v3",
    validationProfile: "EU-Trade-Lenient",
    quarantineRule: "Quarantine on quantity < 0 or invalid EU country code",
    ingestionMode: "Server-side SFTP pickup (planned)",
    retentionNote: "EU GDPR: anonymise personal trader fields after 24 months",
    notes: "Weekly SFTP drop. High quarantine rate due to partial data quality issues.",
  },
  "Americas Logistics Index": {
    configState: "draft",
    sourceType: "SFTP Drop",
    dataDomain: "Logistics & Freight",
    ownerTeam: "Americas Ops",
    dataFormat: "XLSX (multi-sheet)",
    schedule: "Weekly",
    expectedColumnsCount: 42,
    mappingProfile: "AMI-Logistics-v1 (draft)",
    validationProfile: "Freight-Basic (draft)",
    quarantineRule: "TBD — awaiting data specification",
    ingestionMode: "Server-side batch (planned)",
    retentionNote: "Retention policy not yet confirmed with data provider",
    notes: "SFTP configuration in draft. Schema specification pending from provider.",
  },
};

const FALLBACK_CONFIG: Omit<TdrSourceConfig, "id" | "name" | "healthStatus" | "lastSeen" | "batchCount"> = {
  configState: "draft",
  sourceType: "JSON Feed",
  dataDomain: "Trade Data",
  ownerTeam: "Data Team",
  dataFormat: "JSON",
  schedule: "Manual",
  expectedColumnsCount: 0,
  mappingProfile: "(not configured)",
  validationProfile: "(not configured)",
  quarantineRule: "(not configured)",
  ingestionMode: "Server-side batch (planned)",
  retentionNote: "Retention policy not confirmed",
  notes: "Configuration pending.",
};

function buildConfigs(sources: TdrSourceHealth[]): TdrSourceConfig[] {
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    healthStatus: s.status,
    lastSeen: s.lastSeen,
    batchCount: s.batchCount,
    ...(CONFIG_BASE[s.name] ?? FALLBACK_CONFIG),
  }));
}

// ---------------------------------------------------------------------------
// Display helpers
// ---------------------------------------------------------------------------

const HEALTH_STYLE: Record<TdrSourceStatus, { label: string; bg: string; text: string; icon: React.ReactNode }> = {
  ACTIVE:    { label: "Active",    bg: "#dcfce7", text: "#16a34a", icon: <Activity className="h-3.5 w-3.5" aria-hidden="true" /> },
  PAUSED:    { label: "Paused",    bg: "var(--surface-muted)", text: "var(--text-muted)", icon: <PauseCircle className="h-3.5 w-3.5" aria-hidden="true" /> },
  ATTENTION: { label: "Attention", bg: "#fef3c7", text: "#92400e", icon: <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> },
};

const CONFIG_STATE_STYLE: Record<TdrSourceConfigState, { label: string; bg: string; text: string }> = {
  ready:        { label: "Ready",        bg: "#d1fae5", text: "#065f46" },
  needs_review: { label: "Needs Review", bg: "#fef3c7", text: "#92400e" },
  draft:        { label: "Draft",        bg: "#f3f4f6", text: "#374151" },
  disabled:     { label: "Disabled",     bg: "#fee2e2", text: "#991b1b" },
};

function HealthBadge({ status }: { status: TdrSourceStatus }) {
  const s = HEALTH_STYLE[status];
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
      aria-label={`Health status: ${s.label}`}
    >
      {s.icon}
      {s.label}
    </span>
  );
}

function ConfigStateBadge({ state }: { state: TdrSourceConfigState }) {
  const s = CONFIG_STATE_STYLE[state];
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
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

function ReadOnlyField({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <label className="block text-xs mb-1" style={{ color: "var(--text-muted)" }}>
        {label}
      </label>
      <div
        className="rounded-md border px-3 py-2 text-xs cursor-default"
        style={{
          borderColor: "var(--border-default)",
          backgroundColor: "var(--surface-muted)",
          color: "var(--text-secondary)",
        }}
        aria-label={`${label}: ${value}`}
      >
        {value || "(not set)"}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface TdrSourceConfigurationPanelProps {
  sources: TdrSourceHealth[];
  onClose: () => void;
}

export function TdrSourceConfigurationPanel({ sources, onClose }: TdrSourceConfigurationPanelProps) {
  const allConfigs = buildConfigs(sources);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<TdrSourceStatus | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(allConfigs[0]?.id ?? null);

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

  const filtered = allConfigs.filter((c) => {
    const matchesStatus = statusFilter === "all" || c.healthStatus === statusFilter;
    if (!matchesStatus) return false;
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.sourceType.toLowerCase().includes(q) ||
      c.ownerTeam.toLowerCase().includes(q) ||
      c.dataDomain.toLowerCase().includes(q) ||
      c.mappingProfile.toLowerCase().includes(q)
    );
  });

  const selected = filtered.find((c) => c.id === selectedId) ?? filtered[0] ?? null;

  function resetFilters() {
    setSearch("");
    setStatusFilter("all");
  }

  const content = (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center p-4 sm:p-6 overflow-y-auto"
      style={{ backgroundColor: "rgba(0,0,0,0.55)" }}
      onClick={onClose}
      role="presentation"
      aria-label="Close source configuration panel"
    >
      <div
        className="relative w-full max-w-4xl my-auto rounded-xl shadow-2xl"
        style={{ backgroundColor: "var(--surface-primary)", color: "var(--text-primary)" }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="tdr-src-cfg-title"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between gap-4 px-5 py-4 border-b"
          style={{ borderColor: "var(--border-default)" }}
        >
          <div>
            <h2 id="tdr-src-cfg-title" className="text-sm font-semibold">
              Source Configuration Preview
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              Frontend preview only — no backend, database, API, connector, credentials, or Auth/RBAC is connected.
            </p>
          </div>
          <button
            ref={closeRef}
            onClick={onClose}
            aria-label="Close source configuration panel"
            className="inline-flex items-center justify-center rounded-md h-8 w-8 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: "var(--text-muted)" }}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        {/* ── Preview warning ── */}
        <div
          className="mx-5 mt-4 rounded-lg border px-4 py-3 flex items-start gap-3 text-xs"
          style={{ borderColor: "#fbbf24", backgroundColor: "#fffbeb", color: "#92400e" }}
          role="note"
        >
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <strong>Synthetic configuration data only — no credentials are stored, no connectors are tested, no ingestion is started.</strong>{" "}
            Production source configuration must be RBAC-gated and connection testing must happen server-side.
            The browser must never handle raw credentials or load large datasets.
          </div>
        </div>

        {/* ── Body: list + detail ── */}
        <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x"
          style={{ borderColor: "var(--border-default)" }}
        >
          {/* ── Left: search, filter, list ── */}
          <div className="lg:w-72 shrink-0 px-4 py-4 flex flex-col gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5" style={{ color: "var(--text-muted)" }} aria-hidden="true" />
              <input
                type="search"
                placeholder="Search sources…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search sources"
                className="w-full rounded-md border pl-8 pr-3 py-2 text-xs focus:outline-none focus-visible:ring-2"
                style={{
                  borderColor: "var(--border-default)",
                  backgroundColor: "var(--surface-secondary)",
                  color: "var(--text-primary)",
                }}
              />
            </div>

            {/* Status filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs shrink-0" style={{ color: "var(--text-muted)" }}>
                <Filter className="inline h-3 w-3 mr-1" aria-hidden="true" />
                Status:
              </span>
              {(["all", "ACTIVE", "PAUSED", "ATTENTION"] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatusFilter(s)}
                  aria-pressed={statusFilter === s}
                  className="rounded-full px-2.5 py-0.5 text-xs font-medium border transition-opacity focus-visible:outline-none focus-visible:ring-2"
                  style={
                    statusFilter === s
                      ? { backgroundColor: "var(--brand-primary)", color: "#fff", borderColor: "var(--brand-primary)" }
                      : { backgroundColor: "var(--surface-secondary)", color: "var(--text-secondary)", borderColor: "var(--border-default)" }
                  }
                >
                  {s === "all" ? "All" : s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>

            {/* Source list */}
            {filtered.length === 0 ? (
              <div className="rounded-lg border px-4 py-6 text-center" style={{ borderColor: "var(--border-default)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  No sources match the current filters.
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
              <ul className="space-y-1 overflow-y-auto" style={{ maxHeight: "360px" }} aria-label="Source list">
                {filtered.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(c.id)}
                      aria-pressed={selected?.id === c.id}
                      className="w-full text-left rounded-lg border px-3 py-2.5 focus-visible:outline-none focus-visible:ring-2 transition-opacity hover:opacity-80"
                      style={{
                        borderColor: selected?.id === c.id ? "var(--brand-primary)" : "var(--border-default)",
                        backgroundColor: selected?.id === c.id ? "var(--surface-secondary)" : "transparent",
                      }}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-xs font-medium truncate" style={{ color: "var(--text-primary)" }}>
                            {c.name}
                          </p>
                          <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                            {c.sourceType} · {c.dataDomain}
                          </p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <HealthBadge status={c.healthStatus} />
                          <ConfigStateBadge state={c.configState} />
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              {filtered.length} of {allConfigs.length} sources
            </p>
          </div>

          {/* ── Right: selected source detail ── */}
          <div className="flex-1 px-5 py-4 overflow-y-auto" style={{ maxHeight: "540px" }}>
            {!selected ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Select a source to see configuration details.
                </p>
              </div>
            ) : (
              <div className="space-y-5">
                {/* Source identity */}
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
                      {selected.name}
                    </h3>
                    <div className="flex gap-2 shrink-0 flex-wrap justify-end">
                      <HealthBadge status={selected.healthStatus} />
                      <ConfigStateBadge state={selected.configState} />
                    </div>
                  </div>
                  <dl
                    className="rounded-lg border divide-y text-xs"
                    style={{ borderColor: "var(--border-default)" }}
                  >
                    {[
                      { label: "Source ID",   value: selected.id },
                      { label: "Type",        value: selected.sourceType },
                      { label: "Data domain", value: selected.dataDomain },
                      { label: "Owner team",  value: selected.ownerTeam },
                      { label: "Last seen",   value: selected.lastSeen },
                      { label: "Batches",     value: `${selected.batchCount} received` },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-3 px-3 py-2">
                        <dt className="w-28 shrink-0" style={{ color: "var(--text-muted)" }}>{label}</dt>
                        <dd className="flex-1 font-medium" style={{ color: "var(--text-primary)" }}>{value}</dd>
                      </div>
                    ))}
                  </dl>
                </div>

                {/* Configuration preview form (read-only) */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-secondary)" }}>
                    Configuration
                    <span className="ml-2 text-xs normal-case font-normal" style={{ color: "var(--text-muted)" }}>
                      — read-only preview, planned only
                    </span>
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <ReadOnlyField label="Display name"         value={selected.name} />
                    <ReadOnlyField label="Connection type"      value={selected.sourceType} />
                    <ReadOnlyField label="File / API format"    value={selected.dataFormat} />
                    <ReadOnlyField label="Ingestion frequency"  value={selected.schedule} />
                    <ReadOnlyField label="Expected columns"     value={selected.expectedColumnsCount || "(TBD)"} />
                    <ReadOnlyField label="Mapping profile"      value={selected.mappingProfile} />
                    <ReadOnlyField label="Validation profile"   value={selected.validationProfile} />
                    <ReadOnlyField label="Quarantine rule"      value={selected.quarantineRule} />
                    <ReadOnlyField label="Ingestion mode"       value={selected.ingestionMode} />
                    <ReadOnlyField label="Owner team"           value={selected.ownerTeam} />
                  </div>
                </div>

                {/* Retention note */}
                <div
                  className="rounded-lg border px-3 py-3 text-xs"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
                >
                  <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Retention note</p>
                  <p style={{ color: "var(--text-muted)" }}>{selected.retentionNote}</p>
                </div>

                {/* Notes */}
                {selected.notes && (
                  <div
                    className="rounded-lg border px-3 py-3 text-xs"
                    style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-secondary)" }}
                  >
                    <p className="font-semibold mb-1" style={{ color: "var(--text-secondary)" }}>Notes</p>
                    <p style={{ color: "var(--text-muted)" }}>{selected.notes}</p>
                  </div>
                )}

                {/* Production safety note */}
                <div
                  className="rounded-lg border px-3 py-2.5 text-xs"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)", color: "var(--text-muted)" }}
                  role="note"
                >
                  <strong style={{ color: "var(--text-secondary)" }}>Production note:</strong>{" "}
                  Real source connection testing must happen server-side. Credentials must never be stored in the browser.
                  Full configuration requires backend, database, and Auth/RBAC implementation.
                </div>

                {/* Disabled actions */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--text-secondary)" }}>
                    Source Actions
                    <span className="ml-2 text-xs normal-case font-normal" style={{ color: "var(--text-muted)" }}>
                      — Backend / Auth required
                    </span>
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    <DisabledAction icon={<Save className="h-3.5 w-3.5" aria-hidden="true" />}     label="Save Configuration" />
                    <DisabledAction icon={<TestTube className="h-3.5 w-3.5" aria-hidden="true" />} label="Test Connection" />
                    <DisabledAction icon={<PauseCircle className="h-3.5 w-3.5" aria-hidden="true" />} label="Pause Source" />
                    <DisabledAction icon={<Play className="h-3.5 w-3.5" aria-hidden="true" />}     label="Resume Source" />
                    <DisabledAction icon={<RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />} label="Run Sample Validation" />
                    <DisabledAction icon={<Zap className="h-3.5 w-3.5" aria-hidden="true" />}      label="Start Ingestion" />
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
            Preview only — no configuration is saved or applied.
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
