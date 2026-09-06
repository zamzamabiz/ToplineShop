import { Building2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function B2BCallout({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10 p-6 sm:p-8 ${className || ""}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 flex-shrink-0">
          <Building2 size={24} className="text-primary" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-lg">B2B Wholesale</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Bulk pricing, wholesale orders, and supplier connections for
            businesses.
          </p>
        </div>
        <Button variant="outline" className="flex-shrink-0">
          Learn More
          <ArrowRight size={14} />
        </Button>
      </div>
    </div>
  );
}
