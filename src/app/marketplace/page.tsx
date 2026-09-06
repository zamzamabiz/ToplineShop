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

const placeholderCategories = [
  { name: "Electronics", count: 120 },
  { name: "Fashion", count: 85 },
  { name: "Home & Garden", count: 64 },
  { name: "Sports", count: 42 },
  { name: "Beauty", count: 38 },
  { name: "Toys", count: 29 },
];

const placeholderProducts = [
  { name: "Wireless Bluetooth Headphones", price: "$49.99", originalPrice: "$79.99", rating: 4.5, reviewCount: 128, vendor: "TechStore", badge: "Sale" },
  { name: "Organic Cotton T-Shirt", price: "$24.99", rating: 4.2, reviewCount: 56, vendor: "FashionHub" },
  { name: "Stainless Steel Water Bottle", price: "$18.99", rating: 4.8, reviewCount: 203, vendor: "EcoLiving", badge: "Popular" },
  { name: "Portable Bluetooth Speaker", price: "$34.99", originalPrice: "$49.99", rating: 4.3, reviewCount: 89, vendor: "TechStore" },
];

const placeholderVendors = [
  { name: "TechStore", productCount: 156, rating: 4.7 },
  { name: "FashionHub", productCount: 89, rating: 4.5 },
  { name: "EcoLiving", productCount: 67, rating: 4.8 },
  { name: "HomePlus", productCount: 112, rating: 4.4 },
];

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
            {placeholderCategories.map((cat) => (
              <CategoryTile
                key={cat.name}
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
            {placeholderProducts.map((product) => (
              <ProductTile key={product.name} {...product} />
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
            {placeholderVendors.map((vendor) => (
              <VendorTile key={vendor.name} {...vendor} />
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
