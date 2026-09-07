import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";
import Link from "next/link";

export function CategoryTile({
  name,
  count,
  icon,
  slug,
  className,
}: {
  name: string;
  count?: number;
  icon?: React.ReactNode;
  slug?: string;
  className?: string;
}) {
  const href = slug ? `/categories/${slug}` : "#";

  const content = (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border p-6 hover:shadow-sm transition-all",
        slug && "cursor-pointer",
        className
      )}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      <div
        className="flex h-14 w-14 items-center justify-center rounded-full"
        style={{
          backgroundColor: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
          color: "var(--brand-primary)",
        }}
      >
        {icon || <Tag size={24} />}
      </div>
      <div className="text-center">
        <div className="font-medium text-sm">{name}</div>
        {count !== undefined && (
          <div className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
            {count} items
          </div>
        )}
      </div>
    </div>
  );

  if (slug) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
