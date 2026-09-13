import { Card } from "@/components/ui/Card";
import { AlertTriangle, CheckCircle2 } from "lucide-react";
import type { TdrQualitySummary } from "@/types/tdr";

export function TdrQuarantinePanel({ quality }: { quality: TdrQualitySummary }) {
  const quarantined = quality.error + quality.fatal;

  return (
    <Card title="Quarantine Summary">
      {quarantined === 0 ? (
        <div className="py-4 flex items-center gap-3">
          <CheckCircle2 className="h-5 w-5 shrink-0" style={{ color: "#16a34a" }} aria-hidden="true" />
          <div>
            <div className="text-sm font-semibold">Empty — no quarantined records</div>
            <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
              All processed records passed validation.
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <AlertTriangle
              className="h-5 w-5 shrink-0 mt-0.5"
              style={{ color: "#b45309" }}
              aria-hidden="true"
            />
            <div>
              <div className="text-2xl font-bold tabular-nums">{quarantined.toLocaleString()}</div>
              <div className="text-sm" style={{ color: "var(--text-muted)" }}>
                records quarantined (error + fatal)
              </div>
            </div>
          </div>
          <div
            className="rounded-lg border px-4 py-3 text-sm"
            style={{
              borderColor: "var(--border-default)",
              backgroundColor: "var(--surface-muted)",
              color: "var(--text-muted)",
            }}
            role="note"
          >
            <strong style={{ color: "var(--text-secondary)" }}>Review workflow — Planned only.</strong>{" "}
            Quarantine review, remediation, and re-ingestion are planned for a future TDR phase. This
            panel is read-only in the current frontend preview.
          </div>
        </div>
      )}
    </Card>
  );
}
