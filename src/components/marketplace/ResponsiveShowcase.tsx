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
      className={cn(
        "rounded-xl border border-border bg-white dark:bg-zinc-900 overflow-hidden",
        className
      )}
    >
      <div className="p-4 border-b border-border">
        <h3 className="font-medium text-sm">{title}</h3>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        )}
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}
