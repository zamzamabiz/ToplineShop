export function MarketplaceFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <select className="rounded-md border border-border bg-white dark:bg-zinc-900 px-3 py-1.5 text-sm">
        <option>Featured</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
        <option>Newest</option>
        <option>Best Rated</option>
      </select>
    </div>
  );
}
