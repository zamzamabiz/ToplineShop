export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function B2BPage() {
  return (
    <AppShell>
      <EmptyState
        title="B2B Wholesale"
        description="This is a frontend placeholder — business logic not implemented yet."
      />
    </AppShell>
  );
}
