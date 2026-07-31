"use client";
import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Search, Package, Clock, Check, Truck, X, MapPin, Phone, CreditCard, RotateCcw } from "lucide-react";
import Link from "next/link";

const statusSteps = [
  { key: "pending", label: "Order Placed", icon: Clock },
  { key: "confirmed", label: "Confirmed", icon: Check },
  { key: "shipped", label: "Shipped", icon: Truck },
  { key: "out_for_delivery", label: "Out for Delivery", icon: Truck },
  { key: "delivered", label: "Delivered", icon: Package },
  { key: "return_requested", label: "Return Requested", icon: RotateCcw },
  { key: "returned", label: "Returned", icon: RotateCcw },
];

const statusColorMap: Record<string, string> = {
  pending: "text-yellow-400", confirmed: "text-blue-400", shipped: "text-purple-400",
  out_for_delivery: "text-orange-400", delivered: "text-green-400", cancelled: "text-red-400",
  return_requested: "text-yellow-400", returned: "text-purple-400",
};

const statusBadgeMap: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  confirmed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  out_for_delivery: "text-orange-400 bg-orange-500/10 border-orange-500/20",
  delivered: "text-green-400 bg-green-500/10 border-green-500/20",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
  return_requested: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  returned: "text-purple-400 bg-purple-500/10 border-purple-500/20",
};

export default function TrackingPage() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderId.trim()) return;
    setLoading(true); setError(""); setOrder(null);
    try {
      const data = await apiFetch(`/orders/track/${orderId.trim()}`);
      if (data.error) { setError(data.error); return; }
      setOrder(data);
    } catch { setError("Order not found. Please check the order ID."); }
    setLoading(false);
  };

  const currentStatus = order?.status || "";
  const isCancelled = currentStatus === "cancelled";
  const isReturned = currentStatus === "returned" || currentStatus === "return_requested";
  const steps = isReturned ? statusSteps : statusSteps.filter(s => s.key !== "return_requested" && s.key !== "returned");
  const currentIdx = steps.findIndex((s) => s.key === currentStatus);
  const iconColor = statusColorMap[currentStatus] || "text-dark-400";

  return (
    <div className="max-w-3xl mx-auto px-6 pt-32 pb-24 page-transition">
      <div className="text-center mb-12">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Track Your Order</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2">Order Tracking</h1>
        <p className="text-dark-400 mt-2">Enter your order ID to check the current status</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-3 max-w-xl mx-auto mb-12">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
          <input type="text" value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="Order ID (e.g., abc123)" className="w-full bg-dark-900 border border-dark-800 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
        </div>
        <button type="submit" disabled={loading || !orderId.trim()} className="bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 px-6 py-3.5 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20 disabled:opacity-50">
          {loading ? "Searching..." : "Track"}
        </button>
      </form>

      {error && <div className="max-w-xl mx-auto mb-8 text-center"><div className="bg-red-500/10 border border-red-500/20 rounded-xl px-6 py-4"><p className="text-red-400 text-sm">{error}</p></div></div>}

      {order && (
        <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8 space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-400 font-medium">ORDER</p>
              <p className="text-xl font-mono font-bold text-white">#{order.id?.slice(-8)?.toUpperCase() || order.id}</p>
              <p className="text-xs text-dark-500 mt-1">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <span className={`px-4 py-2 rounded-full text-xs font-semibold border capitalize ${statusBadgeMap[currentStatus] || ""}`}>
              {currentStatus === "out_for_delivery" ? "Out for Delivery" : currentStatus}
            </span>
          </div>

          {isCancelled ? (
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 text-center">
              <X size={24} className="text-red-400 mx-auto mb-2" />
              <p className="text-red-400 font-semibold">This order has been cancelled</p>
            </div>
          ) : isReturned ? (
            <div className="space-y-4">
              <div className="sm:hidden w-full">
                {steps.map((step, i) => {
                  const isReturnStep = step.key === "return_requested" || step.key === "returned";
                  const done = isReturnStep ? (currentStatus === "returned" || step.key === "return_requested") : true;
                  const isCurrent = step.key === currentStatus;
                  const circle = done ? (isReturnStep ? "bg-purple-500 text-white" : "bg-gold-500 text-dark-950") : "bg-dark-800 text-dark-600 border border-dark-700";
                  const line = done ? (isReturnStep ? "bg-purple-500" : "bg-gold-500") : "bg-dark-700";
                  const label = done ? (isReturnStep ? "text-purple-400" : "text-gold-400") : "text-dark-600";
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
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="hidden sm:flex items-center gap-1 w-full">
                {steps.slice(0, 5).map((step, i) => (
                  <div key={step.key} className="flex-1 flex flex-col items-center relative">
                    <div className="flex items-center w-full">
                      {i > 0 && <div className="flex-1 h-0.5 bg-gold-500" />}
                      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-gold-500 text-dark-950"><step.icon size={14} /></div>
                      {i < 4 && <div className="flex-1 h-0.5 bg-gold-500" />}
                    </div>
                    <p className="text-[10px] mt-1.5 font-medium text-center text-gold-400">{step.label}</p>
                  </div>
                ))}
              </div>
              <div className="hidden sm:flex items-center gap-1 w-full max-w-[50%] mx-auto">
                {steps.slice(5).map((step, i) => {
                  const done = currentStatus === "returned" || (currentStatus === "return_requested" && i === 0);
                  const isCurrent = (currentStatus === "return_requested" && i === 0) || (currentStatus === "returned" && i === 1);
                  return (
                    <div key={step.key} className="flex-1 flex flex-col items-center relative">
                      <div className="flex items-center w-full">
                        <div className={`flex-1 h-0.5 ${i > 0 && done ? "bg-purple-500" : "bg-dark-700"}`} />
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${done ? "bg-purple-500 text-white" : "bg-dark-800 text-dark-600 border border-dark-700"} ${isCurrent ? "ring-2 ring-purple-500/30 ring-offset-2 ring-offset-dark-900" : ""}`}>
                          <step.icon size={14} />
                        </div>
                        {i === 0 && <div className={`flex-1 h-0.5 ${done && currentStatus === "returned" ? "bg-purple-500" : "bg-dark-700"}`} />}
                      </div>
                      <p className={`text-[10px] mt-1.5 font-medium text-center ${done ? "text-purple-400" : "text-dark-600"}`}>{step.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="sm:hidden w-full">
                {steps.map((step, i) => {
                  const done = i <= currentIdx;
                  const isCurrent = i === currentIdx;
                  const circle = done ? "bg-gold-500 text-dark-950" : "bg-dark-800 text-dark-600 border border-dark-700";
                  const line = done ? "bg-gold-500" : "bg-dark-700";
                  return (
                    <div key={step.key} className="flex gap-3">
                      <div className="flex flex-col items-center shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${circle} ${isCurrent ? "ring-2 ring-gold-500/30 ring-offset-2 ring-offset-dark-900" : ""}`}>
                          <step.icon size={14} />
                        </div>
                        {i < steps.length - 1 && <div className={`w-0.5 flex-1 my-0.5 min-h-4 ${line}`} />}
                      </div>
                      <div className="pt-1.5 pb-4 min-w-0">
                        <p className={`text-sm font-medium ${done ? "text-gold-400" : "text-dark-600"}`}>{step.label}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
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
          )}

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="bg-dark-800/30 border border-dark-700/50 rounded-xl p-4">
              <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5"><MapPin size={12} /> Delivery Address</p>
              <p className="text-white text-sm font-medium">{order.shippingName}</p>
              <p className="text-dark-400 text-sm">{order.shippingAddress}</p>
              <p className="text-dark-400 text-sm">{order.shippingCity}, {order.shippingState} - {order.shippingPincode}</p>
              <p className="text-dark-500 text-xs mt-1"><Phone size={10} className="inline mr-1" />{order.shippingPhone}</p>
            </div>
            <div className="bg-dark-800/30 border border-dark-700/50 rounded-xl p-4">
              <p className="text-xs text-dark-500 uppercase tracking-wider mb-2 font-medium flex items-center gap-1.5"><CreditCard size={12} /> Payment</p>
              <p className="text-gold-400 text-sm font-semibold">Online Payment{order.paymentStatus === "APPROVED" ? " · Paid" : order.paymentStatus === "PENDING" ? " · Pending" : order.paymentStatus ? ` · ${order.paymentStatus}` : ""}</p>
              <p className="text-white text-lg font-bold mt-2">{formatPrice(order.totalAmount || 0)}</p>
              {order.paymentStatus === "PENDING" && (
                <p className="text-amber-400 text-xs mt-2">Complete payment within 24 hours to keep this order confirmed.</p>
              )}
            </div>
          </div>

          {order.items?.length > 0 && (
            <div>
              <p className="text-xs text-dark-500 uppercase tracking-wider mb-3 font-medium">Items ({order.items.length})</p>
              <div className="space-y-2">{[...order.items].reverse().map((item: any, idx: number) => (
                <Link key={idx} href={`/products/${item.productId}`} className="flex items-center gap-3 bg-dark-800/20 border border-dark-700/30 rounded-xl p-3 hover:bg-dark-800/40 transition-colors group">
                  {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-dark-800" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate group-hover:text-gold-400 transition-colors">{item.name || item.product?.name}</p>
                    <p className="text-dark-400 text-xs">Qty: {item.quantity || 1}</p>
                  </div>
                  <span className="text-white text-sm font-medium">{formatPrice((item.price || 0) * (item.quantity || 1))}</span>
                </Link>
              ))}</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
