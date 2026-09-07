import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  change,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  change?: { value: string; positive: boolean };
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border p-6", className)}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium" style={{ color: "var(--text-secondary)" }}>
          {label}
        </div>
        {icon && <div style={{ color: "var(--text-muted)" }}>{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {change && (
        <div
          className="mt-1 text-xs font-medium"
          style={{
            color: change.positive ? "var(--state-success)" : "var(--state-danger)",
          }}
        >
          {change.value}
        </div>
      )}
    </div>
  );
}
