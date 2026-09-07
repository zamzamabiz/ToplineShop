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
import { Search, ArrowRight, TrendingUp, Sparkles, Zap } from "lucide-react";
import Link from "next/link";
import {
  marketplaceCategories,
  featuredProducts,
  marketplaceVendors,
} from "@/data/marketplaceMockData";

export default function MarketplacePage() {
  return (
    <AppShell>
      <div style={{ backgroundColor: "var(--app-canvas)" }}>
        <MarketplaceHero
          title="ToplineShop Marketplace"
          subtitle="Discover products from verified vendors across Nigeria and beyond."
          ctaLabel="Browse Products"
          ctaHref="/products"
        >
          <div className="relative w-full max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2"
              style={{ color: "var(--text-muted)" }}
            />
            <input
              type="text"
              placeholder="Search products, categories, vendors..."
              disabled
              className="w-full rounded-lg border pl-10 pr-4 py-2.5 text-sm opacity-60 cursor-not-allowed"
              style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
            />
            <Button size="sm" className="absolute right-1 top-1/2 -translate-y-1/2" disabled>
              Search
            </Button>
          </div>
        </MarketplaceHero>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Search size={14} className="flex-shrink-0" style={{ color: "var(--text-muted)" }} />
              <span style={{ color: "var(--text-muted)" }}>
                Search is a frontend placeholder. Real search will be implemented in a later backend phase.
              </span>
            </div>
          </div>
        </div>

        <TrustBar />

        <MarketplaceSection
          title="Shop by Category"
          subtitle="Browse popular categories"
          action={
            <Link href="/categories" className="inline-flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors" style={{ color: "var(--text-muted)" }}>
              View All <ArrowRight size={14} />
            </Link>
          }
        >
          <MarketplaceGrid cols={4}>
            {marketplaceCategories.slice(0, 8).map((cat) => (
              <CategoryTile
                key={cat.id}
                name={cat.name}
                count={cat.count}
                slug={cat.slug}
              />
            ))}
          </MarketplaceGrid>
        </MarketplaceSection>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { icon: TrendingUp, title: "Trending Now", desc: "See what other shoppers are buying", color: "text-orange-500 bg-orange-50" },
              { icon: Sparkles, title: "New Arrivals", desc: "Fresh products added daily", color: "text-purple-500 bg-purple-50" },
              { icon: Zap, title: "Flash Deals", desc: "Limited-time offers from top vendors", color: "text-amber-500 bg-amber-50" },
            ].map((item) => (
              <div
                key={item.title}
                className="flex items-center gap-4 rounded-xl border p-4"
                style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
              >
                <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.color}`}>
                  <item.icon size={20} />
                </div>
                <div>
                  <div className="font-medium text-sm">{item.title}</div>
                  <div className="text-xs" style={{ color: "var(--text-muted)" }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <MarketplaceSection
          title="Featured Products"
          subtitle="Handpicked products just for you"
          action={
            <Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium hover:text-foreground transition-colors" style={{ color: "var(--text-muted)" }}>
              View All <ArrowRight size={14} />
            </Link>
          }
        >
          <MarketplaceGrid cols={4}>
            {featuredProducts.map((product) => (
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
              <VendorTile
                key={vendor.id}
                name={vendor.name}
                productCount={vendor.productCount}
                rating={vendor.rating}
                verified={vendor.verified}
                href={`/vendors/${vendor.slug}`}
              />
            ))}
          </MarketplaceGrid>
        </MarketplaceSection>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
          <B2BCallout />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <div
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span style={{ color: "var(--text-muted)" }}>
                Business logic not implemented yet. All data shown is mock/placeholder. Search, filters, and cart are not functional.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
