export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Trash2, Minus, Plus, Tag, ShieldCheck, Truck } from "lucide-react";

const placeholderItems = [
  { id: 1, name: "Wireless Bluetooth Headphones", vendor: "TechStore", price: "₦49,999", quantity: 1, image: null },
  { id: 2, name: "Organic Cotton T-Shirt", vendor: "FashionHub", price: "₦24,999", quantity: 2, image: null },
];

export default function CartPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Shopping Cart</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Review items before checkout
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {placeholderItems.map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-4 sm:p-6"
                >
                  <div className="flex gap-4">
                    <div className="h-20 w-20 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center flex-shrink-0">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="h-full w-full object-cover rounded-lg" />
                      ) : (
                        <span className="text-xs text-muted-foreground">No image</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium text-sm">{item.name}</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Vendor: {item.vendor}
                          </p>
                        </div>
                        <button className="text-muted-foreground hover:text-destructive transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <button className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted">
                            <Minus size={12} />
                          </button>
                          <span className="text-sm font-medium w-8 text-center">
                            {item.quantity}
                          </span>
                          <button className="h-7 w-7 rounded-md border border-border flex items-center justify-center hover:bg-muted">
                            <Plus size={12} />
                          </button>
                        </div>
                        <span className="font-semibold text-sm">{item.price}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {placeholderItems.length === 0 && (
                <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-12 text-center">
                  <p className="text-muted-foreground">Your cart is empty</p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6 sticky top-24">
                <h2 className="font-semibold text-sm mb-4">Order Summary</h2>

                <div className="mb-4">
                  <div className="flex items-center gap-2 rounded-lg border border-border p-3">
                    <Tag size={16} className="text-muted-foreground" />
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Discounts not yet implemented
                  </p>
                </div>

                <div className="space-y-2 text-sm mb-4">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>₦99,997</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Shipping</span>
                    <span className="text-muted-foreground">Calculated at checkout</span>
                  </div>
                  <div className="border-t border-border pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>₦99,997</span>
                  </div>
                </div>

                <Button className="w-full" disabled>
                  Proceed to Checkout
                </Button>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Checkout not yet implemented
                </p>

                <div className="mt-4 pt-4 border-t border-border space-y-2">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <ShieldCheck size={14} className="text-green-600" />
                    <span>Secure checkout</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Truck size={14} className="text-green-600" />
                    <span>Free shipping on orders over ₦50,000</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Cart state, checkout, and payment are not implemented. All data is mock/placeholder.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
