"use client";

import { useState, useEffect } from "react";
import { Truck, UserCheck, UserX, ChevronDown, ChevronUp, Package, MapPin, Clock, LogIn } from "lucide-react";
import { API, adminHeaders, statusColors } from "./types";
import { formatPrice } from "@/lib/utils";

export default function DeliveryExecTab({ adminKey }: { adminKey: string }) {
  const [execs, setExecs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [execDetail, setExecDetail] = useState<Record<string, any>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`${API}/api/admin/delivery-executives`, { headers: adminHeaders(adminKey) })
      .then(r => r.json()).then(setExecs).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey]);

  const loadDetail = async (id: string) => {
    if (execDetail[id]) return;
    setDetailLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, { headers: adminHeaders(adminKey) });
      const data = await res.json();
      setExecDetail(prev => ({ ...prev, [id]: data }));
    } catch {} finally {
      setDetailLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await fetch(`${API}/api/admin/users/${id}/approve`, {
        method: "PUT", headers: adminHeaders(adminKey), body: JSON.stringify({ approved }),
      });
      setExecs(prev => prev.map(e => e.id === id ? { ...e, approved } : e));
    } catch {}
  };

  const handleAccess = async (userId: string) => {
    try {
      const res = await fetch(`${API}/api/admin/impersonate/${userId}`, {
        method: "POST", headers: adminHeaders(adminKey),
      });
      if (!res.ok) return;
      const { token, user } = await res.json();
      const raw = localStorage.getItem("bt-accounts");
      const accounts = raw ? JSON.parse(raw) : [];
      const adminIdx = parseInt(localStorage.getItem("bt-current") || "0");
      accounts.push({ token, user });
      localStorage.setItem("bt-accounts", JSON.stringify(accounts));
      localStorage.setItem("bt-current", String(accounts.length - 1));
      localStorage.setItem("bt-token", token);
      setTimeout(() => {
        window.open(user.role === "SELLER" ? "/seller" : "/delivery", "_blank");
      }, 50);
      setTimeout(() => {
        localStorage.setItem("bt-current", String(adminIdx));
        localStorage.setItem("bt-token", accounts[adminIdx]?.token || "");
      }, 2000);
    } catch {}
  };

  const toggleExpand = async (id: string) => {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    await loadDetail(id);
  };

  if (loading) return <div className="flex justify-center py-16"><div className="w-8 h-8 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif text-white flex items-center gap-3"><Truck className="text-gold-400" /> Delivery Executives</h2>
      {execs.length === 0 ? (
        <div className="text-center py-16 bg-dark-900/60 border border-dark-800/50 rounded-2xl"><Truck className="w-12 h-12 text-dark-600 mx-auto mb-3" /><p className="text-dark-400 text-sm">No delivery executives registered</p></div>
      ) : (
        <div className="space-y-3">
          {execs.map((exec: any) => {
            const isExpanded = expandedId === exec.id;
            const detail = execDetail[exec.id];
            const orders = detail?.orders || [];
            return (
              <div key={exec.id} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl overflow-hidden transition-all">
                <button onClick={() => toggleExpand(exec.id)} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${exec.approved ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"}`}>
                    {exec.approved ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{exec.name}</p>
                    <p className="text-dark-400 text-xs">{exec.email} {exec.phone ? `— ${exec.phone}` : ""}</p>
                    <p className="text-dark-500 text-[10px] mt-0.5">{orders.length} orders</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); handleAccess(exec.id); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1.5">
                      <LogIn className="w-3.5 h-3.5" /> Access Account
                    </button>
                    {exec.approved ? (
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(exec.id, false); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">Reject</button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(exec.id, true); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">Approve</button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-dark-500" /> : <ChevronDown className="w-4 h-4 text-dark-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-dark-800/30">
                    {detailLoading[exec.id] ? (
                      <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>
                    ) : (
                      <>
                        <div className="pt-4 space-y-1">
                          <p className="text-xs text-dark-500">Joined {new Date(exec.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                          {detail?.phone && <p className="text-xs text-dark-400">Phone: {detail.phone}</p>}
                        </div>

                        <h4 className="text-xs text-purple-400 uppercase tracking-wider font-semibold mt-5 mb-3 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5" /> Assigned Orders ({orders.length})
                        </h4>

                        {orders.length === 0 ? (
                          <p className="text-dark-500 text-xs py-4 text-center">No orders assigned</p>
                        ) : (
                          <div className="space-y-2">
                            {orders.map((order: any) => (
                              <div key={order.id} className="bg-dark-900/40 border border-dark-800/30 rounded-xl p-4 space-y-2">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-dark-500 font-mono">#{order.id?.slice(0, 8)}</p>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[order.status] || "text-dark-400 bg-dark-800/50 border-dark-700/50"}`}>{order.status}</span>
                                </div>
                                <p className="text-sm text-white font-medium">{formatPrice(order.totalAmount)}</p>
                                <div className="flex items-center gap-1.5 text-dark-400 text-xs">
                                  <MapPin className="w-3 h-3 shrink-0" />
                                  {order.shippingAddress}, {order.shippingCity}
                                </div>
                                {order.items?.map((item: any, i: number) => (
                                  <p key={i} className="text-xs text-dark-500">• {item.name} × {item.quantity} — {formatPrice(item.price * (item.quantity || 1))}</p>
                                ))}
                                <p className="text-[10px] text-dark-600">
                                  <Clock className="inline w-3 h-3 mr-1" />
                                  {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </>
                    )}
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
