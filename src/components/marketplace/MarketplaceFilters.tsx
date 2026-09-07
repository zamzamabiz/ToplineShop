export function MarketplaceFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Sort by:</span>
      <select
        className="rounded-md border px-3 py-1.5 text-sm"
        style={{
          backgroundColor: "var(--input-background)",
          borderColor: "var(--input-border)",
          color: "var(--text-primary)",
        }}
      >
        <option>Featured</option>
        <option>Price: Low to High</option>
        <option>Price: High to Low</option>
        <option>Newest</option>
        <option>Best Rated</option>
      </select>
    </div>
  );
}
