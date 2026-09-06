export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import {
  Users,
  Store,
  Tag,
  ShieldAlert,
  Headphones,
  Settings,
  BarChart3,
  FileText,
} from "lucide-react";
import { adminPreviewMetrics, adminNavItems } from "@/data/marketplaceMockData";

const iconMap: Record<string, React.ReactNode> = {
  Users: <Users />,
  Store: <Store />,
  Tag: <Tag />,
  ShieldAlert: <ShieldAlert />,
  Headphones: <Headphones />,
  Settings: <Settings />,
  BarChart3: <BarChart3 />,
  FileText: <FileText />,
};

export default function AdminPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <Badge>Platform Operations</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage users, vendors, categories, and platform settings
            </p>
          </div>

          <MarketplaceSection title="Platform Overview" subtitle="Key metrics at a glance" className="pt-0">
            <MarketplaceGrid cols={4}>
              {adminPreviewMetrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} icon={metric.icon ? iconMap[metric.icon] : undefined} />
              ))}
            </MarketplaceGrid>
          </MarketplaceSection>

          <MarketplaceSection title="Administration" subtitle="Platform management tools">
            <MarketplaceGrid cols={4}>
              {adminNavItems.map((section) => (
                <div
                  key={section.title}
                  className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  {iconMap[section.icon]}
                  <h3 className="font-semibold text-sm mt-3">{section.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {section.description}
                  </p>
                  <div className="mt-3">
                    <Badge>{section.status}</Badge>
                  </div>
                </div>
              ))}
            </MarketplaceGrid>
          </MarketplaceSection>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Admin logic not implemented yet. User management, vendor approval, moderation, and analytics are placeholder concepts.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
