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
      className={`rounded-xl border border-border bg-white dark:bg-zinc-900 ${className}`}
    >
      <div className="px-6 py-4 border-b border-border">
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}
