export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { CategoryTile } from "@/components/marketplace/CategoryTile";
import { ProductTile } from "@/components/marketplace/ProductTile";
import { VendorTile } from "@/components/marketplace/VendorTile";
import { B2BCallout } from "@/components/marketplace/B2BCallout";
import { TrustBar } from "@/components/marketplace/TrustBar";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { ArrowRight } from "lucide-react";
import {
  marketplaceCategories,
  featuredProducts,
  marketplaceVendors,
} from "@/data/marketplaceMockData";

export default function MarketplacePage() {
  return (
    <AppShell>
      <div className="bg-zinc-50 dark:bg-zinc-950">
        <MarketplaceHero
          title="ToplineShop Marketplace"
          subtitle="Discover products from verified vendors across Nigeria and beyond."
          ctaLabel="Browse Products"
          ctaHref="/products"
        />

        <TrustBar />

        <MarketplaceSection
          title="Shop by Category"
          subtitle="Browse popular categories"
          action={
            <Button variant="ghost" size="sm">
              View All <ArrowRight size={14} />
            </Button>
          }
        >
          <MarketplaceGrid cols={3}>
            {marketplaceCategories.slice(0, 6).map((cat) => (
              <CategoryTile
                key={cat.id}
                name={cat.name}
                count={cat.count}
              />
            ))}
          </MarketplaceGrid>
        </MarketplaceSection>

        <MarketplaceSection
          title="Featured Products"
          subtitle="Handpicked products just for you"
          action={
            <Button variant="ghost" size="sm">
              View All <ArrowRight size={14} />
            </Button>
          }
        >
          <MarketplaceGrid cols={4}>
            {featuredProducts.map((product) => (
              <ProductTile key={product.id} name={product.name} price={product.price} originalPrice={product.originalPrice} rating={product.rating} reviewCount={product.reviewCount} vendor={product.vendor} badge={product.badge} />
            ))}
          </MarketplaceGrid>
        </MarketplaceSection>

        <MarketplaceSection
          title="Top Vendors"
          subtitle="Trusted sellers on ToplineShop"
          action={
            <Button variant="ghost" size="sm">
              View All <ArrowRight size={14} />
            </Button>
          }
        >
          <MarketplaceGrid cols={4}>
            {marketplaceVendors.map((vendor) => (
              <VendorTile key={vendor.id} name={vendor.name} productCount={vendor.productCount} rating={vendor.rating} verified={vendor.verified} href={`/vendors/${vendor.slug}`} />
            ))}
          </MarketplaceGrid>
        </MarketplaceSection>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <B2BCallout />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Business logic not implemented yet. All data shown is mock/placeholder.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
