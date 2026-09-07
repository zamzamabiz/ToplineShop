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
    <AppShell dashboard="admin">
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">Admin Panel</h1>
              <Badge>Platform Operations</Badge>
            </div>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
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

          <div
            className="rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span style={{ color: "var(--text-muted)" }}>
                Admin logic not implemented yet. User management, vendor approval, moderation, and analytics are placeholder concepts.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
