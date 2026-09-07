export function StatusPill({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; text: string }> = {
    PLANNED: { bg: "var(--surface-muted)", text: "var(--text-muted)" },
    READY: { bg: "#dbeafe", text: "#1d4ed8" },
    IN_PROGRESS: { bg: "#fef3c7", text: "#b45309" },
    BLOCKED: { bg: "#fee2e2", text: "#dc2626" },
    PARTIAL: { bg: "#ffedd5", text: "#ea580c" },
    PASS: { bg: "#dcfce7", text: "#16a34a" },
    CLOSED: { bg: "var(--surface-muted)", text: "var(--text-muted)" },
    DEFERRED: { bg: "#f3e8ff", text: "#9333ea" },
    NOT_STARTED: { bg: "var(--surface-muted)", text: "var(--text-muted)" },
    ACTIVE: { bg: "#dcfce7", text: "#16a34a" },
    ENFORCED: { bg: "#dcfce7", text: "#16a34a" },
  };
  const colors = colorMap[status] || colorMap.PLANNED;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
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
  const colors: Record<string, { bg: string; text: string }> = {
    HIGH: { bg: "#fee2e2", text: "#dc2626" },
    MEDIUM: { bg: "#fef3c7", text: "#b45309" },
    LOW: { bg: "var(--surface-muted)", text: "var(--text-muted)" },
  };
  const c = colors[priority] || colors.LOW;
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {priority}
    </span>
  );
}
