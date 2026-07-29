"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch, apiUrl } from "@/lib/api";
import { Package, Truck, MapPin, Clock, LogOut, ChevronRight, RefreshCw } from "lucide-react";

export default function DeliveryDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, delivered: 0, shipped: 0 });
  const [fetching, setFetching] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = async () => {
    try {
      const data = await apiFetch("/delivery/orders");
      setOrders(data);
      setStats({ total: data.length, delivered: data.filter((o: any) => o.status === "delivered").length, shipped: data.filter((o: any) => o.status === "shipped").length });
    } catch {}
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
    setRefreshing(false);
  };

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "DELIVERY") { router.push("/"); return; }
    if (!user.approved) return;
    fetchOrders().finally(() => setFetching(false));
  }, [user, loading, router]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>;

  if (!user) return null;

  if (!user.approved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12 page-transition">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={36} className="text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Awaiting Approval</h1>
          <p className="text-dark-400 text-sm mb-8">Your delivery executive account is pending approval from the owner. You will be notified once approved.</p>
          <button onClick={logout} className="text-dark-400 hover:text-white text-sm flex items-center gap-2 mx-auto"><LogOut size={16} /> Sign Out</button>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => o.status !== "delivered" && o.status !== "cancelled");
  const confirmedOrders = orders.filter(o => o.status === "confirmed");
  const shippedOrders = orders.filter(o => o.status === "shipped");
  const outForDeliveryOrders = orders.filter(o => o.status === "out_for_delivery");
  const deliveredOrders = orders.filter(o => o.status === "delivered");

  return (
    <div className="min-h-screen bg-dark-950 page-transition">
      <div className="max-w-5xl mx-auto px-6 pt-28 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Delivery Dashboard</span>
            <h1 className="text-3xl font-display font-bold text-white mt-1">Welcome, {user.name}</h1>
          </div>
          <button onClick={handleRefresh} disabled={refreshing} className="flex items-center gap-2 text-dark-400 hover:text-gold-400 text-sm transition-colors mr-3"><RefreshCw size={16} className={refreshing ? "animate-spin" : ""} /> Refresh</button>
          <button onClick={logout} className="flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors"><LogOut size={16} /> Sign Out</button>
        </div>

          <div className="grid grid-cols-5 gap-4 mb-8">
            <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-5 text-center"><p className="text-2xl font-bold text-gold-400">{stats.total}</p><p className="text-xs text-dark-400 mt-1">Total Assigned</p></div>
            <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-5 text-center"><p className="text-2xl font-bold text-blue-400">{confirmedOrders.length}</p><p className="text-xs text-dark-400 mt-1">New Orders</p></div>
            <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-5 text-center"><p className="text-2xl font-bold text-purple-400">{shippedOrders.length}</p><p className="text-xs text-dark-400 mt-1">To Pick Up</p></div>
            <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-5 text-center"><p className="text-2xl font-bold text-orange-400">{outForDeliveryOrders.length}</p><p className="text-xs text-dark-400 mt-1">Out for Delivery</p></div>
            <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-5 text-center"><p className="text-2xl font-bold text-green-400">{stats.delivered}</p><p className="text-xs text-dark-400 mt-1">Delivered</p></div>
          </div>

        {fetching ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-dark-900/60 border border-dark-800/50 rounded-2xl"><Package className="w-12 h-12 text-dark-600 mx-auto mb-3" /><p className="text-dark-400 text-sm">No orders assigned to you yet</p></div>
        ) : (
          <div className="space-y-6">
            {confirmedOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Clock size={18} className="text-blue-400" /> New Orders ({confirmedOrders.length})</h2>
                <div className="space-y-3">{[...confirmedOrders].reverse().map(order => (
                  <Link key={order.id} href={`/delivery/order-detail?id=${order.id}`} className="block bg-dark-900/60 border border-dark-800/50 rounded-xl p-5 hover:border-dark-700 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div><p className="text-white font-medium">#{order.id.slice(-8).toUpperCase()}</p><p className="text-xs text-dark-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"})}</p></div>
                      <div className="flex items-center gap-3"><span className="px-3 py-1 rounded-full text-[10px] font-semibold border text-blue-400 bg-blue-500/10 border-blue-500/20">CONFIRMED</span><ChevronRight size={16} className="text-dark-600 group-hover:text-gold-400 transition-colors" /></div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-dark-400 text-xs"><MapPin size={12} /> {order.shippingAddress}, {order.shippingCity}</div>
                  </Link>
                ))}</div>
              </div>
            )}
            {shippedOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Truck size={18} className="text-purple-400" /> To Pick Up ({shippedOrders.length})</h2>
                <div className="space-y-3">{[...shippedOrders].reverse().map(order => (
                  <Link key={order.id} href={`/delivery/order-detail?id=${order.id}`} className="block bg-dark-900/60 border border-dark-800/50 rounded-xl p-5 hover:border-dark-700 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div><p className="text-white font-medium">#{order.id.slice(-8).toUpperCase()}</p><p className="text-xs text-dark-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"})}</p></div>
                      <div className="flex items-center gap-3"><span className="px-3 py-1 rounded-full text-[10px] font-semibold border text-purple-400 bg-purple-500/10 border-purple-500/20">SHIPPED</span><ChevronRight size={16} className="text-dark-600 group-hover:text-gold-400 transition-colors" /></div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-dark-400 text-xs"><MapPin size={12} /> {order.shippingAddress}, {order.shippingCity}</div>
                  </Link>
                ))}</div>
              </div>
            )}
            {outForDeliveryOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Truck size={18} className="text-orange-400" /> Out for Delivery ({outForDeliveryOrders.length})</h2>
                <div className="space-y-3">{[...outForDeliveryOrders].reverse().map(order => (
                  <Link key={order.id} href={`/delivery/order-detail?id=${order.id}`} className="block bg-dark-900/60 border border-dark-800/50 rounded-xl p-5 hover:border-dark-700 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div><p className="text-white font-medium">#{order.id.slice(-8).toUpperCase()}</p><p className="text-xs text-dark-400 mt-0.5">{new Date(order.createdAt).toLocaleDateString("en-IN", {day:"numeric",month:"short",year:"numeric"})}</p></div>
                      <div className="flex items-center gap-3"><span className="px-3 py-1 rounded-full text-[10px] font-semibold border text-orange-400 bg-orange-500/10 border-orange-500/20">OUT FOR DELIVERY</span><ChevronRight size={16} className="text-dark-600 group-hover:text-gold-400 transition-colors" /></div>
                    </div>
                    <div className="flex items-center gap-2 mt-3 text-dark-400 text-xs"><MapPin size={12} /> {order.shippingAddress}, {order.shippingCity}</div>
                  </Link>
                ))}</div>
              </div>
            )}
            {deliveredOrders.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2"><Package size={18} className="text-green-400" /> Delivered Orders</h2>
                <div className="space-y-2">{[...deliveredOrders].reverse().map(order => (
                  <Link key={order.id} href={`/delivery/order-detail?id=${order.id}`} className="block bg-dark-900/30 border border-dark-800/30 rounded-xl p-4 hover:border-dark-700 transition-colors group">
                    <div className="flex items-center justify-between">
                      <p className="text-white text-sm font-medium">#{order.id.slice(-8).toUpperCase()}</p>
                      <span className="text-green-400 text-[10px] font-semibold">DELIVERED</span>
                    </div>
                    <p className="text-xs text-dark-500 mt-1">{order.shippingName} — {order.shippingCity}</p>
                  </Link>
                ))}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
