export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Package, Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { orderPreviewItems, orderTimelineSteps } from "@/data/marketplaceMockData";

export default function OrdersPage() {
  return (
    <AppShell>
      <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Order History</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              View your past orders and track current shipments
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {orderPreviewItems.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-4 sm:p-6"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{order.id}</span>
                        {order.status === "Delivered" && <CheckCircle size={14} className="text-green-600" />}
                        {order.status === "Shipped" && <Package size={14} className="text-blue-600" />}
                        {order.status === "Processing" && <Clock size={14} className="text-amber-600" />}
                        <span className={`text-xs font-medium ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Placed on {order.date} — {order.items} item(s)
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-sm">{order.total}</div>
                      <button disabled aria-disabled className="text-xs text-primary mt-1 cursor-not-allowed opacity-50">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {orderPreviewItems.length === 0 && (
                <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-12 text-center">
                  <Package size={40} className="mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Your order history will appear here
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border border-border bg-white dark:bg-zinc-900 p-6 sticky top-24">
                <h2 className="font-semibold text-sm mb-4">Order Status Timeline</h2>
                <div className="space-y-3">
                  {orderTimelineSteps.map((step) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          step.done ? "bg-green-500" : "bg-zinc-300 dark:bg-zinc-600"
                        }`}
                      />
                      <span
                        className={`text-sm ${
                          step.done ? "text-foreground" : "text-muted-foreground"
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t border-border">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                    Need Help?
                  </h3>
                  <div className="space-y-2">
                    <button disabled aria-disabled className="w-full flex items-center gap-2 rounded-lg border border-border p-3 text-sm cursor-not-allowed opacity-50">
                      <HelpCircle size={16} className="text-muted-foreground" />
                      <span>Contact Support</span>
                    </button>
                    <button disabled aria-disabled className="w-full flex items-center gap-2 rounded-lg border border-border p-3 text-sm cursor-not-allowed opacity-50">
                      <XCircle size={16} className="text-muted-foreground" />
                      <span>Cancel Order</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30 px-4 py-3">
            <div className="flex items-center gap-2 text-sm">
              <Badge>Frontend Placeholder</Badge>
              <span className="text-amber-700 dark:text-amber-400">
                Order data is mock/placeholder. Real order tracking, support, and cancellation are not implemented.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
