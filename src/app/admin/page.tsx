export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminPage() {
  return (
    <AppShell>
      <EmptyState
        title="Admin Panel"
        description="This is a frontend placeholder — business logic not implemented yet."
      />
    </AppShell>
  );
}
