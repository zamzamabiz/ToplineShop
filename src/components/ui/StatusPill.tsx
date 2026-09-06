import { getStatusClasses } from "@/design-system/tokens";

export function StatusPill({ status, label }: { status: string; label?: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClasses(status)}`}
    >
      {label || status.replace(/_/g, " ")}
    </span>
  );
}
