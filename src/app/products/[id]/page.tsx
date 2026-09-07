export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { ProductTile } from "@/components/marketplace/ProductTile";
import { Badge } from "@/components/ui/Badge";
import { productListingItems, marketplaceCategories, marketplaceVendors } from "@/data/marketplaceMockData";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = productListingItems.find((p) => p.id === id);

  if (!product) {
    return (
      <AppShell>
        <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Not Found</span>
            </nav>
            <div className="rounded-xl border border-border p-12 text-center" style={{ backgroundColor: "var(--surface-primary)" }}>
              <h1 className="text-xl font-bold mb-2">Product Not Found</h1>
              <p className="text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                The product you are looking for does not exist.
              </p>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Browse all products
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const category = marketplaceCategories.find((c) => c.id === product.categoryId);
  const productVendor = marketplaceVendors.find((v) => v.id === product.vendorId);
  const relatedProducts = productListingItems
    .filter((p) => p.categoryId === product.categoryId && p.id !== product.id)
    .slice(0, 4);

  return (
    <AppShell>
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/products" className="hover:text-foreground transition-colors">Products</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "var(--surface-primary)" }}>
              <div className="aspect-square flex items-center justify-center relative" style={{ backgroundColor: "var(--surface-muted)" }}>
                {product.image ? (
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="text-sm" style={{ color: "var(--text-muted)" }}>No image available</div>
                )}
                {product.badge && (
                  <span className="absolute top-4 left-4 inline-flex items-center rounded-full bg-primary px-3 py-1 text-sm font-medium text-primary-foreground">
                    {product.badge}
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <div>
                {category && (
                  <div className="text-sm mb-2" style={{ color: "var(--text-muted)" }}>{category.name}</div>
                )}
                <h1 className="text-2xl font-bold">{product.name}</h1>
                {product.vendor && (
                  <div className="text-sm mt-2" style={{ color: "var(--text-muted)" }}>
                    by{" "}
                    {productVendor ? (
                      <Link href={`/vendors/${productVendor.slug}`} className="font-medium text-foreground hover:underline">
                        {product.vendor}
                      </Link>
                    ) : (
                      <span className="font-medium">{product.vendor}</span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-bold">{product.price}</span>
                {product.originalPrice && (
                  <span className="text-lg line-through" style={{ color: "var(--text-muted)" }}>
                    {product.originalPrice}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                {product.rating !== undefined && (
                  <div className="flex items-center gap-1 text-sm">
                    <span className="text-amber-500">
                      {"★".repeat(Math.round(product.rating))}
                    </span>
                    <span>{product.rating.toFixed(1)}</span>
                    <span style={{ color: "var(--text-muted)" }}>({product.reviewCount} reviews)</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <Badge>{product.stockLabel || (product.inStock ? "In Stock" : "Out of Stock")}</Badge>
              </div>

              {product.description && (
                <div className="text-sm leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  {product.description}
                </div>
              )}

              <div className="space-y-3 pt-4 border-t border-border">
                <button disabled className="w-full h-11 rounded-lg bg-primary text-primary-foreground font-medium text-sm opacity-50 cursor-not-allowed">
                  Add to Cart
                </button>
                <button disabled className="w-full h-11 rounded-lg border border-border font-medium text-sm opacity-50 cursor-not-allowed">
                  Buy Now
                </button>
                <p className="text-xs text-center" style={{ color: "var(--text-muted)" }}>
                  <Badge>Frontend Placeholder</Badge> — Cart and checkout are not yet implemented
                </p>
              </div>

              <div className="rounded-lg p-4 space-y-2 text-sm" style={{ backgroundColor: "var(--surface-muted)" }}>
                {product.deliveryNote && (
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--text-muted)" }}>🚚</span>
                    <span>{product.deliveryNote}</span>
                  </div>
                )}
                {product.returnNote && (
                  <div className="flex items-center gap-2">
                    <span style={{ color: "var(--text-muted)" }}>↩️</span>
                    <span>{product.returnNote}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--text-muted)" }}>🔒</span>
                  <span>Secure payment at checkout</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ color: "var(--text-muted)" }}>✓</span>
                  <span>Verified vendor</span>
                </div>
              </div>
            </div>
          </div>

          {product.specifications && product.specifications.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-bold mb-4">Specifications</h2>
              <div className="rounded-xl border border-border overflow-hidden" style={{ backgroundColor: "var(--surface-primary)" }}>
                <table className="w-full text-sm">
                  <tbody>
                    {product.specifications.map((spec, idx) => (
                      <tr key={idx} className={idx % 2 === 0 ? "" : ""} style={idx % 2 === 0 ? { backgroundColor: "var(--surface-muted)" } : undefined}>
                        <td className="px-4 py-3 font-medium w-1/3">{spec.label}</td>
                        <td className="px-4 py-3" style={{ color: "var(--text-muted)" }}>{spec.value}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {relatedProducts.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-bold mb-4">Related Products</h2>
              <MarketplaceGrid cols={4}>
                {relatedProducts.map((rp) => (
                  <ProductTile
                    key={rp.id}
                    name={rp.name}
                    price={rp.price}
                    originalPrice={rp.originalPrice}
                    rating={rp.rating}
                    reviewCount={rp.reviewCount}
                    vendor={rp.vendor}
                    badge={rp.badge}
                    href={`/products/${rp.id}`}
                  />
                ))}
              </MarketplaceGrid>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
