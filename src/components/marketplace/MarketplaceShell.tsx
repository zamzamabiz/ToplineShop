import { cn } from "@/lib/utils";

export function MarketplaceShell({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("min-h-screen bg-zinc-50 dark:bg-zinc-950", className)}>
      {children}
    </div>
  );
}
