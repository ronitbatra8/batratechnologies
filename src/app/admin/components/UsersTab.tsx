"use client";

import { useState, useCallback } from "react";
import {
  Users,
  Mail,
  Phone,
  Search,
  ChevronDown,
  ChevronUp,
  Package,
  Star,
  MapPin,
  MessageSquare,
  Heart,
  Loader2,
  Send,
  X,
  Check,
  LogIn,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { API, adminHeaders, statusColors, msgStatusColors, type Tab } from "./types";

const tierGradients: Record<string, string> = {
  none: "from-dark-900/40 to-dark-900/20",
  low: "from-blue-500/15 to-blue-500/5",
  mid: "from-purple-500/15 to-purple-500/5",
  high: "from-gold-500/15 to-gold-500/5",
};

const tierBorders: Record<string, string> = {
  none: "border-l-dark-600",
  low: "border-l-blue-400",
  mid: "border-l-purple-400",
  high: "border-l-gold-400",
};

const tierColors: Record<string, string> = {
  none: "text-dark-400",
  low: "text-blue-400",
  mid: "text-purple-400",
  high: "text-gold-400",
};

function getUserTier(user: any): string {
  const count = user._count?.orders ?? 0;
  if (count >= 5) return "high";
  if (count >= 2) return "mid";
  if (count >= 1) return "low";
  return "none";
}

export default function UsersTab({
  users,
  adminKey,
  onNavigate,
}: {
  users: any[];
  adminKey: string;
  onNavigate: (tab: Tab, focusId?: string) => void;
}) {
  const [userSearch, setUserSearch] = useState("");
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [userFilter, setUserFilter] = useState("all");
  const [detailCache, setDetailCache] = useState<Record<string, any>>({});
  const [detailLoading, setDetailLoading] = useState<string | null>(null);
  const [emailModalUser, setEmailModalUser] = useState<any>(null);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState("");

  const now = new Date();
  const thisMonth = users.filter((u) => {
    const d = new Date(u.createdAt);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  const withOrders = users.filter((u) => (u._count?.orders ?? 0) > 0).length;
  const withReviews = users.filter((u) => (u._count?.reviews ?? 0) > 0).length;

  const categories = [
    { key: "all", label: "All", count: users.length, color: "text-white" },
    { key: "customers", label: "Customers", count: withOrders, color: "text-gold-400" },
    { key: "new", label: "New This Month", count: thisMonth, color: "text-green-400" },
    { key: "reviewers", label: "Reviewed", count: withReviews, color: "text-purple-400" },
    { key: "inactive", label: "No Orders", count: users.length - withOrders, color: "text-dark-400" },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      userSearch === "" ||
      user.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.email?.toLowerCase().includes(userSearch.toLowerCase()) ||
      user.phone?.includes(userSearch);

    const matchesFilter =
      userFilter === "all" ||
      (userFilter === "customers" && (user._count?.orders ?? 0) > 0) ||
      (userFilter === "new" &&
        new Date(user.createdAt).getMonth() === now.getMonth() &&
        new Date(user.createdAt).getFullYear() === now.getFullYear()) ||
      (userFilter === "reviewers" && (user._count?.reviews ?? 0) > 0) ||
      (userFilter === "inactive" && (user._count?.orders ?? 0) === 0);

    return matchesSearch && matchesFilter;
  });

  const toggleExpand = useCallback(async (userId: string) => {
    if (expandedUser === userId) {
      setExpandedUser(null);
      return;
    }
    setExpandedUser(userId);
    if (!detailCache[userId]) {
      setDetailLoading(userId);
      try {
        const data = await fetch(`${API}/api/admin/users/${userId}`, {
          headers: adminHeaders(adminKey),
        }).then((r) => r.json());
        if (!data.error) {
          setDetailCache((prev) => ({ ...prev, [userId]: data }));
        }
      } catch {}
      setDetailLoading(null);
    }
  }, [expandedUser, detailCache, adminKey]);

  const handleSendEmail = async () => {
    if (!emailModalUser) return;
    setEmailError("");
    if (emailSubject.trim().length < 2) { setEmailError("Subject must be at least 2 characters"); return; }
    if (emailMessage.trim().length < 3) { setEmailError("Message must be at least 3 characters"); return; }
    setEmailSending(true);
    try {
      const res = await fetch(`${API}/api/admin/users/${emailModalUser.id}/email`, {
        method: "POST",
        headers: adminHeaders(adminKey),
        body: JSON.stringify({ subject: emailSubject.trim(), message: emailMessage.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to send email");
      setEmailSent(true);
      setEmailSubject("");
      setEmailMessage("");
      setTimeout(() => { setEmailSent(false); setEmailModalUser(null); }, 2000);
    } catch (err: any) {
      setEmailError(err.message);
    } finally {
      setEmailSending(false);
    }
  };

  const openEmailModal = (user: any) => {
    setEmailModalUser(user);
    setEmailSubject("");
    setEmailMessage("");
    setEmailSent(false);
    setEmailError("");
  };

  const handleAccess = async (userId: string, role?: string) => {
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
        window.open(user.role === "SELLER" ? "/seller" : user.role === "DELIVERY" ? "/delivery" : "/", "_blank");
      }, 50);
      setTimeout(() => {
        localStorage.setItem("bt-current", String(adminIdx));
        localStorage.setItem("bt-token", accounts[adminIdx]?.token || "");
      }, 2000);
    } catch {}
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-white">Users</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-dark-400" />
            <input
              type="text"
              placeholder="Search by name, email, phone..."
              value={userSearch}
              onChange={(e) => setUserSearch(e.target.value)}
              className="pl-10 pr-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-gold-500/50 w-full sm:w-72"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {categories.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setUserFilter(userFilter === cat.key ? "all" : cat.key)}
            className={`p-3 rounded-xl border text-center transition-all bg-gradient-to-br ${
              userFilter === cat.key
                ? cat.key === "customers"
                  ? "from-gold-500/15 to-gold-500/5 border-gold-500/30"
                  : cat.key === "new"
                  ? "from-green-500/15 to-green-500/5 border-green-500/30"
                  : cat.key === "reviewers"
                  ? "from-purple-500/15 to-purple-500/5 border-purple-500/30"
                  : cat.key === "inactive"
                  ? "from-dark-700/30 to-dark-700/10 border-dark-500/30"
                  : "from-blue-500/15 to-blue-500/5 border-blue-500/30"
                : "border-dark-800/50 from-dark-900/40 to-dark-900/20 hover:from-dark-800/30 hover:to-dark-800/10"
            }`}
          >
            <div className={`text-lg font-bold ${cat.color}`}>{cat.count}</div>
            <div className="text-xs text-dark-400">{cat.label}</div>
          </button>
        ))}
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-16 bg-dark-900/60 border border-dark-800/50 rounded-2xl">
          <Users className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">
            {users.length === 0 ? "No users yet" : "No matching users"}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user) => {
            const isExpanded = expandedUser === user.id;
            const tier = getUserTier(user);
            const orderCount = user._count?.orders ?? 0;
            const reviewCount = user._count?.reviews ?? 0;
            const addressCount = user._count?.savedAddresses ?? 0;

            return (
              <div
                key={user.id}
                id={`user-${user.id}`}
                className={`bg-gradient-to-r ${tierGradients[tier]} border border-dark-800/50 border-l-4 ${tierBorders[tier]} rounded-2xl overflow-hidden transition-all`}
              >
                <button
                  onClick={() => toggleExpand(user.id)}
                  className="w-full px-4 sm:px-6 py-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors text-left"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gradient-to-br ${tierGradients[tier]} border border-dark-700/50`}>
                    <span className={`text-sm font-bold ${tierColors[tier]}`}>
                      {user.name?.charAt(0)?.toUpperCase() || "?"}
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-3">
                      <span className="text-white font-medium text-sm truncate">
                        {user.name}
                      </span>
                      {orderCount > 0 && (
                        <span
                          className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit"
                          style={{
                            backgroundColor: "rgba(212, 175, 55, 0.15)",
                            color: "#d4af37",
                          }}
                        >
                          {orderCount} order{orderCount !== 1 ? "s" : ""}
                        </span>
                      )}
                      {orderCount === 0 && (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold w-fit bg-dark-700/50 text-dark-400">
                          No orders
                        </span>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 mt-1">
                      <span className="text-dark-300 text-sm truncate flex items-center gap-1.5">
                        <Mail className="w-3 h-3 text-dark-500 shrink-0" />
                        {user.email}
                      </span>
                      {user.phone && (
                        <>
                          <span className="text-dark-500 text-sm hidden sm:block">&middot;</span>
                          <span className="text-dark-500 text-sm truncate hidden sm:block flex items-center gap-1.5">
                            <Phone className="w-3 h-3 text-dark-500 shrink-0" />
                            {user.phone}
                          </span>
                        </>
                      )}
                      <span className="text-dark-500 text-sm hidden sm:block">&middot;</span>
                      <span className="text-dark-500 text-sm hidden sm:block">
                        {new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 hidden sm:block">
                    <div className="text-sm text-dark-400">
                      {reviewCount} review{reviewCount !== 1 ? "s" : ""}
                    </div>
                    <div className="text-white font-semibold">
                      {addressCount} addr{addressCount !== 1 ? "s" : ""}
                    </div>
                  </div>

                  <div
                    onClick={(e) => { e.stopPropagation(); if (user.email) openEmailModal(user); }}
                    className={`shrink-0 p-2 rounded-lg transition-colors ${user.email ? "text-dark-400 hover:text-gold-400 hover:bg-dark-800 cursor-pointer" : "text-dark-700 cursor-not-allowed"}`}
                    title={user.email ? `Email ${user.name}` : "No email"}
                  >
                    <Send className="w-4 h-4" />
                  </div>

                  <button onClick={(e) => { e.stopPropagation(); handleAccess(user.id, user.role); }} className="shrink-0 p-2 rounded-lg text-purple-400 hover:text-purple-300 hover:bg-dark-800 transition-colors" title="Access Account">
                    <LogIn className="w-4 h-4" />
                  </button>

                  {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-dark-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-dark-400 shrink-0" />
                  )}
                </button>

                {isExpanded && (
                  <div className="px-4 sm:px-6 pb-6 space-y-5 border-t border-dark-800/30 pt-5">
                    {detailLoading === user.id ? (
                      <div className="flex items-center justify-center py-8 gap-2">
                        <Loader2 className="w-5 h-5 text-gold-400 animate-spin" />
                        <span className="text-sm text-dark-400">Loading details...</span>
                      </div>
                    ) : detailCache[user.id] ? (() => {
                      const d = detailCache[user.id];
                      return (
                        <>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                              <div className="flex items-center justify-between">
                                <h4 className="text-xs text-blue-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                  <Mail className="w-3.5 h-3.5" /> Contact Info
                                </h4>
                                {d.email && (
                                  <button
                                    onClick={(e) => { e.stopPropagation(); openEmailModal(d); }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gold-500/10 border border-gold-500/20 text-gold-400 text-[10px] font-semibold uppercase tracking-wider hover:bg-gold-500/20 transition-colors"
                                  >
                                    <Send className="w-3 h-3" /> Send Email
                                  </button>
                                )}
                              </div>
                              <div className="space-y-2">
                                <p className="text-white text-sm font-medium">{d.name}</p>
                                <div className="flex items-center gap-2 text-dark-300 text-xs">
                                  <Mail className="w-3.5 h-3.5 text-blue-400" />
                                  {d.email}
                                </div>
                                <div className="flex items-center gap-2 text-dark-300 text-xs">
                                  <Phone className="w-3.5 h-3.5 text-green-400" />
                                  {d.phone || "Not provided"}
                                </div>
                                <p className="text-[10px] text-dark-500">
                                  Joined {new Date(d.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                                </p>
                              </div>
                            </div>

                            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-3">
                              <h4 className="text-xs text-green-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" /> Activity
                              </h4>
                              <div className="grid grid-cols-2 gap-3">
                                <div className="text-center">
                                  <p className="text-lg font-bold text-gold-400">{d.orders?.length || 0}</p>
                                  <p className="text-[10px] text-dark-500">Orders</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-green-400">{formatPrice(d.totalSpent || 0)}</p>
                                  <p className="text-[10px] text-dark-500">Spent</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-purple-400">{d.reviews?.length || 0}</p>
                                  <p className="text-[10px] text-dark-500">Reviews</p>
                                </div>
                                <div className="text-center">
                                  <p className="text-lg font-bold text-blue-400">{d.savedAddresses?.length || 0}</p>
                                  <p className="text-[10px] text-dark-500">Addresses</p>
                                </div>
                              </div>
                            </div>
                          </div>

                          {d.orders?.length > 0 && (
                            <div className="bg-gradient-to-br from-gold-500/10 to-gold-500/5 border border-gold-500/20 rounded-xl p-4 space-y-3">
                              <h4 className="text-xs text-gold-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Package className="w-3.5 h-3.5" /> Recent Orders
                              </h4>
                              <div className="space-y-2">
                                {d.orders.slice(0, 5).map((order: any) => (
                                  <div
                                    key={order.id}
                                    onClick={() => onNavigate("orders", order.id)}
                                    className="flex items-center gap-3 p-2 rounded-lg bg-dark-900/30 cursor-pointer hover:bg-dark-800/40 transition-colors group"
                                  >
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-2">
                                        <p className="text-xs text-dark-500 font-mono group-hover:text-gold-400 transition-colors">#{order.id?.slice(0, 8)}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[order.status] || ""}`}>
                                          {order.status}
                                        </span>
                                      </div>
                                      <p className="text-xs text-dark-400 mt-0.5">
                                        {order.items?.map((i: any) => i.name).join(", ")}
                                      </p>
                                    </div>
                                    <span className="text-sm text-white font-medium shrink-0">{formatPrice(order.totalAmount)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {d.reviews?.length > 0 && (
                            <div className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border border-purple-500/20 rounded-xl p-4 space-y-3">
                              <h4 className="text-xs text-purple-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <Star className="w-3.5 h-3.5" /> Reviews
                              </h4>
                              <div className="space-y-2">
                                {d.reviews.slice(0, 3).map((review: any) => (
                                  <div key={review.id} className="flex items-start gap-3 p-2 rounded-lg bg-dark-900/30">
                                    <div className="flex items-center gap-0.5 shrink-0 mt-0.5">
                                      {[1, 2, 3, 4, 5].map((i) => (
                                        <Star key={i} className={`w-3 h-3 ${i <= review.rating ? "fill-gold-400 text-gold-400" : "text-dark-700"}`} />
                                      ))}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs text-white">{review.product?.name}</p>
                                      {review.comment && <p className="text-[10px] text-dark-400 line-clamp-1">{review.comment}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {d.savedAddresses?.length > 0 && (
                            <div className="bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/20 rounded-xl p-4 space-y-3">
                              <h4 className="text-xs text-green-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5" /> Saved Addresses
                              </h4>
                              <div className="space-y-2">
                                {d.savedAddresses.map((addr: any) => (
                                  <div key={addr.id} className="p-2 rounded-lg bg-dark-900/30">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs text-white font-medium">{addr.label}</p>
                                      {addr.isDefault && <span className="px-1.5 py-0.5 rounded text-[9px] bg-gold-500/10 text-gold-400 border border-gold-500/20">Default</span>}
                                    </div>
                                    <p className="text-[10px] text-dark-400 mt-0.5">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {d.messages?.length > 0 && (
                            <div className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border border-blue-500/20 rounded-xl p-4 space-y-3">
                              <h4 className="text-xs text-blue-400 uppercase tracking-wider font-semibold flex items-center gap-2">
                                <MessageSquare className="w-3.5 h-3.5" /> Messages
                              </h4>
                              <div className="space-y-2">
                                {d.messages.slice(0, 3).map((msg: any) => (
                                  <div key={msg.id} className="p-2 rounded-lg bg-dark-900/30">
                                    <div className="flex items-center gap-2">
                                      <p className="text-xs text-white font-medium">{msg.subject}</p>
                                      <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${msgStatusColors[msg.status] || ""}`}>{msg.status}</span>
                                    </div>
                                    <p className="text-[10px] text-dark-400 line-clamp-1 mt-0.5">{msg.message}</p>
                                    {msg.replyMessage && <p className="text-[10px] text-green-400/70 line-clamp-1 mt-0.5">Reply: {msg.replyMessage}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })() : (
                      <p className="text-center text-dark-500 text-sm py-4">No details loaded</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {emailModalUser && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => !emailSending && setEmailModalUser(null)}>
          <div className="bg-dark-900 border border-dark-700/50 rounded-2xl w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-dark-800/50">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <Send className="w-4 h-4 text-gold-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold text-sm">Send Email</h3>
                  <p className="text-dark-400 text-xs">To {emailModalUser.name}</p>
                </div>
              </div>
              <button onClick={() => !emailSending && setEmailModalUser(null)} className="text-dark-400 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {emailSent ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7 text-green-400" />
                </div>
                <p className="text-white font-semibold">Email Sent!</p>
                <p className="text-dark-400 text-sm mt-1">Message delivered to {emailModalUser.email}</p>
              </div>
            ) : (
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-dark-400 uppercase tracking-wider mb-1.5 block">To</label>
                  <div className="flex items-center gap-2 px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl">
                    <Mail className="w-3.5 h-3.5 text-dark-500" />
                    <span className="text-white text-sm">{emailModalUser.email}</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dark-400 uppercase tracking-wider mb-1.5 block">Subject</label>
                  <input
                    type="text"
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                    placeholder="e.g. Exclusive offer for you"
                    className="w-full px-4 py-2.5 bg-dark-800/60 border border-dark-700/50 rounded-xl text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-gold-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 uppercase tracking-wider mb-1.5 block">Message</label>
                  <textarea
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={5}
                    placeholder="Write your message..."
                    className="w-full px-4 py-3 bg-dark-800/60 border border-dark-700/50 rounded-xl text-white text-sm placeholder:text-dark-500 focus:outline-none focus:border-gold-500/50 resize-none"
                  />
                </div>
                {emailError && <p className="text-red-400 text-sm">{emailError}</p>}
                <div className="flex gap-3 pt-1">
                  <button
                    onClick={handleSendEmail}
                    disabled={emailSending}
                    className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 transition-all disabled:opacity-50"
                  >
                    {emailSending ? <><Loader2 className="w-4 h-4 animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Email</>}
                  </button>
                  <button
                    onClick={() => setEmailModalUser(null)}
                    disabled={emailSending}
                    className="px-5 py-3 rounded-xl text-sm text-dark-400 hover:text-white border border-dark-700 hover:border-dark-500 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
