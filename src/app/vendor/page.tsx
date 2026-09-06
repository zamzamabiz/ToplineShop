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

const placeholderMetrics = [
  { label: "Total Products", value: "24", change: { value: "+3 this week", positive: true }, icon: <Package /> },
  { label: "Total Orders", value: "156", change: { value: "+12 this week", positive: true }, icon: <ShoppingCart /> },
  { label: "Revenue (MTD)", value: "₦0.00", icon: <DollarSign /> },
  { label: "Conversion Rate", value: "0%", icon: <TrendingUp /> },
];

const navCards = [
  { title: "Product Management", description: "Add, edit, and manage your product catalog", icon: Package, status: "PLANNED" },
  { title: "Order Management", description: "View and fulfill customer orders", icon: ShoppingCart, status: "PLANNED" },
  { title: "Analytics Dashboard", description: "Track sales, views, and performance", icon: BarChart3, status: "PLANNED" },
  { title: "Storefront Settings", description: "Customize your vendor storefront", icon: Store, status: "PLANNED" },
  { title: "Payouts & Billing", description: "Manage payments and subscription", icon: CreditCard, status: "PLANNED" },
  { title: "Account Settings", description: "Manage your vendor profile", icon: Settings, status: "PLANNED" },
];

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
              {placeholderMetrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </MarketplaceGrid>
          </MarketplaceSection>

          <MarketplaceSection title="Manage Your Store" subtitle="Quick access to vendor tools">
            <MarketplaceGrid cols={3}>
              {navCards.map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <card.icon size={24} className="text-primary mb-3" />
                  <h3 className="font-semibold text-sm">{card.title}</h3>
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
