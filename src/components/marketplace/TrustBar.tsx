import { Shield, Truck, RotateCcw, Headphones } from "lucide-react";

const benefits = [
  { icon: Shield, label: "Secure Shopping", description: "Buyer protection" },
  { icon: Truck, label: "Fast Delivery", description: "Nationwide shipping" },
  { icon: RotateCcw, label: "Easy Returns", description: "30-day policy" },
  { icon: Headphones, label: "Support", description: "24/7 help center" },
];

export function TrustBar({ className }: { className?: string }) {
  return (
    <div
      className={`border-y ${className || ""}`}
      style={{
        backgroundColor: "var(--surface-primary)",
        borderColor: "var(--border-default)",
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((benefit) => (
            <div key={benefit.label} className="flex items-center gap-3">
              <benefit.icon size={20} className="flex-shrink-0" style={{ color: "var(--brand-primary)" }} />
              <div>
                <div className="text-sm font-medium">{benefit.label}</div>
                <div className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {benefit.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
