export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { MarketplaceToolbar } from "@/components/marketplace/MarketplaceToolbar";
import { MarketplaceSidebar, SidebarSection, SidebarCheckbox } from "@/components/marketplace/MarketplaceSidebar";
import { ProductTile } from "@/components/marketplace/ProductTile";
import { Badge } from "@/components/ui/Badge";
import {
  productListingItems,
  productFilterCategories,
  productFilterPriceRanges,
  productFilterRatings,
  productFilterAvailability,
} from "@/data/marketplaceMockData";

export default function ProductsPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Products</span>
          </nav>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Products</h1>
              <Badge>{productListingItems.length} items</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Browse marketplace products from verified vendors across Nigeria
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <MarketplaceSidebar className="lg:col-span-1">
              <SidebarSection title="Category">
                {productFilterCategories.map((opt) => (
                  <SidebarCheckbox key={opt.label} label={opt.label} count={opt.count} />
                ))}
              </SidebarSection>
              <SidebarSection title="Price Range">
                {productFilterPriceRanges.map((opt) => (
                  <SidebarCheckbox key={opt.label} label={opt.label} count={opt.count} />
                ))}
              </SidebarSection>
              <SidebarSection title="Rating">
                {productFilterRatings.map((opt) => (
                  <SidebarCheckbox key={opt.label} label={opt.label} count={opt.count} />
                ))}
              </SidebarSection>
              <SidebarSection title="Availability">
                {productFilterAvailability.map((opt) => (
                  <SidebarCheckbox key={opt.label} label={opt.label} count={opt.count} />
                ))}
              </SidebarSection>
              <div className="pt-4 border-t border-border">
                <p className="text-xs text-muted-foreground">
                  Filters are frontend placeholders. Actual filtering not yet implemented.
                </p>
              </div>
            </MarketplaceSidebar>

            <div className="lg:col-span-3">
              <MarketplaceToolbar resultCount={productListingItems.length} />

              <MarketplaceGrid cols={3}>
                {productListingItems.map((product) => (
                  <ProductTile key={product.id} name={product.name} price={product.price} originalPrice={product.originalPrice} rating={product.rating} reviewCount={product.reviewCount} vendor={product.vendor} badge={product.badge} />
                ))}
              </MarketplaceGrid>

              <div className="mt-8 flex justify-center">
                <div className="flex items-center gap-2">
                  <button className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium">
                    1
                  </button>
                  <button className="h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-muted">
                    2
                  </button>
                  <button className="h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-muted">
                    3
                  </button>
                  <span className="text-muted-foreground text-sm">...</span>
                  <button className="h-9 px-4 rounded-md border border-border text-sm font-medium hover:bg-muted">
                    12
                  </button>
                </div>
              </div>
              <p className="text-center text-xs text-muted-foreground mt-3">
                Pagination is a frontend placeholder. Not yet functional.
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Business logic not implemented yet. All products, filters, and pagination are mock data.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
