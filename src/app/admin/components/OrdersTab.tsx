"use client";

import { useState, useEffect, useRef } from "react";
import {
  Package,
  Search,
  ChevronDown,
  ChevronUp,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  UserCheck,
  Loader2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { statusColors, API, adminHeaders } from "./types";

const statusGradients: Record<string, string> = {
  pending: "from-yellow-500/15 to-yellow-500/5",
  confirmed: "from-blue-500/15 to-blue-500/5",
  shipped: "from-purple-500/15 to-purple-500/5",
  out_for_delivery: "from-orange-500/15 to-orange-500/5",
  delivered: "from-green-500/15 to-green-500/5",
  cancelled: "from-red-500/15 to-red-500/5",
};

const statusBorders: Record<string, string> = {
  pending: "border-l-yellow-400",
  confirmed: "border-l-blue-400",
  shipped: "border-l-purple-400",
  out_for_delivery: "border-l-orange-400",
  delivered: "border-l-green-400",
  cancelled: "border-l-red-400",
};

export default function OrdersTab({
  orders,
  updatingId,
  onStatusUpdate,
  onAssign,
  focusOrderId,
  onFocusHandled,
  adminKey,
}: {
  orders: any[];
  updatingId: string | null;
  onStatusUpdate: (orderId: string, status: string) => void;
  onAssign?: (orderId: string, deliveryId: string) => void;
  focusOrderId?: string | null;
  onFocusHandled?: () => void;
  adminKey?: string;
}) {
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderSearch, setOrderSearch] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [deliveryExecs, setDeliveryExecs] = useState<any[]>([]);
  const [assignSelections, setAssignSelections] = useState<Record<string, string>>({});
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const lastFocusRef = useRef<string | null>(null);

  useEffect(() => {
    if (adminKey) {
      fetch(`${API}/api/admin/delivery-executives`, { headers: adminHeaders(adminKey) })
        .then((r) => r.json())
        .then((data) => { if (!data.error) setDeliveryExecs(data); })
        .catch(() => {});
    }
  }, [adminKey]);

  useEffect(() => {
    if (focusOrderId && focusOrderId !== lastFocusRef.current) {
      lastFocusRef.current = focusOrderId;
      setExpandedOrder(focusOrderId);
      setOrderFilter("all");
      setOrderSearch("");
      setTimeout(() => {
        const el = document.getElementById(`order-${focusOrderId}`);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
        onFocusHandled?.();
      }, 100);
    }
  }, [focusOrderId, onFocusHandled]);

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      orderSearch === "" ||
      order.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.shippingName?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.user?.email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      order.user?.phone?.includes(orderSearch) ||
      order.shippingPhone?.includes(orderSearch);

    const matchesFilter =
      orderFilter === "all" || order.status === orderFilter;

    return matchesSearch && matchesFilter;
  });

  const statuses = ["pending", "confirmed", "shipped", "out_for_delivery", "delivered", "cancelled"];

  const statusCounts = statuses.reduce((acc, status) => {
    acc[status] = orders.filter((o) => o.status === status).length;
    return acc;
  }, {} as Record<string, number>);

  function handleStatusChange(orderId: string, status: string) {
    if (status === "cancelled") {
      if (!confirm("Are you sure you want to cancel this order?")) return;
    }
    onStatusUpdate(orderId, status);
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Orders</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-gold-500/50 w-full sm:w-72"
            />
          </div>
          <select
            value={orderFilter}
            onChange={(e) => setOrderFilter(e.target.value)}
            className="px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-white text-sm focus:outline-none focus:border-gold-500/50 appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
        {statuses.map((status) => (
          <button
            key={status}
            onClick={() =>
              setOrderFilter(orderFilter === status ? "all" : status)
            }
            className={`p-3 rounded-xl border text-center transition-all bg-gradient-to-br ${
              orderFilter === status
                ? `${statusGradients[status]} border-${status === "pending" ? "yellow" : status === "confirmed" ? "blue" : status === "shipped" ? "purple" : status === "out_for_delivery" ? "orange" : status === "delivered" ? "green" : "red"}-500/30`
                : "border-dark-800/50 from-dark-900/40 to-dark-900/20 hover:from-dark-800/30 hover:to-dark-800/10"
            }`}
          >
            <div
              className="text-lg font-bold"
              style={{ color: statusColors[status as keyof typeof statusColors] }}
            >
              {statusCounts[status] || 0}
            </div>
            <div className="text-xs text-dark-400 capitalize">{status}</div>
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="text-center py-16 bg-dark-900/60 border border-dark-800/50 rounded-2xl">
          <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrder === order.id;
            const sc = statusColors[order.status as keyof typeof statusColors] || "";

            return (
              <div
                key={order.id}
                id={`order-${order.id}`}
                className={`bg-gradient-to-r ${statusGradients[order.status] || "from-dark-900/40 to-dark-900/20"} border border-dark-800/50 border-l-4 ${statusBorders[order.status] || "border-l-dark-600"} rounded-2xl overflow-hidden transition-all`}
              >
                <button
                  onClick={() =>
                    setExpandedOrder(isExpanded ? null : order.id)
                  }
                  className="w-full px-4 sm:px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${statusGradients[order.status] || ""} border border-dark-700/50`}>
                    <Package className="w-5 h-5" style={{ color: statusColors[order.status as keyof typeof statusColors] }} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-white font-mono text-sm font-medium">
                        #{order.id?.slice(0, 8)}
                      </span>
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit capitalize"
                        style={{
                          backgroundColor: `${statusColors[order.status as keyof typeof statusColors]}20`,
                          color: statusColors[order.status as keyof typeof statusColors],
                        }}
                      >
                        {order.status}
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                      <span className="text-dark-300 text-sm truncate">
                        {order.shippingName || "Unknown"}
                      </span>
                      <span className="text-dark-500 text-sm hidden sm:block">
                        &middot;
                      </span>
                      <span className="text-dark-500 text-sm truncate hidden sm:block">
                        {order.user?.email || order.shippingPhone || "No contact"}
                      </span>
                      <span className="text-dark-500 text-sm hidden sm:block">
                        &middot;
                      </span>
                      <span className="text-dark-500 text-sm hidden sm:block">
                        {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-sm text-dark-400">
                      {order.items?.length || 0} item
                      {(order.items?.length || 0) !== 1 ? "s" : ""}
                    </div>
                    <div className="text-white font-semibold">
                      {formatPrice(order.totalAmount || 0)}
                    </div>
                  </div>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-dark-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-dark-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 space-y-5 border-t border-dark-800/30">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-5">
                      <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs text-blue-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                          <Mail className="w-3.5 h-3.5" /> Customer Info
                        </h4>
                        <div className="space-y-2">
                          <p className="text-white text-sm font-medium">
                            {order.shippingName}
                          </p>
                          <div className="flex items-center gap-2 text-dark-300 text-xs">
                            <Mail className="w-3.5 h-3.5 text-blue-400" />
                            {order.user?.email || "N/A"}
                          </div>
                          <div className="flex items-center gap-2 text-dark-300 text-xs">
                            <Phone className="w-3.5 h-3.5 text-green-400" />
                            {order.shippingPhone || "N/A"}
                          </div>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs text-green-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5" /> Shipping Info
                        </h4>
                        <div className="space-y-1">
                          <p className="text-dark-300 text-xs">
                            {order.shippingAddress}
                          </p>
                          <p className="text-dark-300 text-xs">
                            {order.shippingCity}, {order.shippingState}
                          </p>
                          <p className="text-dark-300 text-xs">
                            PIN: {order.shippingPincode}
                          </p>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs text-purple-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                          <Package className="w-3.5 h-3.5" /> Delivery Info
                        </h4>
                        <div className="space-y-2">
                          {order.assignedTo ? (
                            <div>
                              <p className="text-white text-sm">
                                Assigned to: <span className="text-purple-400 font-medium">{order.deliveryExecutive?.name || `#${order.assignedTo.slice(-8).toUpperCase()}`}</span>
                              </p>
                              {onAssign && deliveryExecs.length > 0 && (
                                <div className="flex gap-2 mt-2">
                                  <select
                                    value={assignSelections[order.id] || ""}
                                    onChange={(e) => setAssignSelections((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                    className="flex-1 px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                                  >
                                    <option value="">Reassign to...</option>
                                    {deliveryExecs.filter((e) => e.id !== order.assignedTo).map((exec) => (
                                      <option key={exec.id} value={exec.id}>{exec.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      if (assignSelections[order.id]) {
                                        onAssign(order.id, assignSelections[order.id]);
                                        setAssignSelections((prev) => ({ ...prev, [order.id]: "" }));
                                      }
                                    }}
                                    disabled={assigningId === order.id || !assignSelections[order.id]}
                                    className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50"
                                  >
                                    {assigningId === order.id ? "Assigning..." : "Assign"}
                                  </button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-dark-400 text-sm">Not assigned</p>
                              {onAssign && (
                                <div className="flex gap-2">
                                  <select
                                    value={assignSelections[order.id] || ""}
                                    onChange={(e) => setAssignSelections((prev) => ({ ...prev, [order.id]: e.target.value }))}
                                    className="flex-1 px-3 py-1.5 bg-dark-800 border border-dark-700 rounded-lg text-xs text-white focus:outline-none focus:border-purple-500 appearance-none cursor-pointer"
                                  >
                                    <option value="">Select delivery exec...</option>
                                    {deliveryExecs.map((exec) => (
                                      <option key={exec.id} value={exec.id}>{exec.name}</option>
                                    ))}
                                  </select>
                                  <button
                                    onClick={() => {
                                      if (assignSelections[order.id]) {
                                        onAssign(order.id, assignSelections[order.id]);
                                        setAssignSelections((prev) => ({ ...prev, [order.id]: "" }));
                                      }
                                    }}
                                    disabled={assigningId === order.id || !assignSelections[order.id]}
                                    className="px-3 py-1.5 bg-purple-500/20 border border-purple-500/30 rounded-lg text-xs text-purple-300 font-medium hover:bg-purple-500/30 transition-colors disabled:opacity-50 flex items-center gap-1"
                                  >
                                    {assigningId === order.id ? (
                                      <><Loader2 className="w-3 h-3 animate-spin" /> Assigning</>
                                    ) : (
                                      <><UserCheck className="w-3 h-3" /> Assign</>
                                    )}
                                  </button>
                                </div>
                              )}
                              {!onAssign && (
                                <p className="text-dark-500 text-xs">Login as admin to assign</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                      <div className="bg-gradient-to-br from-gold-500/10 to-gold-500/5 border border-gold-500/20 rounded-xl p-4 space-y-3">
                      <h4 className="text-xs text-gold-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                        <Package className="w-3.5 h-3.5" /> Items
                      </h4>
                      <div className="space-y-2">
                        {order.items?.map((item: any, idx: number) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-2 rounded-lg bg-dark-900/30"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-10 rounded-lg object-cover"
                              />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-white text-sm truncate">
                                {item.name}
                              </p>
                              <p className="text-dark-500 text-xs">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <span className="text-white text-sm font-medium">
                              {formatPrice(item.price * (item.quantity || 1))}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <h4 className="text-xs text-gold-400 uppercase tracking-wider font-semibold">
                          Update Status
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {statuses.map((status) => (
                            <button
                              key={status}
                              disabled={updatingId === order.id || order.status === status}
                              onClick={() => handleStatusChange(order.id, status)}
                              className={`text-xs font-medium px-3 py-1.5 rounded-lg border transition-all disabled:opacity-50 ${
                                order.status === status
                                  ? `${statusColors[status as keyof typeof statusColors]} ring-1 ring-gold-500/20`
                                  : "bg-dark-800 text-dark-500 border-dark-700 hover:text-white"
                              }`}
                            >
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 bg-dark-800/30 rounded-xl px-4 py-2">
                        <CreditCard className="w-4 h-4 text-gold-400" />
                        <div>
                          <div className="text-xs text-dark-500">Payment</div>
                          <div className="text-gold-400 text-sm font-medium">{order.paymentMethod || "N/A"}</div>
                        </div>
                        <div className="border-l border-dark-700 pl-3 ml-1">
                          <div className="text-xs text-dark-500">Total</div>
                          <div className="text-white font-bold text-lg">{formatPrice(order.totalAmount || 0)}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
