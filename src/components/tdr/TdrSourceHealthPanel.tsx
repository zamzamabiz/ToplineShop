import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Activity, PauseCircle, AlertTriangle, Wifi } from "lucide-react";
import type { TdrSourceHealth, TdrSourceStatus } from "@/types/tdr";

const SOURCE_STYLE: Record<TdrSourceStatus, { label: string; icon: React.ReactNode; color: string; bg: string }> = {
  ACTIVE:    { label: "Active",    icon: <Activity className="h-3.5 w-3.5" />,     color: "#16a34a",             bg: "#dcfce7" },
  PAUSED:    { label: "Paused",    icon: <PauseCircle className="h-3.5 w-3.5" />,  color: "var(--text-muted)",   bg: "var(--surface-muted)" },
  ATTENTION: { label: "Attention", icon: <AlertTriangle className="h-3.5 w-3.5" />, color: "#b45309",            bg: "#fef3c7" },
};

export function TdrSourceHealthPanel({ sources }: { sources: TdrSourceHealth[] }) {
  const counts: Record<TdrSourceStatus, number> = { ACTIVE: 0, PAUSED: 0, ATTENTION: 0 };
  for (const s of sources) counts[s.status]++;

  return (
    <Card title="Source Health">
      {sources.length === 0 ? (
        <EmptyState
          icon={<Wifi className="h-8 w-8" />}
          title="No sources configured"
          description="Trade data sources will appear here once they are registered and connected."
        />
      ) : (
        <div className="space-y-4">
          <div className="flex gap-4 text-sm flex-wrap" role="list" aria-label="Source status summary">
            {(["ACTIVE", "PAUSED", "ATTENTION"] as TdrSourceStatus[]).map((status) => {
              const s = SOURCE_STYLE[status];
              return (
                <span key={status} className="flex items-center gap-1.5" role="listitem">
                  <span style={{ color: s.color }} aria-hidden="true">{s.icon}</span>
                  <span className="font-semibold">{counts[status]}</span>
                  <span style={{ color: "var(--text-muted)" }}>{s.label}</span>
                </span>
              );
            })}
          </div>

          <ul className="space-y-2" aria-label="Source details">
            {sources.map((source) => {
              const s = SOURCE_STYLE[source.status];
              return (
                <li
                  key={source.id}
                  className="flex items-center justify-between gap-3 rounded-lg px-3 py-2.5"
                  style={{ backgroundColor: "var(--surface-secondary)" }}
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{source.name}</div>
                    <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                      Last seen {source.lastSeen} · {source.batchCount} batch{source.batchCount !== 1 ? "es" : ""}
                    </div>
                  </div>
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0"
                    style={{ backgroundColor: s.bg, color: s.color }}
                    aria-label={`Status: ${s.label}`}
                  >
                    <span aria-hidden="true">{s.icon}</span>
                    {s.label}
                  </span>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
