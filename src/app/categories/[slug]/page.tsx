export const dynamic = "force-dynamic";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { MarketplaceGrid } from "@/components/marketplace/MarketplaceGrid";
import { MarketplaceSection } from "@/components/marketplace/MarketplaceSection";
import { ProductTile } from "@/components/marketplace/ProductTile";
import { Badge } from "@/components/ui/Badge";
import { marketplaceCategories, productListingItems } from "@/data/marketplaceMockData";

export function generateStaticParams() {
  return marketplaceCategories.map((cat) => ({ slug: cat.slug }));
}

export default async function CategoryDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const category = marketplaceCategories.find((c) => c.slug === slug);

  if (!category) {
    return (
      <AppShell>
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
              <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
              <span>/</span>
              <Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link>
              <span>/</span>
              <span className="text-foreground font-medium">Not Found</span>
            </nav>
            <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-12 text-center">
              <h1 className="text-xl font-bold mb-2">Category Not Found</h1>
              <p className="text-sm text-muted-foreground mb-4">
                The category you are looking for does not exist.
              </p>
              <Link
                href="/categories"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
              >
                Browse all categories
              </Link>
            </div>
          </div>
        </div>
      </AppShell>
    );
  }

  const categoryProducts = productListingItems.filter(
    (p) => p.categoryId === category.id
  );

  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <nav className="flex items-center gap-1.5 text-sm text-muted-foreground mb-6">
            <Link href="/" className="hover:text-foreground transition-colors">Home</Link>
            <span>/</span>
            <Link href="/categories" className="hover:text-foreground transition-colors">Categories</Link>
            <span>/</span>
            <span className="text-foreground font-medium">{category.name}</span>
          </nav>

          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold">{category.name}</h1>
              <Badge>{category.count} items</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Browse {category.name.toLowerCase()} products from verified vendors
            </p>
          </div>

          {categoryProducts.length > 0 ? (
            <MarketplaceSection title={`Featured in ${category.name}`} subtitle={`Showing ${categoryProducts.length} mock products`}>
              <MarketplaceGrid cols={3}>
                {categoryProducts.map((product) => (
                  <ProductTile key={product.id} name={product.name} price={product.price} originalPrice={product.originalPrice} rating={product.rating} reviewCount={product.reviewCount} vendor={product.vendor} badge={product.badge} href={`/products/${product.id}`} />
                ))}
              </MarketplaceGrid>
            </MarketplaceSection>
          ) : (
            <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-12 text-center">
              <p className="text-muted-foreground">
                No products in this category yet. More mock products coming soon.
              </p>
            </div>
          )}

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Category browsing is frontend mock only. Product counts and availability are not real.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
