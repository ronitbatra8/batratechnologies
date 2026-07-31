"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Package, Clock, Check, Truck, ChevronDown, ChevronUp, MessageCircle, X, RotateCcw, AlertTriangle } from "lucide-react";
import ConfirmModal from "@/components/ConfirmModal";

interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
}

interface Order {
  id: string;
  items: OrderItem[];
  totalAmount: number;
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  paymentMethod: string;
  paymentStatus?: string;
  paymentApprovedAt?: string;
  deliveredAt?: string;
  status: string;
  createdAt: string;
}

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock, description: "Your order has been received" },
  { key: "confirmed", label: "Confirmed", icon: Check, description: "Your order has been confirmed" },
  { key: "shipped", label: "Shipped", icon: Truck, description: "Your order is on the way" },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck, description: "Your order is out for delivery" },
  { key: "delivered", label: "Delivered", icon: Package, description: "Your order has been delivered" },
  { key: "return_requested", label: "Return Requested", icon: RotateCcw, description: "Return requested" },
  { key: "returned", label: "Returned", icon: RotateCcw, description: "Order has been returned" },
];

const statusColors: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  confirmed: "text-gold-400 bg-gold-500/10 border-gold-500/20",
  shipped: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  out_for_delivery: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  delivered: "text-green-400 bg-green-500/10 border-green-500/20",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
  return_requested: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  returned: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

const statusIcons: Record<string, any> = {
  pending: Clock,
  confirmed: Check,
  shipped: Truck,
  out_for_delivery: Truck,
  delivered: Package,
  return_requested: RotateCcw,
  returned: RotateCcw,
};

function MobileTimeline({ steps, doneMap, currentKey, goldKeys }: { steps: typeof statusSteps; doneMap: Record<string, boolean>; currentKey?: string; goldKeys?: string[] }) {
  return (
    <div className="sm:hidden w-full">
      {steps.map((step, i) => {
        const done = doneMap[step.key];
        const isCurrent = step.key === currentKey;
        const isGold = !goldKeys || goldKeys.includes(step.key);
        const circle = done ? (isGold ? "bg-gold-500 text-dark-950" : "bg-purple-500 text-white") : "bg-dark-800 text-dark-600 border border-dark-700";
        const line = done ? (isGold ? "bg-gold-500" : "bg-purple-500") : "bg-dark-700";
        const label = done ? (isGold ? "text-gold-400" : "text-purple-400") : "text-dark-600";
        return (
          <div key={step.key} className="flex gap-3">
            <div className="flex flex-col items-center shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${circle} ${isCurrent ? "ring-2 ring-gold-500/30 ring-offset-2 ring-offset-dark-900" : ""}`}>
                <step.icon size={14} />
              </div>
              {i < steps.length - 1 && <div className={`w-0.5 flex-1 my-0.5 min-h-4 ${line}`} />}
            </div>
            <div className="pt-1.5 pb-4 min-w-0">
              <p className={`text-sm font-medium ${label}`}>{step.label}</p>
              <p className="text-xs text-dark-500 mt-0.5">{step.description}</p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function OrderTrackingTimeline({ status }: { status: string }) {
  const isCancelled = status === "cancelled";
  const isReturnFlow = status === "return_requested" || status === "returned";
  const steps = isReturnFlow ? statusSteps : statusSteps.filter(s => s.key !== "return_requested" && s.key !== "returned");
  const currentIdx = steps.findIndex((s) => s.key === status);

  if (isCancelled) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
        <p className="text-red-400 font-semibold text-sm">This order has been cancelled</p>
      </div>
    );
  }

  if (isReturnFlow) {
    const deliverySteps = steps.slice(0, 5);
    const returnSteps = steps.slice(5);
    const doneMap: Record<string, boolean> = {};
    deliverySteps.forEach(s => { doneMap[s.key] = true; });
    if (status === "returned" || status === "return_requested") doneMap["return_requested"] = true;
    if (status === "returned") doneMap["returned"] = true;
    return (
      <div className="space-y-4">
        <MobileTimeline steps={steps} doneMap={doneMap} currentKey={status === "returned" ? "returned" : "return_requested"} goldKeys={["pending", "confirmed", "shipped", "out_for_delivery", "delivered"]} />
        <div className="hidden sm:flex items-center gap-1 w-full">
          {steps.slice(0, 5).map((step, i) => {
            const done = true;
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                <div className="flex items-center w-full">
                  {i > 0 && <div className="flex-1 h-0.5 bg-gold-500" />}
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gold-500 text-dark-950"><step.icon size={14} /></div>
                  {i < 4 && <div className="flex-1 h-0.5 bg-gold-500" />}
                </div>
                <p className="text-[10px] mt-1.5 font-medium text-center text-gold-400">{step.label}</p>
              </div>
            );
          })}
        </div>
        <div className="hidden sm:flex items-center gap-1 w-full">
          {steps.slice(5).map((step, i) => {
            const done = status === "returned" || (status === "return_requested" && i === 0);
            const isCurrent = (status === "return_requested" && i === 0) || (status === "returned" && i === 1);
            return (
              <div key={step.key} className="flex-1 flex flex-col items-center relative">
                <div className="flex items-center w-full">
                  <div className={`flex-1 h-0.5 ${i > 0 && done ? "bg-purple-500" : "bg-dark-700"}`} />
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-purple-500 text-white" : "bg-dark-800 text-dark-600 border border-dark-700"} ${isCurrent ? "ring-2 ring-purple-500/30 ring-offset-2 ring-offset-dark-900" : ""}`}>
                    <step.icon size={14} />
                  </div>
                  {i === 0 && <div className={`flex-1 h-0.5 ${done && status === "returned" ? "bg-purple-500" : "bg-dark-700"}`} />}
                </div>
                <p className={`text-[10px] mt-1.5 font-medium text-center ${done ? "text-purple-400" : "text-dark-600"}`}>{step.label}</p>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  const doneMap: Record<string, boolean> = {};
  steps.forEach((s, i) => { doneMap[s.key] = i <= currentIdx; });

  return (
    <div className="space-y-4">
      <MobileTimeline steps={steps} doneMap={doneMap} currentKey={steps[currentIdx]?.key} />
      <div className="hidden sm:flex items-center gap-1 w-full">
        {steps.map((step, i) => {
          const done = i <= currentIdx;
          const isCurrent = i === currentIdx;
          return (
            <div key={step.key} className="flex-1 flex flex-col items-center relative">
              <div className="flex items-center w-full">
                {i > 0 && <div className={`flex-1 h-0.5 ${done && i <= currentIdx ? "bg-gold-500" : "bg-dark-700"}`} />}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-gold-500 text-dark-950" : "bg-dark-800 text-dark-600 border border-dark-700"} ${isCurrent ? "ring-2 ring-gold-500/30 ring-offset-2 ring-offset-dark-900" : ""}`}>
                  <step.icon size={14} />
                </div>
                {i < steps.length - 1 && <div className={`flex-1 h-0.5 ${i < currentIdx ? "bg-gold-500" : "bg-dark-700"}`} />}
              </div>
              <p className={`text-[10px] mt-1.5 font-medium text-center ${done ? "text-gold-400" : "text-dark-600"}`}>{step.label}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }
    if (user) {
      apiFetch("/orders")
        .then((data) => setOrders(data))
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const [actionMsg, setActionMsg] = useState<{ id: string; text: string; error?: boolean } | null>(null);
  const [modalState, setModalState] = useState<{ type: "cancel" | "return"; orderId: string } | null>(null);
  const [returnReason, setReturnReason] = useState("");

  const handleCancelOrder = async (orderId: string) => {
    try {
      await apiFetch(`/orders/${orderId}/cancel`, { method: "POST", body: JSON.stringify({ reason: "Cancelled by customer" }), headers: { "Content-Type": "application/json" } });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "cancelled" } : o));
      setModalState(null);
      setActionMsg({ id: orderId, text: "Order cancelled successfully" });
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e: any) { setActionMsg({ id: orderId, text: e.message || "Failed to cancel", error: true }); setTimeout(() => setActionMsg(null), 3000); }
  };

  const handleReturnRequest = async (orderId: string) => {
    if (!returnReason.trim()) return;
    try {
      await apiFetch(`/orders/${orderId}/request-return`, { method: "POST", body: JSON.stringify({ reason: returnReason.trim() }), headers: { "Content-Type": "application/json" } });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: "return_requested" } : o));
      setModalState(null);
      setReturnReason("");
      setActionMsg({ id: orderId, text: "Return requested. Admin will review." });
      setTimeout(() => setActionMsg(null), 3000);
    } catch (e: any) { setActionMsg({ id: orderId, text: e.message || "Failed to request return", error: true }); setTimeout(() => setActionMsg(null), 3000); }
  };

  const canReturn = (order: Order) => {
    if (order.status !== "delivered") return false;
    const hoursSince = (Date.now() - new Date((order as any).deliveredAt || order.createdAt).getTime()) / (1000 * 60 * 60);
    return hoursSince <= 12;
  };

  const shareWhatsApp = (order: Order) => {
    const items = order.items.map((item: OrderItem) => `${item.name} x${item.quantity}`).join(", ");
    const paymentLabel = order.paymentStatus === "APPROVED" ? "Online (Paid)" : "Online (Pending)";
    const text = encodeURIComponent(
      `*Batra Technologies - Order Update*\n\n` +
      `Order #${order.id.slice(-8)}\n` +
      `Items: ${items}\n` +
      `Total: ${formatPrice(order.totalAmount)}\n` +
      `Status: ${order.status.charAt(0).toUpperCase() + order.status.slice(1)}\n` +
      `Payment: ${paymentLabel}\n\n` +
      `Track your order at: batratechnologies.com`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="w-10 h-10 border-2 border-dark-700 border-t-gold-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 page-transition">
      <div className="mb-12">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Account</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2">Order History</h1>
        <p className="text-dark-400 mt-2">{orders.length} order{orders.length !== 1 ? "s" : ""}</p>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-24">
          <Package size={48} className="text-dark-700 mx-auto mb-4" />
          <p className="text-dark-500 text-lg mb-4">No orders yet</p>
          <Link href="/products" className="bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-gold-500/20">
            Start Shopping
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => {
            const StatusIcon = statusIcons[order.status] || Clock;
            const expanded = expandedOrder === order.id;
            return (
              <div key={order.id} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl overflow-hidden hover:border-gold-500/20 transition-colors">
                <button onClick={() => setExpandedOrder(expanded ? null : order.id)} className="w-full flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 border-b border-dark-800/50 text-left hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-center gap-4 min-w-0">
                    <div>
                      <p className="text-xs text-dark-500">Order #{order.id.slice(-8)}</p>
                      <p className="text-xs text-dark-600">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColors[order.status] || statusColors.pending}`}>
                      <StatusIcon size={12} className="inline mr-1" />
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className="font-bold text-white shrink-0">{formatPrice(order.totalAmount)}</span>
                    {expanded ? <ChevronUp size={16} className="text-dark-400 shrink-0" /> : <ChevronDown size={16} className="text-dark-400 shrink-0" />}
                  </div>
                </button>

                {expanded && (
                  <div className="px-6 py-6 space-y-6 border-t border-dark-800/50">
                    {order.paymentStatus === "PENDING" && (
                      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
                        <p className="text-amber-400 font-semibold text-sm flex items-center gap-2">
                          <Clock size={16} /> Payment Pending
                        </p>
                        <p className="text-dark-400 text-xs mt-1.5 leading-relaxed">
                          Complete your online payment by{" "}
                          <span className="text-amber-400 font-medium">{new Date(new Date(order.createdAt).getTime() + 24 * 60 * 60 * 1000).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" })}</span>{" "}
                          to keep this order confirmed. If payment is not confirmed within 24 hours, the order will be cancelled automatically.
                        </p>
                      </div>
                    )}
                    {order.paymentStatus === "APPROVED" && (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                        <p className="text-green-400 font-semibold text-sm flex items-center gap-2">
                          <Check size={16} /> Payment Approved
                        </p>
                        <p className="text-dark-400 text-xs mt-1.5">
                          {order.paymentApprovedAt ? <>Your payment was approved on {new Date(order.paymentApprovedAt).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" })}. Your order is confirmed.</> : "Your payment has been approved and your order is confirmed."}
                        </p>
                      </div>
                    )}
                    <div className="bg-dark-800/30 rounded-xl p-5">
                      <p className="text-xs text-dark-500 uppercase tracking-wider mb-4 font-medium">Order Tracking</p>
                      <OrderTrackingTimeline status={order.status} />
                    </div>

                    <div className="space-y-3">
                      {order.items.map((item: OrderItem, idx: number) => (
                        <Link key={idx} href={`/products/${item.productId}`} className="flex items-center gap-4 p-2 -mx-2 rounded-xl hover:bg-dark-800/40 transition-colors group">
                          <img src={item.image} alt={item.name} className="w-12 h-12 rounded-lg object-cover group-hover:ring-2 ring-gold-500/30 transition-all" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-white group-hover:text-gold-400 transition-colors">{item.name}</p>
                            <p className="text-xs text-dark-500">Qty: {item.quantity}</p>
                          </div>
                          <span className="text-sm font-medium text-white">{formatPrice(item.price * item.quantity)}</span>
                        </Link>
                      ))}
                    </div>

                    <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-dark-500 min-w-0 flex-1">
                        <p>{order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
                        <p className="mt-1 text-gold-400">Payment: Online Payment{order.paymentStatus === "APPROVED" ? " · Approved" : order.paymentStatus === "PENDING" ? " · Pending" : order.paymentStatus ? ` · ${order.paymentStatus}` : ""}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                        {(order.status === "pending" || order.status === "confirmed") && (
                          <button onClick={() => setModalState({ type: "cancel", orderId: order.id })} className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                            <X size={16} /> Cancel Order
                          </button>
                        )}
                        {canReturn(order) && (
                          <button onClick={() => { setReturnReason(""); setModalState({ type: "return", orderId: order.id }); }} className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                            <RotateCcw size={16} /> Request Return
                          </button>
                        )}
                        <button onClick={() => shareWhatsApp(order)} className="flex items-center gap-2 bg-green-600/10 border border-green-600/20 text-green-400 hover:bg-green-600/20 px-4 py-2.5 rounded-xl text-sm font-medium transition-all">
                          <MessageCircle size={16} /> Share
                        </button>
                      </div>
                    </div>
                    {actionMsg && actionMsg.id === order.id && (
                      <div className={`mt-3 text-xs px-4 py-2.5 rounded-xl ${actionMsg.error ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-green-500/10 border border-green-500/20 text-green-400"}`}>
                        {actionMsg.text}
                      </div>
                    )}
                  </div>
                )}

                {!expanded && (
                  <div className="px-6 py-3 bg-dark-900/30 flex items-center justify-between text-xs text-dark-500">
                    <span>{order.shippingAddress}, {order.shippingCity}, {order.shippingState} - {order.shippingPincode}</span>
                    <span className="text-gold-400">{order.paymentStatus === "APPROVED" ? "Online Payment · Paid" : "Online Payment"}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <ConfirmModal
        open={modalState?.type === "cancel"}
        title="Cancel Order?"
        message="Are you sure you want to cancel this order? This action cannot be undone."
        confirmLabel="Yes, Cancel Order"
        variant="danger"
        onConfirm={() => modalState && handleCancelOrder(modalState.orderId)}
        onCancel={() => setModalState(null)}
      />
      <ConfirmModal
        open={modalState?.type === "return"}
        title="Request Return"
        message="Please tell us why you'd like to return this order. The admin will review your request."
        confirmLabel="Submit Return Request"
        variant="default"
        requireInput
        inputLabel="Reason for return"
        inputPlaceholder="e.g., Product is damaged, Wrong item received..."
        inputValue={returnReason}
        onInputChange={setReturnReason}
        onConfirm={() => modalState && handleReturnRequest(modalState.orderId)}
        onCancel={() => { setModalState(null); setReturnReason(""); }}
      />
    </div>
  );
}
