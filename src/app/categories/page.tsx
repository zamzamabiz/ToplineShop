export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { EmptyState } from "@/components/ui/EmptyState";

export default function CategoriesPage() {
  return (
    <AppShell>
      <EmptyState
        title="Categories"
        description="This is a frontend placeholder — business logic not implemented yet."
      />
    </AppShell>
  );
}
