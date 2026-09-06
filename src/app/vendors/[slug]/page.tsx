export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { ProductTile } from "@/components/marketplace/ProductTile";
import { Badge } from "@/components/ui/Badge";
import { marketplaceVendors, productListingItems } from "@/data/marketplaceMockData";
import { Store, CheckCircle2, MapPin, Clock, MessageSquare } from "lucide-react";

export function generateStaticParams() {
  return marketplaceVendors.map((v) => ({ slug: v.slug }));
}

export default async function VendorStorefrontPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const vendor = marketplaceVendors.find((v) => v.slug === slug);

  if (!vendor) {
    return (
      <AppShell>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Not Found</span>
            </nav>
            <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-12 text-center">
              <h1 className="text-xl font-bold mb-2">Vendor Not Found</h1>
              <p className="text-sm text-muted-foreground mb-4">
                The vendor you are looking for does not exist.
              </p>
              <Link
                href="/marketplace"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Browse marketplace
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const vendorProducts = productListingItems.filter(
    (p) => p.vendorId === vendor.id
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{vendor.name}</span>
          </nav>

          <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-8 mb-8">
            <div className="flex flex-col sm:flex-row items-start gap-6">
              <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                {vendor.avatar ? (
                  <img src={vendor.avatar} alt={vendor.name} className="h-20 w-20 rounded-full object-cover" />
                ) : (
                  <Store size={32} className="text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-2xl font-bold">{vendor.name}</h1>
                  {vendor.verified && (
                    <CheckCircle2 size={20} className="text-green-500" />
                  )}
                </div>
                {vendor.description && (
                  <p className="text-sm text-muted-foreground mt-2">{vendor.description}</p>
                )}
                <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                  {vendor.location && (
                    <span className="flex items-center gap-1"><MapPin size={14} /> {vendor.location}</span>
                  )}
                  {vendor.joinedLabel && (
                    <span className="flex items-center gap-1"><Clock size={14} /> {vendor.joinedLabel}</span>
                  )}
                  {vendor.responseRate && (
                    <span className="flex items-center gap-1"><MessageSquare size={14} /> {vendor.responseRate} response rate</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            <div className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-lg font-bold">Products</h2>
                <Badge>{vendor.productCount} total</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                Showing {vendorProducts.length} featured products from this vendor
              </p>
              {vendorProducts.length > 0 ? (
                <MarketplaceGrid cols={3}>
                  {vendorProducts.map((product) => (
                    <ProductTile
                      key={product.id}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      rating={product.rating}
                      reviewCount={product.reviewCount}
                      vendor={product.vendor}
                      badge={product.badge}
                      href={`/products/${product.id}`}
                    />
                  ))}
                </MarketplaceGrid>
              ) : (
                <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-12 text-center">
                  <p className="text-muted-foreground">
                    No featured products from this vendor yet.
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-6">
              <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6">
                <h3 className="font-semibold text-sm mb-4">Store Information</h3>
                <div className="space-y-3 text-sm">
                  {vendor.rating !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Rating</span>
                      <span className="text-amber-500 font-medium">★ {vendor.rating.toFixed(1)}</span>
                    </div>
                  )}
                  {vendor.productCount !== undefined && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Products</span>
                      <span className="font-medium">{vendor.productCount}</span>
                    </div>
                  )}
                  {vendor.responseRate && (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Response Rate</span>
                      <span className="font-medium">{vendor.responseRate}</span>
                    </div>
                  )}
                </div>
              </div>

              {vendor.storeMetrics && vendor.storeMetrics.length > 0 && (
                <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6">
                  <h3 className="font-semibold text-sm mb-4">Store Metrics</h3>
                  <div className="space-y-3 text-sm">
                    {vendor.storeMetrics.map((metric, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-muted-foreground">{metric.label}</span>
                        <span className="font-medium">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6">
                <h3 className="font-semibold text-sm mb-4">Policies</h3>
                <div className="space-y-3 text-sm">
                  {vendor.deliveryNote && (
                    <div>
                      <span className="font-medium">Delivery:</span>{" "}
                      <span className="text-muted-foreground">{vendor.deliveryNote}</span>
                    </div>
                  )}
                  {vendor.returnPolicy && (
                    <div>
                      <span className="font-medium">Returns:</span>{" "}
                      <span className="text-muted-foreground">{vendor.returnPolicy}</span>
                    </div>
                  )}
                  {vendor.supportNote && (
                    <div>
                      <span className="font-medium">Support:</span>{" "}
                      <span className="text-muted-foreground">{vendor.supportNote}</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                <button disabled className="w-full h-11 rounded-lg border border-border font-medium text-sm opacity-50 cursor-not-allowed">
                  Contact Vendor
                </button>
                <button disabled className="w-full h-11 rounded-lg border border-border font-medium text-sm opacity-50 cursor-not-allowed">
                  Follow Store
                </button>
                <button disabled className="w-full h-11 rounded-lg border border-border font-medium text-sm opacity-50 cursor-not-allowed">
                  Request Quote
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  <Badge>Frontend Placeholder</Badge> — Contact, follow, and quote features are not yet implemented
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Vendor storefront is mock data only. Contact, follow, and quote features are not yet implemented.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
