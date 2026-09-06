export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  DollarSign,
  Store,
  BarChart3,
  CreditCard,
  Settings,
} from "lucide-react";
import { vendorPreviewMetrics, vendorNavItems } from "@/data/marketplaceMockData";

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package />,
  ShoppingCart: <ShoppingCart />,
  TrendingUp: <TrendingUp />,
  DollarSign: <DollarSign />,
  Store: <Store />,
  BarChart3: <BarChart3 />,
  CreditCard: <CreditCard />,
  Settings: <Settings />,
};

export default function VendorPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Vendor Dashboard</h1>
              <Badge>SaaS Shell</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your storefront, products, and orders
            </p>
          </div>

          <MarketplaceSection title="Overview" subtitle="Your store at a glance" className="pt-0">
            <MarketplaceGrid cols={4}>
              {vendorPreviewMetrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} change={metric.change} icon={metric.icon ? iconMap[metric.icon] : undefined} />
              ))}
            </MarketplaceGrid>
          </MarketplaceSection>

          <MarketplaceSection title="Manage Your Store" subtitle="Quick access to vendor tools">
            <MarketplaceGrid cols={3}>
              {vendorNavItems.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  {iconMap[card.icon]}
                  <h3 className="font-semibold text-sm mt-3">{card.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {card.description}
                  </p>
                  <div className="mt-3">
                    <Badge>{card.status}</Badge>
                  </div>
                </div>
              ))}
            </MarketplaceGrid>
          </MarketplaceSection>

          <MarketplaceSection title="Subscription Plan" subtitle="Your current vendor plan">
            <Card title="Current Plan">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Free Tier</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    Basic vendor features. Upgrade for advanced analytics and priority support.
                  </div>
                </div>
                <Badge>PLANNED</Badge>
              </div>
            </Card>
          </MarketplaceSection>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Vendor SaaS logic not implemented yet. Product management, orders, analytics, and billing are placeholder concepts.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
