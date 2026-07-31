"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { User, Mail, Phone, Calendar, MapPin, Package, Edit3, Save, X, Plus, Trash2, ChevronRight, Shield, Clock } from "lucide-react";

interface Order {
  id: string;
  items: any;
  totalAmount: number;
  status: string;
  paymentMethod: string;
  paymentStatus?: string;
  createdAt: string;
  shippingName: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
}

interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

const statusColors: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  confirmed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  delivered: "text-green-400 bg-green-500/10 border-green-500/20",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function AccountPage() {
  const { user, updateUser } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<SavedAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"profile" | "orders" | "addresses">("profile");
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addrForm, setAddrForm] = useState({ label: "", name: "", phone: "", address: "", city: "", state: "", pincode: "" });
  const [savingAddr, setSavingAddr] = useState(false);
  const [deletingAddr, setDeletingAddr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push("/login");
      return;
    }
    setNameValue(user.name);
    loadData();
  }, [user, router]);

  const loadData = async () => {
    try {
      const [ordersRes, addrsRes] = await Promise.all([
        apiFetch("/orders"),
        apiFetch("/addresses"),
      ]);
      setOrders(ordersRes);
      setAddresses(addrsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const saveName = async () => {
    if (!nameValue.trim() || nameValue.trim().length < 2) return;
    setSavingName(true);
    try {
      await updateUser({ name: nameValue.trim() });
      setEditingName(false);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingName(false);
    }
  };

  const addAddress = async () => {
    if (!addrForm.name || !addrForm.address || !addrForm.city || !addrForm.state || !addrForm.pincode || !addrForm.phone) return;
    setSavingAddr(true);
    try {
      await apiFetch("/addresses", { method: "POST", body: JSON.stringify({ ...addrForm, isDefault: addresses.length === 0 }) });
      setAddrForm({ label: "", name: "", phone: "", address: "", city: "", state: "", pincode: "" });
      setShowAddAddress(false);
      const res = await apiFetch("/addresses");
      setAddresses(res);
    } catch (err: any) {
      console.error(err);
    } finally {
      setSavingAddr(false);
    }
  };

  const deleteAddress = async (id: string) => {
    setDeletingAddr(id);
    try {
      await apiFetch(`/addresses/${id}`, { method: "DELETE" });
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch (err: any) {
      console.error(err);
    } finally {
      setDeletingAddr(null);
    }
  };

  if (!user) return null;

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  return (
    <div className="min-h-screen pt-28 pb-16 px-6 page-transition">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">My Account</span>
          <h1 className="text-4xl font-display font-bold text-white mt-2">Profile</h1>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar */}
          <div className="w-full md:w-64 flex-shrink-0">
            <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6 text-center mb-4">
              <div className="w-20 h-20 rounded-full bg-gold-500/10 border-2 border-gold-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-gold-400 font-display font-bold text-2xl">{user.name.charAt(0).toUpperCase()}</span>
              </div>
              <h3 className="text-white font-semibold">{user.name}</h3>
              <p className="text-dark-400 text-sm mt-1">{user.email || user.phone || ""}</p>
            </div>

            <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl overflow-hidden">
              {[
                { key: "profile", label: "Profile Details", icon: User },
                { key: "orders", label: "My Orders", icon: Package },
                { key: "addresses", label: "Saved Addresses", icon: MapPin },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-3 w-full px-5 py-3.5 text-sm font-medium transition-colors ${activeTab === tab.key ? "text-gold-400 bg-gold-500/5 border-l-2 border-gold-500" : "text-dark-400 hover:text-white hover:bg-dark-800/50"}`}
                >
                  <tab.icon size={16} />
                  {tab.label}
                  {tab.key === "orders" && orders.length > 0 && (
                    <span className="ml-auto text-[10px] bg-dark-800 text-dark-400 px-2 py-0.5 rounded-full">{orders.length}</span>
                  )}
                  {tab.key === "addresses" && addresses.length > 0 && (
                    <span className="ml-auto text-[10px] bg-dark-800 text-dark-400 px-2 py-0.5 rounded-full">{addresses.length}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {loading ? (
              <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-12 text-center">
                <div className="w-8 h-8 border-2 border-gold-500/30 border-t-gold-500 rounded-full animate-spin mx-auto" />
                <p className="text-dark-400 text-sm mt-4">Loading...</p>
              </div>
            ) : activeTab === "profile" ? (
              <div className="space-y-4">
                <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-display font-bold text-white">Personal Information</h2>
                    <Shield size={16} className="text-green-400" />
                  </div>

                  <div className="space-y-5">
                    <div className="flex items-center justify-between py-3 border-b border-dark-800/50">
                      <div className="flex items-center gap-3">
                        <User size={16} className="text-dark-500" />
                        <div>
                          <p className="text-[10px] text-dark-500 uppercase tracking-widest">Full Name</p>
                          {editingName ? (
                            <div className="flex items-center gap-2 mt-1">
                              <input type="text" value={nameValue} onChange={(e) => setNameValue(e.target.value)} className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:border-gold-500" autoFocus />
                              <button onClick={saveName} disabled={savingName} className="text-green-400 hover:text-green-300"><Save size={16} /></button>
                              <button onClick={() => { setEditingName(false); setNameValue(user.name); }} className="text-dark-500 hover:text-white"><X size={16} /></button>
                            </div>
                          ) : (
                            <p className="text-white text-sm font-medium">{user.name}</p>
                          )}
                        </div>
                      </div>
                      {!editingName && <button onClick={() => setEditingName(true)} className="text-dark-500 hover:text-gold-400 transition-colors"><Edit3 size={14} /></button>}
                    </div>

                    <div className="flex items-center gap-3 py-3 border-b border-dark-800/50">
                      <Mail size={16} className="text-dark-500" />
                      <div>
                        <p className="text-[10px] text-dark-500 uppercase tracking-widest">Email</p>
                        <p className="text-white text-sm font-medium">{user.email || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-3 border-b border-dark-800/50">
                      <Phone size={16} className="text-dark-500" />
                      <div>
                        <p className="text-[10px] text-dark-500 uppercase tracking-widest">Phone</p>
                        <p className="text-white text-sm font-medium">{user.phone || "Not provided"}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 py-3">
                      <Calendar size={16} className="text-dark-500" />
                      <div>
                        <p className="text-[10px] text-dark-500 uppercase tracking-widest">Member Since</p>
                        <p className="text-white text-sm font-medium">{user.createdAt ? formatDate(user.createdAt) : "N/A"}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-5">
                    <Package size={20} className="text-gold-400 mb-3" />
                    <p className="text-2xl font-bold text-white">{orders.length}</p>
                    <p className="text-dark-400 text-xs mt-1">Total Orders</p>
                  </div>
                  <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-5">
                    <MapPin size={20} className="text-gold-400 mb-3" />
                    <p className="text-2xl font-bold text-white">{addresses.length}</p>
                    <p className="text-dark-400 text-xs mt-1">Saved Addresses</p>
                  </div>
                </div>
              </div>
            ) : activeTab === "orders" ? (
              <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6">
                <h2 className="text-lg font-display font-bold text-white mb-6">Order History</h2>
                {orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package size={40} className="text-dark-700 mx-auto mb-4" />
                    <p className="text-dark-400">No orders yet</p>
                    <Link href="/products" className="text-gold-400 text-sm font-medium hover:text-gold-300 mt-2 inline-block">Start Shopping</Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-5 hover:border-dark-600 transition-colors">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="text-white text-sm font-medium">Order #{order.id.slice(-8).toUpperCase()}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Clock size={12} className="text-dark-500" />
                              <p className="text-dark-400 text-xs">{formatDate(order.createdAt)}</p>
                            </div>
                          </div>
                          <span className={`text-xs font-medium px-3 py-1 rounded-full border ${statusColors[order.status] || "text-dark-400 bg-dark-800 border-dark-700"}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-dark-400 text-xs">{Array.isArray(order.items) ? order.items.length : 0} item(s)</p>
                          <p className="text-gold-400 font-semibold">₹{order.totalAmount.toLocaleString("en-IN")}</p>
                        </div>
                        <div className="mt-3 pt-3 border-t border-dark-700/50 flex items-center justify-between">
                          <p className="text-dark-500 text-xs">{order.paymentMethod === "ONLINE" ? "Online Payment" : order.paymentMethod}{order.paymentStatus === "APPROVED" ? " · Paid" : order.paymentStatus === "PENDING" ? " · Pending" : ""}</p>
                          <Link href={`/orders`} className="text-gold-400 text-xs font-medium hover:text-gold-300 flex items-center gap-1">
                            View Details <ChevronRight size={12} />
                          </Link>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-display font-bold text-white">Saved Addresses</h2>
                  <button onClick={() => setShowAddAddress(!showAddAddress)} className="flex items-center gap-2 text-gold-400 text-sm font-medium hover:text-gold-300 transition-colors">
                    <Plus size={14} /> Add New
                  </button>
                </div>

                {showAddAddress && (
                  <div className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-5 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] text-dark-500 uppercase tracking-widest block mb-1.5">Label</label>
                        <input value={addrForm.label} onChange={(e) => setAddrForm({ ...addrForm, label: e.target.value })} placeholder="Home, Office..." className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-dark-500 uppercase tracking-widest block mb-1.5">Full Name</label>
                        <input value={addrForm.name} onChange={(e) => setAddrForm({ ...addrForm, name: e.target.value })} placeholder="Recipient name" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-dark-500 uppercase tracking-widest block mb-1.5">Phone</label>
                        <input value={addrForm.phone} onChange={(e) => setAddrForm({ ...addrForm, phone: e.target.value })} placeholder="10-digit number" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-dark-500 uppercase tracking-widest block mb-1.5">Pincode</label>
                        <input value={addrForm.pincode} onChange={(e) => setAddrForm({ ...addrForm, pincode: e.target.value })} placeholder="6-digit pincode" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500" />
                      </div>
                      <div className="col-span-2">
                        <label className="text-[10px] text-dark-500 uppercase tracking-widest block mb-1.5">Address</label>
                        <input value={addrForm.address} onChange={(e) => setAddrForm({ ...addrForm, address: e.target.value })} placeholder="Street address, apartment..." className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-dark-500 uppercase tracking-widest block mb-1.5">City</label>
                        <input value={addrForm.city} onChange={(e) => setAddrForm({ ...addrForm, city: e.target.value })} placeholder="City" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500" />
                      </div>
                      <div>
                        <label className="text-[10px] text-dark-500 uppercase tracking-widest block mb-1.5">State</label>
                        <input value={addrForm.state} onChange={(e) => setAddrForm({ ...addrForm, state: e.target.value })} placeholder="State" className="w-full bg-dark-900 border border-dark-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500" />
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <button onClick={addAddress} disabled={savingAddr} className="bg-gold-500 hover:bg-gold-400 text-dark-950 px-5 py-2 rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
                        {savingAddr ? "Saving..." : "Save Address"}
                      </button>
                      <button onClick={() => setShowAddAddress(false)} className="text-dark-400 hover:text-white text-sm transition-colors">Cancel</button>
                    </div>
                  </div>
                )}

                {addresses.length === 0 && !showAddAddress ? (
                  <div className="text-center py-12">
                    <MapPin size={40} className="text-dark-700 mx-auto mb-4" />
                    <p className="text-dark-400">No saved addresses</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {addresses.map((addr) => (
                      <div key={addr.id} className="bg-dark-800/50 border border-dark-700/50 rounded-xl p-5 flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gold-400 bg-gold-500/10 border border-gold-500/20 px-2.5 py-0.5 rounded-full">{addr.label || "Address"}</span>
                            {addr.isDefault && <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-white text-sm font-medium">{addr.name}</p>
                          <p className="text-dark-400 text-sm mt-1">{addr.address}</p>
                          <p className="text-dark-400 text-sm">{addr.city}, {addr.state} - {addr.pincode}</p>
                          <p className="text-dark-500 text-xs mt-1">{addr.phone}</p>
                        </div>
                        <button onClick={() => deleteAddress(addr.id)} disabled={deletingAddr === addr.id} className="text-dark-600 hover:text-red-400 transition-colors p-2">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
