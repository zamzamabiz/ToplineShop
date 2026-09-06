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

const platformMetrics = [
  { label: "Total Users", value: "0", icon: <Users /> },
  { label: "Total Vendors", value: "0", icon: <Store /> },
  { label: "Total Products", value: "0", icon: <Tag /> },
  { label: "Active Disputes", value: "0", icon: <ShieldAlert /> },
];

const adminSections = [
  { title: "User Management", description: "View, suspend, and manage platform users", icon: Users, status: "PLANNED" },
  { title: "Vendor Management", description: "Approve, review, and manage vendors", icon: Store, status: "PLANNED" },
  { title: "Category Management", description: "Create and organize product categories", icon: Tag, status: "PLANNED" },
  { title: "Content Moderation", description: "Review flagged content and listings", icon: ShieldAlert, status: "PLANNED" },
  { title: "Support Queue", description: "Manage customer and vendor support tickets", icon: Headphones, status: "PLANNED" },
  { title: "Platform Settings", description: "Configure platform-wide settings", icon: Settings, status: "PLANNED" },
  { title: "Analytics", description: "Platform-wide analytics and reporting", icon: BarChart3, status: "PLANNED" },
  { title: "Audit Logs", description: "System activity and change history", icon: FileText, status: "PLANNED" },
];

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
              {platformMetrics.map((metric) => (
                <MetricCard key={metric.label} {...metric} />
              ))}
            </MarketplaceGrid>
          </MarketplaceSection>

          <MarketplaceSection title="Administration" subtitle="Platform management tools">
            <MarketplaceGrid cols={4}>
              {adminSections.map((section) => (
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
