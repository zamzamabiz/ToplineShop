export const dynamic = "force-dynamic";

import Link from "next/link";
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
import {
  marketplaceCategories,
  categoryFilterPriceRanges,
  categoryFilterRatings,
  categoryFilterVendors,
} from "@/data/marketplaceMockData";

const iconMap: Record<string, React.ReactNode> = {
  Laptop: <Laptop size={24} />,
  Shirt: <Shirt size={24} />,
  Home: <Home size={24} />,
  Dumbbell: <Dumbbell size={24} />,
  Sparkles: <Sparkles size={24} />,
  Gamepad2: <Gamepad2 size={24} />,
  BookOpen: <BookOpen size={24} />,
  Baby: <Baby size={24} />,
};

export default function CategoriesPage() {
  return (
    <AppShell>
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-1.5 text-sm mb-6" style={{ color: "var(--text-muted)" }}>
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <span className="text-foreground font-medium">Categories</span>
          </nav>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">Categories</h1>
              <Badge>{marketplaceCategories.length} departments</Badge>
            </div>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Browse products by department and category
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <MarketplaceSidebar className="lg:col-span-1">
              <SidebarSection title="Price Range">
                {categoryFilterPriceRanges.map((range) => (
                  <SidebarCheckbox
                    key={range.label}
                    label={range.label}
                    count={range.count}
                  />
                ))}
              </SidebarSection>
              <SidebarSection title="Rating">
                {categoryFilterRatings.map((rating) => (
                  <SidebarCheckbox
                    key={rating.label}
                    label={rating.label}
                    count={rating.count}
                  />
                ))}
              </SidebarSection>
              <SidebarSection title="Vendor">
                {categoryFilterVendors.map((v) => (
                  <SidebarCheckbox
                    key={v.label}
                    label={v.label}
                    count={v.count}
                  />
                ))}
              </SidebarSection>
              <div className="pt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  Filters are frontend placeholders. Actual filtering not yet implemented.
                </p>
              </div>
            </MarketplaceSidebar>

            <div className="lg:col-span-3">
              <MarketplaceSection title="Popular Departments" subtitle={`${marketplaceCategories.length} categories to explore`}>
                <MarketplaceGrid cols={4}>
                  {marketplaceCategories.map((dept) => (
                    <CategoryTile
                      key={dept.id}
                      name={dept.name}
                      count={dept.count}
                      icon={iconMap[dept.icon || "Tag"]}
                      slug={dept.slug}
                    />
                  ))}
                </MarketplaceGrid>
              </MarketplaceSection>
            </div>
          </div>

          <div
            className="mt-8 rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span style={{ color: "var(--text-muted)" }}>
                Business logic not implemented yet. Categories, filters, and counts are mock data.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
