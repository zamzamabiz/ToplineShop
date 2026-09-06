export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { MarketplaceToolbar } from "@/components/marketplace/MarketplaceToolbar";
import { MarketplaceSidebar, SidebarSection, SidebarCheckbox } from "@/components/marketplace/MarketplaceSidebar";
import { ProductTile } from "@/components/marketplace/ProductTile";
import { Badge } from "@/components/ui/Badge";

const placeholderProducts = [
  { name: "Wireless Bluetooth Headphones", price: "₦49,999", originalPrice: "₦79,999", rating: 4.5, reviewCount: 128, vendor: "TechStore", badge: "Sale" },
  { name: "Organic Cotton T-Shirt", price: "₦24,999", rating: 4.2, reviewCount: 56, vendor: "FashionHub" },
  { name: "Stainless Steel Water Bottle", price: "₦18,999", rating: 4.8, reviewCount: 203, vendor: "EcoLiving", badge: "Popular" },
  { name: "Portable Bluetooth Speaker", price: "₦34,999", originalPrice: "₦49,999", rating: 4.3, reviewCount: 89, vendor: "TechStore" },
  { name: "Smart Watch Fitness Tracker", price: "₦29,999", rating: 4.1, reviewCount: 67, vendor: "TechStore" },
  { name: "Natural Face Moisturizer", price: "₦12,999", rating: 4.7, reviewCount: 145, vendor: "BeautyPlus" },
  { name: "Yoga Mat Premium", price: "₦15,999", originalPrice: "₦22,999", rating: 4.4, reviewCount: 78, vendor: "FitLife" },
  { name: "Ceramic Coffee Mug Set", price: "₦8,999", rating: 4.6, reviewCount: 112, vendor: "HomePlus" },
];

export default function ProductsPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Products</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse all products from verified vendors
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <MarketplaceSidebar className="lg:col-span-1">
              <SidebarSection title="Category">
                <SidebarCheckbox label="Electronics" count={120} />
                <SidebarCheckbox label="Fashion" count={85} />
                <SidebarCheckbox label="Home & Garden" count={64} />
                <SidebarCheckbox label="Sports" count={42} />
                <SidebarCheckbox label="Beauty" count={38} />
              </SidebarSection>
              <SidebarSection title="Price Range">
                <SidebarCheckbox label="Under ₦5,000" count={234} />
                <SidebarCheckbox label="₦5,000 - ₦15,000" count={189} />
                <SidebarCheckbox label="₦15,000 - ₦50,000" count={156} />
                <SidebarCheckbox label="Over ₦50,000" count={101} />
              </SidebarSection>
              <SidebarSection title="Rating">
                <SidebarCheckbox label="4★ & above" count={312} />
                <SidebarCheckbox label="3★ & above" count={445} />
              </SidebarSection>
              <SidebarSection title="Availability">
                <SidebarCheckbox label="In Stock" count={467} />
                <SidebarCheckbox label="Pre-Order" count={23} />
              </SidebarSection>
            </MarketplaceSidebar>

            <div className="lg:col-span-3">
              <MarketplaceToolbar resultCount={placeholderProducts.length} />

              <MarketplaceGrid cols={3}>
                {placeholderProducts.map((product) => (
                  <ProductTile key={product.name} {...product} />
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
