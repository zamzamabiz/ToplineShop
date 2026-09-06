export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { MetricCard } from "@/components/ui/MetricCard";
import { EmptyState } from "@/components/ui/EmptyState";
import { Store } from "lucide-react";

export default function AppPage() {
  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome to ToplineShop — your marketplace control center.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <MetricCard label="Total Products" value="—" />
          <MetricCard label="Active Vendors" value="—" />
          <MetricCard label="Orders" value="—" />
          <MetricCard label="Revenue" value="—" />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricCard label="Customers" value="—" />
          <MetricCard label="Growth" value="—" />
        </div>

        <EmptyState
          icon={<Store size={48} />}
          title="Marketplace Coming Soon"
          description="This is a frontend placeholder — business logic not implemented yet. The marketplace dashboard will show real data once the backend is connected in Phase 7-9."
        />
      </div>
    </AppShell>
  );
}
