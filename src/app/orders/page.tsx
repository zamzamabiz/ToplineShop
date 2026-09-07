export const dynamic = "force-dynamic";

import { AppShell } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";
import { Package, Clock, CheckCircle, XCircle, HelpCircle } from "lucide-react";
import { orderPreviewItems, orderTimelineSteps } from "@/data/marketplaceMockData";

export default function OrdersPage() {
  return (
    <AppShell>
      <div className="min-h-screen" style={{ backgroundColor: "var(--app-canvas)" }}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">Order History</h1>
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              View your past orders and track current shipments
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-4">
              {orderPreviewItems.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border p-4 sm:p-6"
                  style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-medium">{order.id}</span>
                        {order.status === "Delivered" && <CheckCircle size={14} style={{ color: "var(--state-success)" }} />}
                        {order.status === "Shipped" && <Package size={14} className="text-blue-600" />}
                        {order.status === "Processing" && <Clock size={14} className="text-amber-600" />}
                        <span className={`text-xs font-medium ${order.statusColor}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
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
                <div className="rounded-xl border p-12 text-center" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
                  <Package size={40} className="mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
                  <p className="font-medium">No orders yet</p>
                  <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                    Your order history will appear here
                  </p>
                </div>
              )}
            </div>

            <div className="lg:col-span-1">
              <div className="rounded-xl border p-6 sticky top-24" style={{ borderColor: "var(--border-default)", backgroundColor: "var(--surface-primary)" }}>
                <h2 className="font-semibold text-sm mb-4">Order Status Timeline</h2>
                <div className="space-y-3">
                  {orderTimelineSteps.map((step) => (
                    <div key={step.label} className="flex items-center gap-3">
                      <div
                        className={`h-2 w-2 rounded-full flex-shrink-0 ${
                          step.done ? "" : ""
                        }`}
                        style={{
                          backgroundColor: step.done ? "var(--state-success)" : "var(--surface-muted)",
                        }}
                      />
                      <span
                        className="text-sm"
                        style={{
                          color: step.done ? "var(--text-primary)" : "var(--text-muted)",
                        }}
                      >
                        {step.label}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t" style={{ borderColor: "var(--border-default)" }}>
                  <h3 className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--text-muted)" }}>
                    Need Help?
                  </h3>
                  <div className="space-y-2">
                    <button disabled aria-disabled className="w-full flex items-center gap-2 rounded-lg border p-3 text-sm cursor-not-allowed opacity-50" style={{ borderColor: "var(--border-default)" }}>
                      <HelpCircle size={16} style={{ color: "var(--text-muted)" }} />
                      <span>Contact Support</span>
                    </button>
                    <button disabled aria-disabled className="w-full flex items-center gap-2 rounded-lg border p-3 text-sm cursor-not-allowed opacity-50" style={{ borderColor: "var(--border-default)" }}>
                      <XCircle size={16} style={{ color: "var(--text-muted)" }} />
                      <span>Cancel Order</span>
                    </button>
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
                Order data is mock/placeholder. Real order tracking, support, and cancellation are not implemented.
              </span>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
