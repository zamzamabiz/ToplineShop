import { Card } from "@/components/ui/Card";
import { CheckCircle2, AlertTriangle, XCircle, AlertCircle } from "lucide-react";
import type { TdrQualitySummary } from "@/types/tdr";

interface Row {
  label: string;
  icon: React.ReactNode;
  color: string;
  value: number;
  description: string;
}

export function TdrQualityPanel({ quality }: { quality: TdrQualitySummary }) {
  const rows: Row[] = [
    {
      label: "Accepted",
      icon: <CheckCircle2 className="h-4 w-4" />,
      color: "#16a34a",
      value: quality.accepted,
      description: "Passed all validation rules",
    },
    {
      label: "Warning",
      icon: <AlertTriangle className="h-4 w-4" />,
      color: "#b45309",
      value: quality.warning,
      description: "Minor issues; accepted with flag",
    },
    {
      label: "Error",
      icon: <XCircle className="h-4 w-4" />,
      color: "#dc2626",
      value: quality.error,
      description: "Failed validation; quarantined",
    },
    {
      label: "Fatal",
      icon: <AlertCircle className="h-4 w-4" />,
      color: "#dc2626",
      value: quality.fatal,
      description: "Critical failure; requires review",
    },
  ];

  const total = rows.reduce((s, r) => s + r.value, 0);

  return (
    <Card title="Quality Summary">
      {total === 0 ? (
        <p className="text-sm text-center py-6" style={{ color: "var(--text-muted)" }}>
          No quality data — no records processed yet.
        </p>
      ) : (
        <div className="space-y-3">
          {rows.map((row) => (
            <div key={row.label} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <span style={{ color: row.color }} aria-hidden="true">
                  {row.icon}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium">{row.label}</div>
                  <div className="text-xs truncate" style={{ color: "var(--text-muted)" }}>
                    {row.description}
                  </div>
                </div>
              </div>
              <div
                className="text-sm font-semibold tabular-nums shrink-0"
                style={{ color: row.label !== "Accepted" && row.value > 0 ? row.color : "inherit" }}
              >
                {row.value.toLocaleString()}
              </div>
            </div>
          ))}
          <div
            className="pt-3 text-xs"
            style={{ borderTop: "1px solid var(--border-default)", color: "var(--text-muted)" }}
          >
            Total evaluated: {total.toLocaleString()} records
          </div>
        </div>
      )}
    </Card>
  );
}
