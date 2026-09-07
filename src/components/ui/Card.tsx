export function Card({
  title,
  children,
  className = "",
}: {
  title: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border ${className}`}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      <div
        className="px-6 py-4 border-b"
        style={{ borderColor: "var(--border-default)" }}
      >
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
