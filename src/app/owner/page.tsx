export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { MetricCard } from "@/components/ui/MetricCard";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import {
  DollarSign,
  TrendingUp,
  Users,
  Store,
  Activity,
  Shield,
  BarChart3,
  Settings,
  FileText,
} from "lucide-react";
import { ownerPreviewMetrics, ownerNavItems } from "@/data/marketplaceMockData";

const iconMap: Record<string, React.ReactNode> = {
  DollarSign: <DollarSign />,
  TrendingUp: <TrendingUp />,
  Users: <Users />,
  Store: <Store />,
  Activity: <Activity />,
  Shield: <Shield />,
  BarChart3: <BarChart3 />,
  Settings: <Settings />,
  FileText: <FileText />,
};

export default function OwnerPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Owner Control Center</h1>
              <Badge>Executive Dashboard</Badge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Platform oversight, revenue tracking, and strategic control
            </p>
          </div>

          <MarketplaceSection title="Executive Metrics" subtitle="Platform performance overview" className="pt-0">
            <MarketplaceGrid cols={4}>
              {ownerPreviewMetrics.map((metric) => (
                <MetricCard key={metric.label} label={metric.label} value={metric.value} change={metric.change} icon={metric.icon ? iconMap[metric.icon] : undefined} />
              ))}
            </MarketplaceGrid>
          </MarketplaceSection>

          <MarketplaceSection title="Control Center" subtitle="Platform management and oversight">
            <MarketplaceGrid cols={3}>
              {ownerNavItems.map((section) => (
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

          <MarketplaceSection title="Platform Status" subtitle="Current development phase">
            <Card title="Development Progress">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Current Phase</span>
                  <span className="font-medium">Phase 3 — B2B / Wholesale</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">50%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Backend</span>
                  <Badge>NOT_STARTED</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Database</span>
                  <Badge>NOT_STARTED</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Auth</span>
                  <Badge>NOT_STARTED</Badge>
                </div>
              </div>
            </Card>
          </MarketplaceSection>

          <div className="rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Revenue, commission, and financial data are not real. This is a frontend placeholder for the owner dashboard layout.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
