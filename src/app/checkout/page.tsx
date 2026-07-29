"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth, SavedAddress } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Truck, Lock, ArrowLeft, Check, LogIn, UserPlus, MapPin, Plus, Trash2 } from "lucide-react";

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [orderData, setOrderData] = useState<any>(null);
  const [successStep, setSuccessStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>("new");
  const [saveAddress, setSaveAddress] = useState(true);
  const [addressLabel, setAddressLabel] = useState("Home");
  const [paymentMethod, setPaymentMethod] = useState("COD");

  const [shipping, setShipping] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  useEffect(() => {
    if (user) {
      const defaultAddr = user.savedAddresses?.find(a => a.isDefault);
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
        setShipping({ name: defaultAddr.name, phone: defaultAddr.phone, address: defaultAddr.address, city: defaultAddr.city, state: defaultAddr.state, pincode: defaultAddr.pincode });
      } else {
        setShipping(s => ({ ...s, name: user.name || "", phone: user.phone || "" }));
      }
      setSavedAddresses(user.savedAddresses || []);
    }
  }, [user]);

  const selectAddress = (addr: SavedAddress) => {
    setSelectedAddressId(addr.id);
    setShipping({ name: addr.name, phone: addr.phone, address: addr.address, city: addr.city, state: addr.state, pincode: addr.pincode });
  };

  const selectNew = () => {
    setSelectedAddressId("new");
    setShipping({ name: user?.name || "", phone: user?.phone || "", address: "", city: "", state: "", pincode: "" });
  };

  const deleteAddress = async (id: string) => {
    try {
      await apiFetch(`/addresses/${id}`, { method: "DELETE" });
      setSavedAddresses(prev => prev.filter(a => a.id !== id));
      if (selectedAddressId === id) selectNew();
    } catch {}
  };

  const shippingCost = totalPrice > 4999 ? 0 : 99;
  const tax = totalPrice * 0.18;
  const total = totalPrice + shippingCost + tax;

  if (!user) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-32 pb-24 text-center page-transition">
        <div className="w-24 h-24 bg-dark-900 border border-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <Lock size={36} className="text-dark-600" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-3">Sign In Required</h1>
        <p className="text-dark-400 mb-10 max-w-md mx-auto">Please sign in or create an account to proceed with checkout. Your data will be saved for future orders.</p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl font-semibold inline-flex items-center justify-center gap-2 transition-all hover:shadow-lg hover:shadow-gold-500/20">
            <LogIn size={18} /> Sign In
          </Link>
          <Link href="/register" className="border border-dark-700 text-dark-300 px-8 py-4 rounded-xl font-medium inline-flex items-center justify-center gap-2 hover:border-dark-600 hover:text-white transition-all">
            <UserPlus size={18} /> Create Account
          </Link>
        </div>
        <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-gold-400 transition-colors mt-8">
          <ArrowLeft size={14} /> Back to Cart
        </Link>
      </div>
    );
  }

  const handleShippingNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!shipping.phone) { setError("Phone number is required for delivery"); return; }
    if (!shipping.address || !shipping.city || !shipping.state || !shipping.pincode) { setError("Please fill all address fields"); return; }
    setStep(2);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      if (saveAddress && selectedAddressId === "new" && shipping.address && shipping.city) {
        try {
          const saved = await apiFetch("/addresses", {
            method: "POST",
            body: JSON.stringify({
              label: addressLabel,
              name: shipping.name,
              phone: shipping.phone,
              address: shipping.address,
              city: shipping.city,
              state: shipping.state,
              pincode: shipping.pincode,
              isDefault: savedAddresses.length === 0,
            }),
          });
          setSavedAddresses(prev => [saved, ...prev]);
        } catch {}
      }

      const orderItems = items.map(({ product, quantity }) => ({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity,
        image: product.images[0],
      }));
      const data = await apiFetch("/orders", {
        method: "POST",
        body: JSON.stringify({
          items: orderItems,
          totalAmount: total,
          shippingName: shipping.name,
          shippingPhone: shipping.phone,
          shippingAddress: shipping.address,
          shippingCity: shipping.city,
          shippingState: shipping.state,
          shippingPincode: shipping.pincode,
          paymentMethod,
        }),
      });
      setOrderData(data);
      clearCart();
      setOrderPlaced(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setTimeout(() => setSuccessStep(1), 300);
      setTimeout(() => setSuccessStep(2), 800);
      setTimeout(() => setSuccessStep(3), 1200);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (orderPlaced) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="animate-scale-in">
          <div className="w-24 h-24 mx-auto mb-8 relative">
            <div className={`absolute inset-0 rounded-full transition-all duration-500 ${successStep >= 1 ? "bg-green-500/10 border border-green-500/30 scale-100" : "bg-dark-800 scale-0"}`} />
            <div className={`absolute inset-0 flex items-center justify-center transition-all duration-500 ${successStep >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-0"}`}>
              <Check size={48} className="text-green-400" strokeWidth={2} />
            </div>
          </div>
          <div className={`transition-all duration-500 ${successStep >= 3 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <h1 className="text-4xl font-display font-bold text-white mb-3">Order Confirmed</h1>
            <p className="text-dark-400 mb-2">{paymentMethod === "UPI" ? "Pay via UPI at delivery." : "Pay on delivery."}</p>
            <p className="text-xs text-dark-600 mb-10">Order #{orderData?.id?.slice(-8) || "BT" + Date.now().toString().slice(-8)}</p>
            <div className="flex gap-4 justify-center">
              <Link href="/orders" className="bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-gold-500/20">
                View Orders
              </Link>
              <Link href="/products" className="border border-dark-700 text-dark-300 px-8 py-4 rounded-xl font-medium hover:border-dark-600 hover:text-white transition-all">
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="text-4xl font-display font-bold text-white mb-3">Cart is Empty</h1>
        <Link href="/products" className="text-gold-400 font-medium hover:text-gold-300 transition-colors">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 pt-32 pb-24">
      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm text-dark-500 hover:text-gold-400 transition-colors mb-8"><ArrowLeft size={14} /> Back to Cart</Link>
      <h1 className="text-4xl font-display font-bold text-white mb-10">Checkout</h1>

      <div className="flex items-center gap-4 mb-12">
        {["Details", "Review"].map((label, i) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${step > i + 1 ? "bg-green-500 text-white" : step === i + 1 ? "bg-gradient-to-br from-gold-400 to-gold-600 text-dark-950" : "bg-dark-800 text-dark-500 border border-dark-700"}`}>
              {step > i + 1 ? <Check size={14} /> : i + 1}
            </div>
            <span className={`text-sm font-medium ${step === i + 1 ? "text-white" : "text-dark-500"}`}>{label}</span>
            {i < 1 && <div className="w-12 h-px bg-dark-800 mx-2" />}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <form onSubmit={step === 1 ? handleShippingNext : handlePlaceOrder}>
            {step === 1 && (
              <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8 space-y-6">
                <h2 className="font-display text-xl font-bold text-white">Delivery Details</h2>
                {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

                {savedAddresses.length > 0 && (
                  <div className="space-y-3">
                    <label className="block text-xs text-dark-400 uppercase tracking-wider font-medium">Saved Addresses</label>
                    {savedAddresses.map(addr => (
                      <div key={addr.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer ${selectedAddressId === addr.id ? "bg-gold-500/5 border-gold-500/30" : "bg-dark-800/50 border-dark-700/50 hover:border-dark-600"}`} onClick={() => selectAddress(addr)}>
                        <div className="mt-0.5">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${selectedAddressId === addr.id ? "border-gold-500" : "border-dark-600"}`}>
                            {selectedAddressId === addr.id && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-semibold text-white">{addr.label}</span>
                            {addr.isDefault && <span className="text-[10px] bg-gold-500/10 text-gold-400 px-2 py-0.5 rounded-full">Default</span>}
                          </div>
                          <p className="text-xs text-dark-400">{addr.name} · {addr.phone}</p>
                          <p className="text-xs text-dark-400">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                        <button type="button" onClick={(e) => { e.stopPropagation(); deleteAddress(addr.id); }} className="text-dark-600 hover:text-red-400 transition-colors p-1">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={selectNew} className={`flex items-center gap-2 text-sm font-medium px-4 py-3 rounded-xl border w-full transition-all ${selectedAddressId === "new" ? "bg-gold-500/5 border-gold-500/30 text-gold-400" : "bg-dark-800/50 border-dark-700/50 text-dark-400 hover:border-dark-600 hover:text-white"}`}>
                      <Plus size={16} /> Use a different address
                    </button>
                  </div>
                )}

                {selectedAddressId === "new" && (
                  <div className="space-y-5">
                    <div>
                      <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Full Name</label>
                      <input type="text" value={shipping.name} onChange={(e) => setShipping({ ...shipping, name: e.target.value })} placeholder="John Doe" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Phone Number *</label>
                      <input type="tel" value={shipping.phone} onChange={(e) => setShipping({ ...shipping, phone: e.target.value })} placeholder="9351396757" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                      {!user.phone && <p className="text-xs text-dark-500 mt-1.5">Required for delivery calls</p>}
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Address</label>
                      <input type="text" value={shipping.address} onChange={(e) => setShipping({ ...shipping, address: e.target.value })} placeholder="House No, Street, Locality" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">City</label>
                        <input type="text" value={shipping.city} onChange={(e) => setShipping({ ...shipping, city: e.target.value })} placeholder="Alwar" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">State</label>
                        <input type="text" value={shipping.state} onChange={(e) => setShipping({ ...shipping, state: e.target.value })} placeholder="Rajasthan" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Pincode</label>
                        <input type="text" value={shipping.pincode} onChange={(e) => setShipping({ ...shipping, pincode: e.target.value })} placeholder="301001" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                      </div>
                    </div>
                    <div className="flex items-center gap-4 pt-2">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="w-4 h-4 rounded border-dark-600 bg-dark-800 text-gold-500 focus:ring-gold-500" />
                        <span className="text-sm text-dark-300">Save this address</span>
                      </label>
                      {saveAddress && (
                        <select value={addressLabel} onChange={(e) => setAddressLabel(e.target.value)} className="bg-dark-800 border border-dark-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-gold-500">
                          <option value="Home">Home</option>
                          <option value="Office">Office</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                    </div>
                  </div>
                )}

                <button type="submit" className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20">
                  Review Order
                </button>
              </div>
            )}

            {step === 2 && (
              <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8 space-y-6">
                <h2 className="font-display text-xl font-bold text-white">Review</h2>
                {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
                <div className="space-y-4">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4 py-3 border-b border-dark-800/50">
                      <img src={product.images[0]} alt={product.name} className="w-14 h-14 rounded-lg object-cover" />
                      <div className="flex-1"><p className="font-medium text-white text-sm">{product.name}</p><p className="text-xs text-dark-500">Qty: {quantity}</p></div>
                      <span className="font-semibold text-white text-sm">{formatPrice(product.price * quantity)}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-dark-800/50 rounded-xl p-4 text-sm space-y-2">
                  <div className="flex justify-between"><span className="text-dark-400">Subtotal</span><span className="text-white">{formatPrice(totalPrice)}</span></div>
                  <div className="flex justify-between"><span className="text-dark-400">Shipping</span><span className="text-white">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span></div>
                  <div className="flex justify-between"><span className="text-dark-400">Tax (18% GST)</span><span className="text-white">{formatPrice(tax)}</span></div>
                  <div className="border-t border-dark-700 pt-2 flex justify-between font-bold text-lg"><span className="text-white">Total</span><span className="text-white">{formatPrice(total)}</span></div>
                </div>
                <div className="bg-dark-800/50 rounded-xl p-4 text-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-dark-400">Shipping to:</p>
                    <button type="button" onClick={() => setStep(1)} className="text-gold-400 text-xs hover:text-gold-300">Change</button>
                  </div>
                  <p className="text-white">{shipping.name}, {shipping.address}</p>
                  <p className="text-white">{shipping.city}, {shipping.state} - {shipping.pincode}</p>
                  <p className="text-dark-500 mt-1">Phone: {shipping.phone}</p>
                </div>
                <div className="space-y-3">
                  <p className="text-xs text-dark-400 uppercase tracking-wider font-medium">Payment Method</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setPaymentMethod("COD")} className={`p-4 rounded-xl border text-left transition-all ${paymentMethod === "COD" ? "bg-gold-500/10 border-gold-500/30" : "bg-dark-800/50 border-dark-700/50 hover:border-dark-600"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "COD" ? "border-gold-500" : "border-dark-600"}`}>
                          {paymentMethod === "COD" && <div className="w-2 h-2 rounded-full bg-gold-500" />}
                        </div>
                        <span className="text-sm font-medium text-white">Cash on Delivery</span>
                      </div>
                      <p className="text-xs text-dark-400 ml-6">Pay with cash when delivered</p>
                    </button>
                    <button type="button" onClick={() => setPaymentMethod("UPI")} className={`p-4 rounded-xl border text-left transition-all ${paymentMethod === "UPI" ? "bg-purple-500/10 border-purple-500/30" : "bg-dark-800/50 border-dark-700/50 hover:border-dark-600"}`}>
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${paymentMethod === "UPI" ? "border-purple-500" : "border-dark-600"}`}>
                          {paymentMethod === "UPI" && <div className="w-2 h-2 rounded-full bg-purple-500" />}
                        </div>
                        <span className="text-sm font-medium text-white">UPI on Delivery</span>
                      </div>
                      <p className="text-xs text-dark-400 ml-6">Pay via UPI at your doorstep</p>
                    </button>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-xs text-dark-500">
                  <Lock size={13} className="text-green-500/60" /> Your data is encrypted and secure
                </div>
                <div className="flex gap-4">
                  <button type="button" onClick={() => setStep(1)} className="border border-dark-700 text-dark-300 px-6 py-4 rounded-xl font-medium hover:border-dark-600 hover:text-white transition-all">Back</button>
                  <button type="submit" disabled={loading} className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20 flex items-center gap-2 disabled:opacity-50">
                    {loading ? "Placing Order..." : <><Lock size={16} /> Place Order — {formatPrice(total)}</>}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6 sticky top-28">
            <h3 className="font-display font-bold text-white mb-4">Order Summary</h3>
            <div className="space-y-3 text-sm mb-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex justify-between">
                  <span className="text-dark-400 truncate mr-2">{product.name} × {quantity}</span>
                  <span className="font-medium text-white shrink-0">{formatPrice(product.price * quantity)}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-dark-800 pt-3 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-dark-400">Subtotal</span><span className="text-white">{formatPrice(totalPrice)}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Shipping</span><span className="text-white">{shippingCost === 0 ? "Free" : formatPrice(shippingCost)}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Tax (18% GST)</span><span className="text-white">{formatPrice(tax)}</span></div>
              <div className="border-t border-dark-800 pt-2 flex justify-between font-bold"><span className="text-white">Total</span><span className="text-white">{formatPrice(total)}</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
