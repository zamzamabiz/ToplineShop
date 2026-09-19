"use client";

import { useState, useMemo } from "react";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox, Eye, Search, ChevronLeft, ChevronRight, X } from "lucide-react";
import type { TdrMockBatch, TdrBatchStatus } from "@/types/tdr";
import { TdrBatchDetailPanel } from "./TdrBatchDetailPanel";

const STATUS_MAP: Record<TdrBatchStatus, { label: string; bg: string; text: string }> = {
  ACCEPTED:   { label: "Accepted",   bg: "#dcfce7",              text: "#16a34a" },
  PARTIAL:    { label: "Partial",    bg: "#ffedd5",              text: "#ea580c" },
  FAILED:     { label: "Failed",     bg: "#fee2e2",              text: "#dc2626" },
  PROCESSING: { label: "Processing", bg: "#dbeafe",              text: "#1d4ed8" },
  QUEUED:     { label: "Queued",     bg: "var(--surface-muted)", text: "var(--text-muted)" },
};

const ALL_STATUSES = Object.keys(STATUS_MAP) as TdrBatchStatus[];
const PAGE_SIZE_OPTIONS = [5, 10, 25] as const;

function BatchStatusPill({ status }: { status: TdrBatchStatus }) {
  const s = STATUS_MAP[status];
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: s.bg, color: s.text }}
    >
      {s.label}
    </span>
  );
}

function relativeTime(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const SELECT_STYLE = {
  backgroundColor: "var(--input-background)",
  borderColor: "var(--input-border)",
  color: "var(--text-primary)",
};

export function TdrBatchTable({ batches }: { batches: TdrMockBatch[] }) {
  const [search, setSearch]             = useState("");
  const [statusFilter, setStatusFilter] = useState<TdrBatchStatus | "">("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [pageSize, setPageSize]         = useState(5);
  const [page, setPage]                 = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<TdrMockBatch | null>(null);

  const sources = useMemo(
    () => Array.from(new Set(batches.map((b) => b.sourceName))).sort(),
    [batches],
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return batches.filter((b) => {
      if (q && !b.sourceName.toLowerCase().includes(q) && !b.status.toLowerCase().includes(q)) return false;
      if (statusFilter && b.status !== statusFilter) return false;
      if (sourceFilter && b.sourceName !== sourceFilter) return false;
      return true;
    });
  }, [batches, search, statusFilter, sourceFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage   = Math.min(page, totalPages);
  const rows       = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const hasFilters = search !== "" || statusFilter !== "" || sourceFilter !== "";

  function clearFilters() { setSearch(""); setStatusFilter(""); setSourceFilter(""); setPage(1); }
  function onSearch(v: string)               { setSearch(v);         setPage(1); }
  function onStatus(v: TdrBatchStatus | "")  { setStatusFilter(v);   setPage(1); }
  function onSource(v: string)               { setSourceFilter(v);   setPage(1); }
  function onPageSize(v: number)             { setPageSize(v);        setPage(1); }

  const rangeStart = filtered.length === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const rangeEnd   = Math.min(safePage * pageSize, filtered.length);

  return (
    <div
      className="rounded-xl border"
      style={{ backgroundColor: "var(--surface-primary)", borderColor: "var(--border-default)" }}
    >
      {/* Header row */}
      <div
        className="px-6 py-4 border-b flex items-center justify-between gap-4 flex-wrap"
        style={{ borderColor: "var(--border-default)" }}
      >
        <h3 className="text-sm font-semibold">Recent Import Batches</h3>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="inline-flex items-center gap-1 text-xs rounded px-2 py-1 focus-visible:outline-none focus-visible:ring-2"
            style={{ color: "var(--brand-primary)" }}
            aria-label="Clear all batch filters"
          >
            <X className="h-3 w-3" aria-hidden="true" />
            Clear filters
          </button>
        )}
      </div>

      <div className="p-6">
        {batches.length === 0 ? (
          <EmptyState
            icon={<Inbox className="h-8 w-8" />}
            title="No batches yet"
            description="Import batches will appear here once data sources are connected and the first import is run."
          />
        ) : (
          <>
            {/* Filter controls */}
            <div className="flex flex-wrap gap-3 mb-3" role="group" aria-label="Batch filter controls">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px]">
                <Search
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 pointer-events-none"
                  style={{ color: "var(--text-muted)" }}
                  aria-hidden="true"
                />
                <input
                  type="search"
                  id="tdr-batch-search"
                  value={search}
                  onChange={(e) => onSearch(e.target.value)}
                  placeholder="Search source or status…"
                  aria-label="Search batches by source name or status"
                  className="h-8 w-full rounded-md border pl-8 pr-3 text-xs focus-visible:outline-none focus-visible:ring-2"
                  style={SELECT_STYLE}
                />
              </div>

              {/* Status filter */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="tdr-status-filter" className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                  Status:
                </label>
                <select
                  id="tdr-status-filter"
                  value={statusFilter}
                  onChange={(e) => onStatus(e.target.value as TdrBatchStatus | "")}
                  className="h-8 rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-2"
                  style={SELECT_STYLE}
                  aria-label="Filter batches by status"
                >
                  <option value="">All statuses</option>
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{STATUS_MAP[s].label}</option>
                  ))}
                </select>
              </div>

              {/* Source filter */}
              <div className="flex items-center gap-1.5">
                <label htmlFor="tdr-source-filter" className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                  Source:
                </label>
                <select
                  id="tdr-source-filter"
                  value={sourceFilter}
                  onChange={(e) => onSource(e.target.value)}
                  className="h-8 rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-2"
                  style={SELECT_STYLE}
                  aria-label="Filter batches by data source"
                >
                  <option value="">All sources</option>
                  {sources.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Page size */}
              <div className="flex items-center gap-1.5 ml-auto">
                <label htmlFor="tdr-page-size" className="text-xs shrink-0" style={{ color: "var(--text-secondary)" }}>
                  Show:
                </label>
                <select
                  id="tdr-page-size"
                  value={pageSize}
                  onChange={(e) => onPageSize(Number(e.target.value))}
                  className="h-8 rounded-md border px-2 text-xs focus-visible:outline-none focus-visible:ring-2"
                  style={SELECT_STYLE}
                  aria-label="Rows per page"
                >
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <option key={n} value={n}>{n} per page</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Large-data safety note */}
            <p
              className="text-xs rounded-md px-3 py-2 mb-4"
              style={{ backgroundColor: "var(--surface-secondary)", color: "var(--text-muted)" }}
            >
              <strong style={{ color: "var(--text-secondary)" }}>Preview only:</strong>{" "}
              these controls use mock data. Production TDR must use server-side filtering, sorting, and pagination
              so large datasets are never loaded into the browser.
            </p>

            {/* Empty filtered state */}
            {filtered.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>
                  No batches match the current filters.
                </p>
                <button
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-xs rounded-md px-3 py-1.5 border focus-visible:outline-none focus-visible:ring-2"
                  style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", backgroundColor: "var(--surface-secondary)" }}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                  Reset filters
                </button>
              </div>
            ) : (
              <>
                {/* Table */}
                <div className="overflow-x-auto -mx-6 px-6">
                  <table className="w-full text-sm min-w-[560px]" aria-label="Recent import batches">
                    <thead>
                      <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                        {(["Source", "Received", "Status", "Accepted", "Quarantined", "Action"] as const).map((h, i) => (
                          <th
                            key={h}
                            scope="col"
                            className={`pb-3 text-xs font-medium ${i >= 3 ? "text-right" : "text-left"} ${i < 5 ? "pr-4" : ""}`}
                            style={{ color: "var(--text-secondary)" }}
                          >
                            {h}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((batch) => (
                        <tr key={batch.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                          <td className="py-3 pr-4 font-medium">{batch.sourceName}</td>
                          <td className="py-3 pr-4 text-sm" style={{ color: "var(--text-muted)" }} suppressHydrationWarning>
                            {relativeTime(batch.receivedAt)}
                          </td>
                          <td className="py-3 pr-4">
                            <BatchStatusPill status={batch.status} />
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            {batch.acceptedCount.toLocaleString()}
                          </td>
                          <td className="py-3 pr-4 text-right tabular-nums">
                            <span style={{ color: batch.quarantineCount > 0 ? "#b45309" : "var(--text-muted)" }}>
                              {batch.quarantineCount.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <button
                              type="button"
                              onClick={() => setSelectedBatch(batch)}
                              aria-label={`View batch detail for ${batch.sourceName}`}
                              title="Open batch detail preview"
                              className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
                              style={{ backgroundColor: "var(--brand-primary)", color: "var(--text-inverse)" }}
                            >
                              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination footer */}
                <div
                  className="mt-4 flex items-center justify-between gap-4 flex-wrap pt-4 border-t"
                  style={{ borderColor: "var(--border-default)" }}
                >
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    Showing {rangeStart}–{rangeEnd} of {filtered.length}{" "}
                    batch{filtered.length !== 1 ? "es" : ""}
                    {hasFilters && ` (filtered from ${batches.length} total)`}
                  </p>
                  <div className="flex items-center gap-2" role="navigation" aria-label="Batch table pagination">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={safePage === 1}
                      aria-label="Go to previous page"
                      className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs border disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2"
                      style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", backgroundColor: "var(--surface-secondary)" }}
                    >
                      <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
                      Prev
                    </button>
                    <span
                      className="text-xs px-2 tabular-nums"
                      style={{ color: "var(--text-muted)" }}
                      aria-live="polite"
                      aria-atomic="true"
                    >
                      Page {safePage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={safePage === totalPages}
                      aria-label="Go to next page"
                      className="inline-flex items-center gap-1 rounded px-2.5 py-1 text-xs border disabled:opacity-40 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2"
                      style={{ borderColor: "var(--border-default)", color: "var(--text-secondary)", backgroundColor: "var(--surface-secondary)" }}
                    >
                      Next
                      <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Batch detail modal — rendered outside card flow so it overlays the page */}
      {selectedBatch && (
        <TdrBatchDetailPanel
          batch={selectedBatch}
          onClose={() => setSelectedBatch(null)}
        />
      )}
    </div>
  );
}
