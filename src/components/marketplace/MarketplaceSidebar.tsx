import { cn } from "@/lib/utils";

export function MarketplaceSidebar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cn("rounded-xl border p-6", className)}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
        color: "var(--text-primary)",
      }}
    >
      {children}
    </aside>
  );
}

export function SidebarSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-semibold mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

export function SidebarCheckbox({
  label,
  count,
  checked = false,
}: {
  label: string;
  count?: number;
  checked?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm cursor-pointer">
      <input
        type="checkbox"
        defaultChecked={checked}
        className="rounded border-border"
      />
      <span>{label}</span>
      {count !== undefined && (
        <span className="ml-auto text-xs text-muted-foreground">({count})</span>
      )}
    </label>
  );
}
