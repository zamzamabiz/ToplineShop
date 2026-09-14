"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { AlertTriangle, CheckCircle2, ShieldAlert } from "lucide-react";
import type { TdrQualitySummary } from "@/types/tdr";
import { TdrQuarantineReviewPanel } from "@/components/tdr/TdrQuarantineReviewPanel";

export function TdrQuarantinePanel({ quality }: { quality: TdrQualitySummary }) {
  const quarantined = quality.error + quality.fatal;
  const [reviewOpen, setReviewOpen] = useState(false);

  return (
    <>
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

            <button
              type="button"
              onClick={() => setReviewOpen(true)}
              aria-expanded={reviewOpen}
              aria-label="Open quarantine review preview"
              className="w-full flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80 focus-visible:outline-none focus-visible:ring-2"
              style={{
                borderColor: "var(--brand-primary)",
                backgroundColor: "var(--surface-secondary)",
                color: "var(--brand-primary)",
              }}
            >
              <ShieldAlert className="h-3.5 w-3.5" aria-hidden="true" />
              Open Review Preview
            </button>

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
              Production quarantine review, remediation, and re-ingestion are planned for a future TDR
              phase. The preview above is frontend/mock only.
            </div>
          </div>
        )}
      </Card>

      {reviewOpen && (
        <TdrQuarantineReviewPanel
          quality={quality}
          onClose={() => setReviewOpen(false)}
        />
      )}
    </>
  );
}
