"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { ArrowLeft, Package, MapPin, Phone, Mail, ShoppingBag, ShieldCheck, Send, XCircle } from "lucide-react";
import Link from "next/link";
import ConfirmModal from "@/components/ConfirmModal";

export default function DeliveryOrderDetail() {
  return <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>}><DeliveryOrderDetailInner /></Suspense>;
}

function DeliveryOrderDetailInner() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get("id");
  const [order, setOrder] = useState<any>(null);
  const [fetching, setFetching] = useState(true);
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "DELIVERY") { router.push("/"); return; }
    if (!id) return;
    apiFetch(`/delivery/orders/${id}`).then(data => { setOrder(data); if (data.deliveryCode === "SENT") setCodeSent(true); }).catch(() => router.push("/delivery")).finally(() => setFetching(false));
  }, [user, loading, router, id]);

  const handleSendCode = async () => {
    setSendingCode(true); setError(""); setMessage("");
    try {
      await apiFetch(`/delivery/orders/${id}/send-code`, { method: "POST" });
      setCodeSent(true);
      setMessage("Verification code sent to customer's email!");
    } catch (e: any) { setError(e.message || "Failed to send code"); }
    finally { setSendingCode(false); }
  };

  const handleVerifyCode = async () => {
    setVerifying(true); setError(""); setMessage("");
    try {
      await apiFetch(`/delivery/orders/${id}/verify-code`, { method: "POST", body: JSON.stringify({ code }), headers: { "Content-Type": "application/json" } });
      setMessage("Order delivered successfully!");
      setCode("");
      setOrder((prev: any) => ({ ...prev, status: "delivered" }));
    } catch (e: any) { setError(e.message || "Invalid code"); }
    finally { setVerifying(false); }
  };

  const handleCancelDelivery = async () => {
    setCancelling(true); setError(""); setMessage("");
    try {
      await apiFetch(`/delivery/orders/${id}/cancel-delivery`, { method: "POST" });
      setShowCancelModal(false);
      setMessage("Delivery cancelled! Redirecting...");
      setTimeout(() => router.push("/delivery"), 1500);
    } catch (e: any) { setError(e.message || "Failed to cancel delivery"); }
    finally { setCancelling(false); }
  };

  if (loading || fetching) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>;
  if (!user || !order) return null;

  return (
    <div className="min-h-screen bg-dark-950 page-transition">
      <div className="max-w-3xl mx-auto px-6 pt-28 pb-24">
        <Link href="/delivery" className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors mb-8"><ArrowLeft size={16} /> Back to Dashboard</Link>

        <div className="flex items-center gap-3 mb-8">
          <Package size={24} className="text-gold-400" />
          <div>
            <p className="text-xs text-dark-400 font-medium">ORDER #{order.id.slice(-8).toUpperCase()}</p>
            <p className="text-2xl font-display font-bold text-white">Delivery Details</p>
          </div>
          <span className={`ml-auto px-4 py-1.5 rounded-full text-xs font-semibold border ${order.status === "delivered" ? "text-green-400 bg-green-500/10 border-green-500/20" : order.status === "out_for_delivery" ? "text-orange-400 bg-orange-500/10 border-orange-500/20" : order.status === "shipped" ? "text-purple-400 bg-purple-500/10 border-purple-500/20" : "text-blue-400 bg-blue-500/10 border-blue-500/20"}`}>{order.status === "out_for_delivery" ? "OUT FOR DELIVERY" : order.status.toUpperCase()}</span>
        </div>

        <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6 space-y-6">
          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><MapPin size={16} className="text-gold-400" /> Shipping Address</h2>
            <div className="bg-dark-950/60 border border-dark-800/50 rounded-xl p-4 text-sm">
              <p className="text-white font-medium">{order.shippingName}</p>
              <p className="text-dark-400 mt-1">{order.shippingAddress}</p>
              <p className="text-dark-400">{order.shippingCity}, {order.shippingState} — {order.shippingZip}</p>
              <p className="text-dark-400">{order.shippingCountry}</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-1 bg-dark-950/60 border border-dark-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-dark-400 text-xs mb-1"><Phone size={12} /> Phone</div>
              <p className="text-white text-sm">{order.phone || "N/A"}</p>
            </div>
            <div className="flex-1 bg-dark-950/60 border border-dark-800/50 rounded-xl p-4">
              <div className="flex items-center gap-2 text-dark-400 text-xs mb-1"><Mail size={12} /> Email</div>
              <p className="text-white text-sm">{order.email || "N/A"}</p>
            </div>
          </div>

          <div>
            <h2 className="text-white font-semibold mb-3 flex items-center gap-2"><ShoppingBag size={16} className="text-gold-400" /> Items ({order.items?.length || 0})</h2>
            <div className="space-y-2">{(order.items || []).map((item: any, idx: number) => (
              <div key={idx} className="bg-dark-950/60 border border-dark-800/50 rounded-xl p-3 flex items-center gap-3">
                {item.image && <img src={item.image} alt="" className="w-12 h-12 rounded-lg object-cover bg-dark-800" />}
                <div className="flex-1 min-w-0"><p className="text-white text-sm font-medium truncate">{item.name}</p><p className="text-dark-400 text-xs">Qty: {item.quantity} — ₹{item.price?.toLocaleString("en-IN")}</p></div>
              </div>
            ))}</div>
          </div>

          {order.status !== "delivered" && order.status !== "cancelled" && (
            <div>
              <h2 className="text-white font-semibold mb-4 flex items-center gap-2"><ShieldCheck size={16} className="text-gold-400" /> Delivery Verification</h2>
              {!codeSent ? (
                <div>
                  <p className="text-dark-400 text-sm mb-4">Send a verification code to the customer&apos;s email. The customer will share this code with you.</p>
                  <button onClick={handleSendCode} disabled={sendingCode} className="w-full bg-gold-500 hover:bg-gold-400 text-dark-950 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {sendingCode ? "Sending..." : <><Send size={16} /> Send Verification Code</>}
                  </button>
                </div>
              ) : (
                <div>
                  <p className="text-dark-400 text-sm mb-4">Ask the customer for the 6-digit code sent to their email.</p>
                  <div className="flex gap-2 mb-3">
                    <input type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="Enter 6-digit code" maxLength={6} className="flex-1 bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-white text-center text-2xl tracking-[8px] font-mono focus:outline-none focus:border-gold-500 transition-colors" />
                  </div>
                  <button onClick={handleVerifyCode} disabled={verifying || code.length !== 6} className="w-full bg-green-500 hover:bg-green-400 text-white py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                    {verifying ? "Verifying..." : <><ShieldCheck size={16} /> Verify & Mark Delivered</>}
                  </button>
                </div>
              )}
              <div className="mt-4 pt-4 border-t border-dark-800/50">
                <button onClick={() => setShowCancelModal(true)} disabled={cancelling} className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {cancelling ? "Cancelling..." : <><XCircle size={16} /> Cancel Delivery — Return to Pool</>}
                </button>
              </div>
              {error && <p className="text-red-400 text-sm mt-3 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
              {message && <p className="text-green-400 text-sm mt-3 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">{message}</p>}
            </div>
          )}

          {order.status === "delivered" && (
            <div className="text-center py-4">
              <p className="text-green-400 text-sm font-medium">This order has been delivered.</p>
            </div>
          )}
        </div>
      </div>
      <ConfirmModal
        open={showCancelModal}
        title="Cancel Delivery?"
        message="This order will be returned to the unassigned pool and another executive can pick it up."
        confirmLabel="Yes, Cancel Delivery"
        variant="danger"
        loading={cancelling}
        onConfirm={handleCancelDelivery}
        onCancel={() => setShowCancelModal(false)}
      />
    </div>
  );
}
