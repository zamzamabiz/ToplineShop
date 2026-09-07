export function ProgressBar({
  value,
  className = "",
}: {
  value: number;
  className?: string;
}) {
  return (
    <div
      className={`w-full rounded-full h-2 ${className}`}
      style={{ backgroundColor: "var(--surface-muted)" }}
    >
      <div
        className="h-2 rounded-full transition-all duration-300"
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          backgroundColor: "var(--brand-primary)",
        }}
      />
    </div>
  );
}
