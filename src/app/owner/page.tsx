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

const executiveMetrics = [
  { label: "GMV (MTD)", value: "₦0.00", icon: <DollarSign /> },
  { label: "Revenue (MTD)", value: "₦0.00", change: { value: "Commission: 0%", positive: true }, icon: <TrendingUp /> },
  { label: "Active Users", value: "0", icon: <Users /> },
  { label: "Active Vendors", value: "0", icon: <Store /> },
];

const controlSections = [
  { title: "Revenue Dashboard", description: "Track GMV, revenue, and commission earnings", icon: BarChart3, status: "PLANNED" },
  { title: "Platform Health", description: "Monitor system status and performance", icon: Activity, status: "PLANNED" },
  { title: "User & Vendor Oversight", description: "Manage platform participants", icon: Users, status: "PLANNED" },
  { title: "Risk & Compliance", description: "Fraud detection and compliance monitoring", icon: Shield, status: "PLANNED" },
  { title: "Phase & Project Status", description: "Track development progress and roadmap", icon: FileText, status: "ACTIVE" },
  { title: "Platform Settings", description: "Configure platform-wide settings", icon: Settings, status: "PLANNED" },
];

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
              {executiveMetrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </MarketplaceGrid>
          </MarketplaceSection>

          <MarketplaceSection title="Control Center" subtitle="Platform management and oversight">
            <MarketplaceGrid cols={3}>
              {controlSections.map((section) => (
                <div
                  key={section.title}
                  className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6 hover:border-primary/50 transition-colors cursor-pointer"
                >
                  <section.icon size={24} className="text-primary mb-3" />
                  <h3 className="font-semibold text-sm">{section.title}</h3>
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
                  <span className="font-medium">Phase 1 — UX Architecture</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Overall Progress</span>
                  <span className="font-medium">18%</span>
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
