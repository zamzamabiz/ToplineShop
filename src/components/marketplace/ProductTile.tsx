import { cn } from "@/lib/utils";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export function ProductTile({
  name,
  price,
  originalPrice,
  rating,
  reviewCount,
  vendor,
  image,
  badge,
  href,
  className,
}: {
  name: string;
  price: string;
  originalPrice?: string;
  rating?: number;
  reviewCount?: number;
  vendor?: string;
  image?: string;
  badge?: string;
  href?: string;
  className?: string;
}) {
  const content = (
    <div
      className={cn(
        "group rounded-xl border overflow-hidden hover:shadow-sm transition-all",
        href && "cursor-pointer",
        className
      )}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      <div
        className="aspect-square flex items-center justify-center relative"
        style={{ backgroundColor: "var(--surface-muted)" }}
      >
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-sm" style={{ color: "var(--text-muted)" }}>
            No image
          </div>
        )}
        {badge && (
          <span
            className="absolute top-3 left-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: "var(--brand-primary)",
              color: "var(--text-inverse)",
            }}
          >
            {badge}
          </span>
        )}
        <button
          disabled
          aria-disabled
          aria-label="Add to cart - not yet implemented"
          className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-not-allowed opacity-50!"
          style={{
            backgroundColor: "color-mix(in srgb, var(--surface-primary) 80%, transparent)",
          }}
        >
          <ShoppingCart size={14} />
        </button>
      </div>
      <div className="p-4">
        {vendor && (
          <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
            {vendor}
          </div>
        )}
        <h3 className="text-sm font-medium line-clamp-2">{name}</h3>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-lg font-bold">{price}</span>
          {originalPrice && (
            <span
              className="text-sm line-through"
              style={{ color: "var(--text-muted)" }}
            >
              {originalPrice}
            </span>
          )}
        </div>
        {rating !== undefined && (
          <div
            className="mt-2 flex items-center gap-1 text-xs"
            style={{ color: "var(--text-muted)" }}
          >
            <span style={{ color: "var(--state-warning)" }}>
              {"★".repeat(Math.round(rating))}
            </span>
            <span>{rating.toFixed(1)}</span>
            {reviewCount !== undefined && <span>({reviewCount})</span>}
          </div>
        )}
      </div>
    </div>
  );

  if (href) {
    return <Link href={href}>{content}</Link>;
  }
  return content;
}
