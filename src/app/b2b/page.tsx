export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceHero } from "@/components/marketplace/MarketplaceHero";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  Building2,
  Package,
  Truck,
  FileText,
  Users,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";
import { b2bBenefits, b2bSupplierCategories } from "@/data/marketplaceMockData";

const iconMap: Record<string, React.ReactNode> = {
  Package: <Package size={24} />,
  Truck: <Truck size={24} />,
  FileText: <FileText size={24} />,
  Users: <Users size={24} />,
  ShieldCheck: <ShieldCheck size={24} />,
  Building2: <Building2 size={24} />,
};

export default function B2BPage() {
  return (
    <AppShell>
      <div className="bg-zinc-50 dark:bg-zinc-950">
        <MarketplaceHero
          title="B2B Wholesale Marketplace"
          subtitle="Connect with verified suppliers for bulk orders and wholesale pricing across Nigeria."
          ctaLabel="Browse Suppliers"
          ctaHref="#suppliers"
        >
          <Button variant="outline" size="lg">
            Submit RFQ
            <FileText size={16} />
          </Button>
        </MarketplaceHero>

        <MarketplaceSection
          title="Why ToplineShop B2B?"
          subtitle="The wholesale marketplace built for Nigerian businesses"
        >
          <MarketplaceGrid cols={3}>
            {b2bBenefits.map((benefit) => (
              <div
                key={benefit.id}
                className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6"
              >
                {iconMap[benefit.icon]}
                <h3 className="font-semibold text-sm mt-3">{benefit.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </MarketplaceGrid>
        </MarketplaceSection>

        <div id="suppliers">
          <MarketplaceSection
            title="Supplier Categories"
            subtitle="Find suppliers by product category"
            action={
              <Button variant="ghost" size="sm">
                View All <ArrowRight size={14} />
              </Button>
            }
          >
          <MarketplaceGrid cols={3}>
            {b2bSupplierCategories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between rounded-xl border border-border bg-white dark:bg-zinc-900 p-4 hover:border-primary/50 transition-colors cursor-pointer"
              >
                <span className="font-medium text-sm">{cat.name}</span>
                <span className="text-xs text-muted-foreground">
                  {cat.count} suppliers
                </span>
              </div>
            ))}
          </MarketplaceGrid>
        </MarketplaceSection>
        </div>

        <MarketplaceSection
          title="How It Works"
          subtitle="Simple steps to start wholesale ordering"
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { step: "1", title: "Create Business Account", desc: "Register and verify your business credentials" },
              { step: "2", title: "Browse & Compare", desc: "Find suppliers, compare pricing, and request quotes" },
              { step: "3", title: "Order & Receive", desc: "Place bulk orders with secure payment and tracking" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto h-10 w-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-sm">{item.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </MarketplaceSection>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-10">
          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                B2B logic not implemented yet. RFQ, supplier verification, and bulk ordering are placeholder concepts.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
