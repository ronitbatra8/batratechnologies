"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import SellerImageUpload from "@/components/SellerImageUpload";
import { ArrowLeft, Plus } from "lucide-react";

const CATEGORIES = ["smartphones", "wearables", "audio", "accessories"];

export default function AddProduct() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: "", brand: "", category: "smartphones", price: "", originalPrice: "", description: "", features: "", images: "", inStock: true, badge: "" });
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user || user.role !== "SELLER" || !user.approved) { router.push("/seller"); return; }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      await apiFetch("/seller/products", {
        method: "POST",
        body: JSON.stringify({
          name: form.name, brand: form.brand, category: form.category, price: parseFloat(form.price),
          originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : null, description: form.description,
          features: form.features.split("\n").filter(Boolean), images: form.images.split("\n").filter(Boolean),
          inStock: form.inStock, badge: form.badge || null,
        }),
      });
      router.push("/seller");
    } catch (err: any) { setError(err.message); }
    setSaving(false);
  };

  return (
    <div className="min-h-screen bg-dark-950 page-transition">
      <div className="max-w-2xl mx-auto px-6 pt-28 pb-24">
        <Link href="/seller" className="inline-flex items-center gap-2 text-dark-400 hover:text-white text-sm mb-6 transition-colors"><ArrowLeft size={16} /> Back to Products</Link>
        <h1 className="text-3xl font-display font-bold text-white mb-8">Add Product</h1>

        <form onSubmit={handleSubmit} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8 space-y-5">
          {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}

          <div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Name</label><input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors" /></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Brand</label><input value={form.brand} onChange={e => setForm({...form, brand: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors" /></div><div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Category</label><select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors">{CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}</select></div></div>
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Price</label><input type="number" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors" /></div><div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Original Price</label><input type="number" value={form.originalPrice} onChange={e => setForm({...form, originalPrice: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors" /></div></div>
          <div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Description</label><textarea value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows={3} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors resize-none" /></div>
          <div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Features (one per line)</label><textarea value={form.features} onChange={e => setForm({...form, features: e.target.value})} rows={3} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors resize-none" /></div>
          <SellerImageUpload value={form.images} onChange={v => setForm({ ...form, images: v })} />
          <div className="grid grid-cols-2 gap-4"><div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Badge</label><input value={form.badge} onChange={e => setForm({...form, badge: e.target.value})} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors" /></div><div><label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">In Stock</label><select value={form.inStock ? "yes" : "no"} onChange={e => setForm({...form, inStock: e.target.value === "yes"})} className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors"><option value="yes">Yes</option><option value="no">No</option></select></div></div>

          <button type="submit" disabled={saving} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 py-4 rounded-xl font-semibold transition-all disabled:opacity-50 flex items-center justify-center gap-2"><Plus size={16} /> {saving ? "Adding..." : "Add Product"}</button>
        </form>
      </div>
    </div>
  );
}
