import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Inbox, Eye } from "lucide-react";
import type { TdrBatch, TdrBatchStatus } from "@/types/tdr";

const STATUS_MAP: Record<TdrBatchStatus, { label: string; bg: string; text: string }> = {
  ACCEPTED:   { label: "Accepted",   bg: "#dcfce7",                   text: "#16a34a" },
  PARTIAL:    { label: "Partial",    bg: "#ffedd5",                   text: "#ea580c" },
  FAILED:     { label: "Failed",     bg: "#fee2e2",                   text: "#dc2626" },
  PROCESSING: { label: "Processing", bg: "#dbeafe",                   text: "#1d4ed8" },
  QUEUED:     { label: "Queued",     bg: "var(--surface-muted)",      text: "var(--text-muted)" },
};

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

export function TdrBatchTable({ batches }: { batches: TdrBatch[] }) {
  return (
    <Card title="Recent Import Batches">
      {batches.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-8 w-8" />}
          title="No batches yet"
          description="Import batches will appear here once data sources are connected and the first import is run."
        />
      ) : (
        <div className="overflow-x-auto -mx-6 px-6">
          <table className="w-full text-sm min-w-[560px]" aria-label="Recent import batches">
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border-default)" }}>
                {["Source", "Received", "Status", "Accepted", "Quarantined", "Action"].map((h, i) => (
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
              {batches.map((batch) => (
                <tr key={batch.id} style={{ borderBottom: "1px solid var(--border-default)" }}>
                  <td className="py-3 pr-4 font-medium">{batch.sourceName}</td>
                  <td className="py-3 pr-4 text-sm" style={{ color: "var(--text-muted)" }}>
                    {relativeTime(batch.receivedAt)}
                  </td>
                  <td className="py-3 pr-4">
                    <BatchStatusPill status={batch.status} />
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    {batch.acceptedCount.toLocaleString()}
                  </td>
                  <td className="py-3 pr-4 text-right tabular-nums">
                    <span
                      style={{
                        color: batch.quarantineCount > 0 ? "#b45309" : "var(--text-muted)",
                      }}
                    >
                      {batch.quarantineCount.toLocaleString()}
                    </span>
                  </td>
                  <td className="py-3 text-right">
                    <button
                      disabled
                      aria-disabled="true"
                      aria-label={`View batch from ${batch.sourceName} — read-only preview, not available`}
                      title="Batch detail view is not available in this frontend preview"
                      className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-xs cursor-not-allowed opacity-50 focus-visible:outline-none focus-visible:ring-2"
                      style={{
                        backgroundColor: "var(--surface-secondary)",
                        color: "var(--text-secondary)",
                      }}
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
      )}
    </Card>
  );
}
