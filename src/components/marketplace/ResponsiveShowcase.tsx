import { cn } from "@/lib/utils";

export function ResponsiveShowcase({
  title,
  description,
  children,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("rounded-xl border overflow-hidden", className)}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      <div className="p-4 border-b" style={{ borderColor: "var(--border-default)" }}>
        <h3 className="font-medium text-sm">{title}</h3>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {description}
          </p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
