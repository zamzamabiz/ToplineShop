export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function OwnerPage() {
  return (
    <AppShell>
      <EmptyState
        title="Owner Control Center"
        description="This is a frontend placeholder — business logic not implemented yet."
      />
    </AppShell>
  );
}
