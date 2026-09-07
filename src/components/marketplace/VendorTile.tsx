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
        "rounded-xl border p-6 hover:shadow-sm transition-all",
        href && "cursor-pointer",
        className
      )}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      <div className="flex items-center gap-4">
        <div
          className="h-12 w-12 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: "color-mix(in srgb, var(--brand-primary) 10%, transparent)",
          }}
        >
          {avatar ? (
            <img src={avatar} alt={name} className="h-12 w-12 rounded-full object-cover" />
          ) : (
            <Store size={20} style={{ color: "var(--brand-primary)" }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-medium text-sm truncate">{name}</h3>
            {verified && (
              <CheckCircle2
                size={14}
                className="flex-shrink-0"
                style={{ color: "var(--state-success)" }}
              />
            )}
          </div>
          <div
            className="flex items-center gap-3 mt-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            {productCount !== undefined && <span>{productCount} products</span>}
            {rating !== undefined && (
              <span style={{ color: "var(--state-warning)" }}>★ {rating.toFixed(1)}</span>
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
