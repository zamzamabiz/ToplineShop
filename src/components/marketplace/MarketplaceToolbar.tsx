import { MarketplaceFilters } from "./MarketplaceFilters";

export function MarketplaceToolbar({
  resultCount,
  children,
}: {
  resultCount?: number;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        {resultCount !== undefined && (
          <span className="text-sm text-muted-foreground">
            {resultCount} results
          </span>
        )}
        {children}
      </div>
      <MarketplaceFilters />
    </div>
  );
}
