export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { MarketplaceSidebar, SidebarSection, SidebarCheckbox } from "@/components/marketplace/MarketplaceSidebar";
import { CategoryTile } from "@/components/marketplace/CategoryTile";
import { Badge } from "@/components/ui/Badge";
import {
  Laptop,
  Shirt,
  Home,
  Dumbbell,
  Sparkles,
  Gamepad2,
  BookOpen,
  Baby,
} from "lucide-react";

const departments = [
  { name: "Electronics", count: 120, icon: Laptop },
  { name: "Fashion", count: 85, icon: Shirt },
  { name: "Home & Garden", count: 64, icon: Home },
  { name: "Sports & Outdoors", count: 42, icon: Dumbbell },
  { name: "Beauty & Health", count: 38, icon: Sparkles },
  { name: "Toys & Games", count: 29, icon: Gamepad2 },
  { name: "Books & Media", count: 21, icon: BookOpen },
  { name: "Baby & Kids", count: 18, icon: Baby },
];

const priceRanges = [
  { label: "Under ₦5,000", count: 234 },
  { label: "₦5,000 - ₦15,000", count: 189 },
  { label: "₦15,000 - ₦50,000", count: 156 },
  { label: "₦50,000 - ₦100,000", count: 67 },
  { label: "Over ₦100,000", count: 34 },
];

const ratings = [
  { label: "4★ & above", count: 312 },
  { label: "3★ & above", count: 445 },
  { label: "2★ & above", count: 489 },
];

export default function CategoriesPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Categories</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Browse products by department and category
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <MarketplaceSidebar className="lg:col-span-1">
              <SidebarSection title="Price Range">
                {priceRanges.map((range) => (
                  <SidebarCheckbox
                    key={range.label}
                    label={range.label}
                    count={range.count}
                  />
                ))}
              </SidebarSection>
              <SidebarSection title="Rating">
                {ratings.map((rating) => (
                  <SidebarCheckbox
                    key={rating.label}
                    label={rating.label}
                    count={rating.count}
                  />
                ))}
              </SidebarSection>
              <SidebarSection title="Vendor">
                <SidebarCheckbox label="Verified Only" count={89} />
                <SidebarCheckbox label="Top Rated" count={45} />
              </SidebarSection>
            </MarketplaceSidebar>

            <div className="lg:col-span-3">
              <MarketplaceSection title="Departments" subtitle="All product categories">
                <MarketplaceGrid cols={4}>
                  {departments.map((dept) => (
                    <CategoryTile
                      key={dept.name}
                      name={dept.name}
                      count={dept.count}
                      icon={<dept.icon size={24} />}
                    />
                  ))}
                </MarketplaceGrid>
              </MarketplaceSection>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Business logic not implemented yet. Categories, filters, and counts are mock data.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
