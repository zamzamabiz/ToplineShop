import { MetricCard } from "@/components/ui/MetricCard";
import { Inbox, BarChart3, AlertTriangle, CheckCircle2, Gauge, Clock } from "lucide-react";
import type { TdrMetrics } from "@/types/tdr";

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
}

function fmtDateTime(iso: string): string {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short" }) +
      " " +
      d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return iso;
  }
}

export function TdrMetricsGrid({ metrics }: { metrics: TdrMetrics }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      <MetricCard
        label="Batches Received"
        value={metrics.batchesReceived}
        icon={<Inbox className="h-4 w-4" />}
      />
      <MetricCard
        label="Records Processed"
        value={fmt(metrics.recordsProcessed)}
        icon={<BarChart3 className="h-4 w-4" />}
      />
      <MetricCard
        label="Quarantined"
        value={fmt(metrics.recordsQuarantined)}
        icon={<AlertTriangle className="h-4 w-4" />}
      />
      <MetricCard
        label="Published"
        value={fmt(metrics.recordsPublished)}
        icon={<CheckCircle2 className="h-4 w-4" />}
      />
      <MetricCard
        label="Quality Score"
        value={metrics.dataQualityScore > 0 ? `${metrics.dataQualityScore}%` : "—"}
        icon={<Gauge className="h-4 w-4" />}
        change={
          metrics.dataQualityScore > 0
            ? {
                value: metrics.dataQualityScore >= 95 ? "Within target" : "Below target",
                positive: metrics.dataQualityScore >= 95,
              }
            : undefined
        }
      />
      <MetricCard
        label="Last Successful Run"
        value={metrics.lastSuccessfulRun ? fmtDateTime(metrics.lastSuccessfulRun) : "No runs yet"}
        icon={<Clock className="h-4 w-4" />}
      />
    </div>
  );
}
