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
      className={cn(
        "rounded-xl border border-border bg-white dark:bg-zinc-900 p-6",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-muted-foreground">{label}</div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
      <div className="mt-2 text-2xl font-bold">{value}</div>
      {change && (
        <div
          className={cn(
            "mt-1 text-xs font-medium",
            change.positive ? "text-green-600" : "text-red-600"
          )}
        >
          {change.value}
        </div>
      )}
    </div>
  );
}
