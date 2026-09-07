export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Trash2, Minus, Plus, Tag, ShieldCheck, Truck } from "lucide-react";
import { cartPreviewItems } from "@/data/marketplaceMockData";

export default function CartPage() {
  return (
    <AppShell>
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Shopping Cart</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              Review items before checkout
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {cartPreviewItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border p-4 sm:p-6"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                >
                  <div className="flex gap-4">
                    <div
                      className="h-20 w-20 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: "var(--surface-muted)" }}
                    >
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>No image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            Vendor: {item.vendor}
                          </p>
                        </div>
                        <button disabled aria-disabled className="cursor-not-allowed opacity-50" style={{ color: "var(--text-muted)" }}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button disabled aria-disabled className="h-7 w-7 rounded-md border flex items-center justify-center cursor-not-allowed opacity-50" style={{ borderColor: "var(--border-default)" }}>
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button disabled aria-disabled className="h-7 w-7 rounded-md border flex items-center justify-center cursor-not-allowed opacity-50" style={{ borderColor: "var(--border-default)" }}>
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-semibold text-sm">{item.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {cartPreviewItems.length === 0 && (
                <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
                  <p style={{ color: "var(--text-muted)" }}>Your cart is empty</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border p-6 sticky top-24" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
                <h2 className="font-semibold text-sm mb-4">Order Summary</h2>

                <div className="mb-4">
                  <div className="flex items-center gap-2 rounded-lg border p-3" style={{ borderColor: "var(--border-default)" }}>
                    <Tag size={16} style={{ color: "var(--text-muted)" }} />
                    <input
                      type="text"
                      placeholder="Discount code"
                      className="flex-1 text-sm bg-transparent outline-none"
                      disabled
                    />
                    <Button variant="outline" size="sm" disabled>
                      Apply
                    </Button>
                  </div>
                  <p className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                    Discounts not yet implemented
                  </p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                    <span>₦99,997</span>
                  </div>
                  <div className="flex justify-between">
                    <span style={{ color: "var(--text-muted)" }}>Shipping</span>
                    <span style={{ color: "var(--text-muted)" }}>Calculated at checkout</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between font-semibold" style={{ borderColor: "var(--border-default)" }}>
                    <span>Total</span>
                    <span>₦99,997</span>
                  </div>
                </div>

                <Button className="w-full" disabled>
                  Proceed to Checkout
                </Button>
                <p className="text-xs mt-2 text-center" style={{ color: "var(--text-muted)" }}>
                  Checkout not yet implemented
                </p>

                <div className="mt-4 pt-4 border-t space-y-2" style={{ borderColor: "var(--border-default)" }}>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <ShieldCheck size={14} style={{ color: "var(--state-success)" }} />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-muted)" }}>
                    <Truck size={14} style={{ color: "var(--state-success)" }} />
                    <span>Free shipping on orders over ₦50,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="mt-8 rounded-lg border px-4 py-3"
            style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-muted)" }}
          >
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span style={{ color: "var(--text-muted)" }}>
                Cart state, checkout, payment, and quantity controls are not implemented. All data is mock/placeholder.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
