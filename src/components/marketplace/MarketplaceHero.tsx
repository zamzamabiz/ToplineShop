import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function MarketplaceHero({
  title,
  subtitle,
  ctaLabel = "Shop Now",
  ctaHref = "/products",
  children,
}: {
  title: string;
  subtitle: string;
  ctaLabel?: string;
  ctaHref?: string;
  children?: React.ReactNode;
}) {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-background to-primary/5 border-b border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
        <div className="max-w-2xl">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{subtitle}</p>
          <div className="mt-8 flex items-center gap-x-4">
            <Link href={ctaHref}>
              <Button size="lg">
                {ctaLabel}
                <ArrowRight size={16} />
              </Button>
            </Link>
            {children}
          </div>
        </div>
      </div>
    </section>
  );
}
