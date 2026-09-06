import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

export function CategoryTile({
  name,
  count,
  icon,
  href = "#",
  className,
}: {
  name: string;
  count?: number;
  icon?: React.ReactNode;
  href?: string;
  className?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-border bg-white dark:bg-zinc-900 p-6 hover:border-primary/50 hover:shadow-sm transition-all",
        className
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon || <Tag size={24} />}
      </div>
      <div className="text-center">
        <div className="font-medium text-sm">{name}</div>
        {count !== undefined && (
          <div className="text-xs text-muted-foreground mt-0.5">
            {count} items
          </div>
        )}
      </div>
    </a>
  );
}
