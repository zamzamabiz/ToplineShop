import { cn } from "@/lib/utils";
import { Store, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export function VendorTile({
  name,
  productCount,
  rating,
  avatar,
  verified,
  href,
  className,
}: {
  name: string;
  productCount?: number;
  rating?: number;
  avatar?: string;
  verified?: boolean;
  href?: string;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "rounded-xl border border-border bg-white dark:bg-zinc-900 p-6 hover:border-primary/50 hover:shadow-sm transition-all",
        href && "cursor-pointer",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          {avatar ? (
            <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <Store size={20} className="text-primary" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-medium text-sm truncate">{name}</h3>
            {verified && <CheckCircle2 size={14} className="text-green-500 flex-shrink-0" />}
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            {productCount !== undefined && <span>{productCount} products</span>}
            {rating !== undefined && (
              <span className="text-amber-500">★ {rating.toFixed(1)}</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
