import { Card } from "@/components/ui/Card";
import { AlertTriangle, CheckCircle2, ShieldAlert, FileText, ArrowRight, CircleAlert } from "lucide-react";
import type { TdrEvidenceState, TdrLineageReport, TdrQualityDisposition, TdrQualitySeverity } from "@/types/tdr";

const severityColors: Record<TdrQualitySeverity, { label: string; bg: string; color: string }> = {
  warning: { label: "Warning", bg: "#fef3c7", color: "#b45309" },
  error: { label: "Error", bg: "#fee2e2", color: "#b91c1c" },
  fatal: { label: "Fatal", bg: "#fecaca", color: "#7f1d1d" },
};

const dispositionColors: Record<TdrQualityDisposition, string> = {
  accepted: "#16a34a",
  corrected: "#2563eb",
  quarantined: "#a16207",
  rejected: "#dc2626",
};

const evidenceColors: Record<TdrEvidenceState, { bg: string; color: string; label: string }> = {
  available: { bg: "#dcfce7", color: "#166534", label: "Available" },
  stale: { bg: "#fef3c7", color: "#b45309", label: "Stale" },
  missing: { bg: "#f3f4f6", color: "#4b5563", label: "Missing" },
  unavailable: { bg: "#fee2e2", color: "#991b1b", label: "Unavailable" },
};

export function TdrLineageQualityPanel({ lineage }: { lineage: TdrLineageReport }) {
  return (
    <Card title="Lineage & Quality Reporting Preview" className="overflow-hidden">
      <div className="space-y-6">
        <div
          className="rounded-lg border px-4 py-3 text-sm"
          style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          role="note"
          aria-label="Preview-only lineage and quality reporting"
        >
          <span style={{ color: "var(--text-secondary)" }} className="font-semibold">Preview-only:</span> This panel
          shows synthetic lineage and quality evidence for UX approval only. It does not represent live backend data,
          production ingestion, or operational reporting.
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[
            { label: "Accepted", value: lineage.summary.accepted, color: "#16a34a" },
            { label: "Corrected", value: lineage.summary.corrected, color: "#2563eb" },
            { label: "Rejected", value: lineage.summary.rejected, color: "#dc2626" },
            { label: "Quarantined", value: lineage.summary.quarantined, color: "#b45309" },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-lg border p-4"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            >
              <div className="text-xs uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{item.label}</div>
              <div className="mt-2 text-2xl font-bold" style={{ color: item.color }}>
                {item.value.toLocaleString()}
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-default)" }}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <FileText className="h-4 w-4" style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
              Processing lineage
            </div>
            <div className="space-y-3">
              {lineage.stages.map((stage, index) => (
                <div key={stage.id} className="rounded-md border p-3" style={{ borderColor: "var(--border-default)" }}>
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full text-xs" style={{ backgroundColor: "var(--surface-secondary)" }}>
                      {index + 1}
                    </span>
                    {stage.label}
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{stage.source}</span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: stage.status === "accepted" ? "#dcfce7" : stage.status === "warning" ? "#fef3c7" : stage.status === "review" ? "#e0f2fe" : "#fee2e2", color: stage.status === "accepted" ? "#166534" : stage.status === "warning" ? "#b45309" : stage.status === "review" ? "#0f766e" : "#b91c1c" }}>
                      {stage.status === "accepted" ? <CheckCircle2 className="h-3 w-3" /> : stage.status === "warning" ? <AlertTriangle className="h-3 w-3" /> : stage.status === "review" ? <ShieldAlert className="h-3 w-3" /> : <CircleAlert className="h-3 w-3" />}
                      {stage.status}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-3 text-xs">
                    <span style={{ color: "var(--text-muted)" }}>{stage.note}</span>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 font-medium" style={{ backgroundColor: evidenceColors[stage.evidenceState].bg, color: evidenceColors[stage.evidenceState].color }}>
                      {evidenceColors[stage.evidenceState].label}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-default)" }}>
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <ShieldAlert className="h-4 w-4" style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
              Quality findings
            </div>
            <div className="space-y-3">
              {lineage.findings.map((finding) => (
                <div key={finding.id} className="rounded-md border p-3" style={{ borderColor: "var(--border-default)" }}>
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-medium">{finding.rule}</div>
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: severityColors[finding.severity].bg, color: severityColors[finding.severity].color }}>
                      {severityColors[finding.severity].label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <span>{finding.stage}</span>
                    <span>{finding.evidenceId}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between gap-2 text-xs">
                    <span>Records: {finding.affectedCount.toLocaleString()}</span>
                    <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium" style={{ color: dispositionColors[finding.disposition] }}>
                      <ArrowRight className="h-3 w-3" />
                      {finding.disposition}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-lg border p-4" style={{ borderColor: "var(--border-default)" }}>
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
            <FileText className="h-4 w-4" style={{ color: "var(--brand-primary)" }} aria-hidden="true" />
            Evidence coverage
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3">
            {lineage.evidence.map((item) => (
              <div key={item.id} className="rounded-md border p-3" style={{ borderColor: "var(--border-default)" }}>
                <div className="text-sm font-medium">{item.label}</div>
                <div className="mt-2 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" style={{ backgroundColor: evidenceColors[item.state].bg, color: evidenceColors[item.state].color }}>
                  {evidenceColors[item.state].label}
                </div>
                <div className="mt-2 text-xs" style={{ color: "var(--text-muted)" }}>{item.note}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: "var(--text-muted)" }}>
          <span className="font-medium">Quality score:</span>
          <span className="text-lg font-semibold" style={{ color: "var(--brand-primary)" }}>{lineage.summary.qualityScore}%</span>
          <span>·</span>
          <span>{lineage.summary.sourcesSynced} sources synced</span>
          <span>·</span>
          <span>{lineage.summary.lastUpdated ? `Updated ${new Date(lineage.summary.lastUpdated).toLocaleString()}` : "No successful update"}</span>
        </div>
      </div>
    </Card>
  );
}
