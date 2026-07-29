"use client";

import { useState, useEffect } from "react";
import { Store, UserCheck, UserX, ChevronDown, ChevronUp, Package, ShoppingBag, Eye, LogIn } from "lucide-react";
import { API, adminHeaders, statusColors } from "./types";
import { formatPrice } from "@/lib/utils";

export default function SellersTab({ adminKey }: { adminKey: string }) {
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [sellerDetail, setSellerDetail] = useState<Record<string, any>>({});
  const [detailLoading, setDetailLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch(`${API}/api/admin/sellers`, { headers: adminHeaders(adminKey) })
      .then(r => r.json()).then(setSellers).catch(() => {}).finally(() => setLoading(false));
  }, [adminKey]);

  const loadDetail = async (id: string) => {
    if (sellerDetail[id]) return;
    setDetailLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch(`${API}/api/admin/users/${id}`, { headers: adminHeaders(adminKey) });
      const data = await res.json();
      setSellerDetail(prev => ({ ...prev, [id]: data }));
    } catch {} finally {
      setDetailLoading(prev => ({ ...prev, [id]: false }));
    }
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

  const handleApprove = async (id: string, approved: boolean) => {
    try {
      await fetch(`${API}/api/admin/users/${id}/approve`, {
        method: "PUT", headers: adminHeaders(adminKey), body: JSON.stringify({ approved }),
      });
      setSellers(prev => prev.map(s => s.id === id ? { ...s, approved } : s));
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
      <h2 className="text-2xl font-serif text-white flex items-center gap-3"><Store className="text-gold-400" /> Sellers</h2>
      {sellers.length === 0 ? (
        <div className="text-center py-16 bg-dark-900/60 border border-dark-800/50 rounded-2xl"><Store className="w-12 h-12 text-dark-600 mx-auto mb-3" /><p className="text-dark-400 text-sm">No sellers registered</p></div>
      ) : (
        <div className="space-y-3">
          {sellers.map((seller: any) => {
            const isExpanded = expandedId === seller.id;
            const detail = sellerDetail[seller.id];
            const products = detail?.products || [];
            return (
              <div key={seller.id} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl overflow-hidden transition-all">
                <button onClick={() => toggleExpand(seller.id)} className="w-full px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border ${seller.approved ? "bg-green-500/10 border-green-500/20 text-green-400" : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"}`}>
                    {seller.approved ? <UserCheck className="w-4 h-4" /> : <UserX className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium">{seller.name}</p>
                    <p className="text-dark-400 text-xs">{seller.email} {seller.phone ? `— ${seller.phone}` : ""}</p>
                    <p className="text-dark-500 text-[10px] mt-0.5">{seller._count?.products || 0} products</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={(e) => { e.stopPropagation(); handleAccess(seller.id); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-500/20 bg-purple-500/10 text-purple-400 hover:bg-purple-500/20 transition-all flex items-center gap-1.5">
                      <LogIn className="w-3.5 h-3.5" /> Access Account
                    </button>
                    {seller.approved ? (
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(seller.id, false); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all">Reject</button>
                    ) : (
                      <button onClick={(e) => { e.stopPropagation(); handleApprove(seller.id, true); }} className="px-3 py-1.5 rounded-lg text-xs font-semibold border border-green-500/20 bg-green-500/10 text-green-400 hover:bg-green-500/20 transition-all">Approve</button>
                    )}
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-dark-500" /> : <ChevronDown className="w-4 h-4 text-dark-500" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-dark-800/30">
                    {detailLoading[seller.id] ? (
                      <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>
                    ) : (
                      <>
                        <div className="pt-4 space-y-1">
                          <p className="text-xs text-dark-500">Joined {new Date(seller.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</p>
                        </div>

                        <h4 className="text-xs text-purple-400 uppercase tracking-wider font-semibold mt-5 mb-3 flex items-center gap-2">
                          <ShoppingBag className="w-3.5 h-3.5" /> Products ({products.length})
                        </h4>

                        {products.length === 0 ? (
                          <p className="text-dark-500 text-xs py-4 text-center">No products listed yet</p>
                        ) : (
                          <div className="grid gap-3 sm:grid-cols-2">
                            {products.map((product: any) => (
                              <div key={product.id} className="bg-dark-900/40 border border-dark-800/30 rounded-xl p-4 space-y-2">
                                <div className="flex items-start gap-3">
                                  {product.images?.[0] ? (
                                    <img src={product.images[0]} alt={product.name} className="w-12 h-12 rounded-lg object-cover shrink-0" />
                                  ) : (
                                    <div className="w-12 h-12 rounded-lg bg-dark-800/50 flex items-center justify-center shrink-0">
                                      <Package className="w-5 h-5 text-dark-600" />
                                    </div>
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{product.name}</p>
                                    <p className="text-xs text-dark-400">{product.brand}</p>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className="text-xs text-gold-400 font-semibold">{formatPrice(product.price)}</span>
                                      {product.originalPrice > product.price && (
                                        <span className="text-[10px] text-dark-500 line-through">{formatPrice(product.originalPrice)}</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-[10px] text-dark-500">
                                  <span className="capitalize">{product.category}</span>
                                  <span className={`flex items-center gap-1 ${product.inStock ? "text-green-500" : "text-red-400"}`}>
                                    {product.inStock ? "In Stock" : "Out of Stock"}
                                  </span>
                                </div>
                                {product.description && (
                                  <p className="text-[10px] text-dark-500 line-clamp-2">{product.description}</p>
                                )}
                                <a href={`/products/${product.id}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-[10px] text-gold-400 hover:text-gold-300 transition-colors">
                                  <Eye className="w-3 h-3" /> View product
                                </a>
                              </div>
                            ))}
                          </div>
                        )}

                        <h4 className="text-xs text-purple-400 uppercase tracking-wider font-semibold mt-5 mb-3 flex items-center gap-2">
                          <Package className="w-3.5 h-3.5" /> Orders ({detail?.orders?.length || 0})
                        </h4>

                        {(!detail?.orders || detail.orders.length === 0) ? (
                          <p className="text-dark-500 text-xs py-4 text-center">No orders from this seller&apos;s products</p>
                        ) : (
                          <div className="space-y-2">
                            {detail.orders.slice(0, 10).map((order: any) => (
                              <div key={order.id} className="bg-dark-900/40 border border-dark-800/30 rounded-xl p-4 space-y-1">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs text-dark-500 font-mono">#{order.id?.slice(0, 8)}</p>
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[order.status] || "text-dark-400 bg-dark-800/50 border-dark-700/50"}`}>{order.status}</span>
                                </div>
                                <p className="text-sm text-white font-medium">{formatPrice(order.totalAmount)}</p>
                                <p className="text-[10px] text-dark-600">{new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
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
