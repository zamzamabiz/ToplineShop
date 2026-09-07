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
    <AppShell dashboard="owner">
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Owner Control Center</h1>
              <Badge>Executive Dashboard</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
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
                  className="rounded-xl border p-6 hover:border-primary/50 transition-colors cursor-pointer"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                >
                  {iconMap[section.icon]}
                  <h3 className="font-semibold text-sm mt-3">{section.title}</h3>
                  <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
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
                  <span style={{ color: "var(--text-muted)" }}>Current Phase</span>
                  <span className="font-medium">Phase 3 — B2B / Wholesale</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Overall Progress</span>
                  <span className="font-medium">50%</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Backend</span>
                  <Badge>NOT_STARTED</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Database</span>
                  <Badge>NOT_STARTED</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color: "var(--text-muted)" }}>Auth</span>
                  <Badge>NOT_STARTED</Badge>
                </div>
              </div>
            </Card>
          </MarketplaceSection>

          <div
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span style={{ color: "var(--text-muted)" }}>
                Revenue, commission, and financial data are not real. This is a frontend placeholder for the owner dashboard layout.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
