import { getStatusClasses } from "./tokens";

export function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusClasses(status)}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

export function PhaseStatusBadge({ status }: { status: string }) {
  return <StatusPill status={status} />;
}

export function TaskStatusBadge({ status }: { status: string }) {
  return <StatusPill status={status} />;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const colors: Record<string, string> = {
    HIGH: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    MEDIUM:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    LOW: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  };
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colors[priority] || colors.LOW}`}
    >
      {priority}
    </span>
  );
}
