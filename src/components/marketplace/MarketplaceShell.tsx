import { cn } from "@/lib/utils";

export function MarketplaceShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen", className)} style={{ backgroundColor: "var(--app-canvas)" }}>
      {children}
    </div>
  );
}
