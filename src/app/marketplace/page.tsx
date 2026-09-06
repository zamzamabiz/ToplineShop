export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function MarketplacePage() {
  return (
    <AppShell>
      <EmptyState
        title="Public Marketplace"
        description="This is a frontend placeholder — business logic not implemented yet."
      />
    </AppShell>
  );
}
