"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Store, Plus, Package, Edit2, Trash2, LogOut, Clock } from "lucide-react";

export default function SellerDashboard() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (loading) return;
    if (!user) { router.push("/login"); return; }
    if (user.role !== "SELLER") { router.push("/"); return; }
    if (!user.approved) { setFetching(false); return; }
    apiFetch("/seller/products").then(setProducts).catch(() => {}).finally(() => setFetching(false));
  }, [user, loading, router]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    try { await apiFetch(`/seller/products/${id}`, { method: "DELETE" }); setProducts(prev => prev.filter(p => p.id !== id)); } catch {}
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="w-10 h-10 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>;
  if (!user) return null;

  if (!user.approved) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12 page-transition">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-yellow-500/10 border border-yellow-500/20 rounded-full flex items-center justify-center mx-auto mb-6"><Clock size={36} className="text-yellow-400" /></div>
          <h1 className="text-2xl font-bold text-white mb-2">Awaiting Approval</h1>
          <p className="text-dark-400 text-sm mb-8">Your seller account is pending approval from the owner. You will be notified once approved.</p>
          <button onClick={logout} className="text-dark-400 hover:text-white text-sm flex items-center gap-2 mx-auto"><LogOut size={16} /> Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dark-950 page-transition">
      <div className="max-w-6xl mx-auto px-6 pt-28 pb-24">
        <div className="flex items-center justify-between mb-10">
          <div>
            <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Seller Dashboard</span>
            <h1 className="text-3xl font-display font-bold text-white mt-1">My Products</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/seller/add-product" className="bg-gold-500 hover:bg-gold-400 text-dark-950 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2"><Plus size={16} /> Add Product</Link>
            <button onClick={logout} className="text-dark-400 hover:text-white text-sm transition-colors"><LogOut size={18} /></button>
          </div>
        </div>

        {fetching ? (
          <div className="flex items-center justify-center py-20"><div className="w-8 h-8 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" /></div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-dark-900/60 border border-dark-800/50 rounded-2xl">
            <Package className="w-12 h-12 text-dark-600 mx-auto mb-3" />
            <p className="text-dark-400 text-sm mb-4">No products yet</p>
            <Link href="/seller/add-product" className="text-gold-400 font-medium text-sm hover:text-gold-300 transition-colors">Add your first product</Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {products.map(product => (
              <div key={product.id} className="bg-dark-900/60 border border-dark-800/50 rounded-xl p-5 flex items-center gap-4 hover:border-dark-700 transition-colors">
                {product.images?.[0] && <img src={product.images[0]} alt={product.name} className="w-16 h-16 rounded-xl object-cover bg-dark-800 shrink-0" />}
                <div className="flex-1 min-w-0">
                  <p className="text-white font-medium truncate">{product.name}</p>
                  <p className="text-dark-400 text-xs mt-0.5">{product.brand} — {product.category}</p>
                  <p className="text-gold-400 text-sm font-semibold mt-1">₹{product.price}{product.originalPrice ? <span className="text-dark-500 text-xs line-through ml-2">₹{product.originalPrice}</span> : null}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link href={`/seller/edit-product?id=${product.id}`} className="p-2 rounded-lg text-dark-400 hover:text-gold-400 hover:bg-dark-800 transition-all"><Edit2 size={16} /></Link>
                  <button onClick={() => handleDelete(product.id)} className="p-2 rounded-lg text-dark-400 hover:text-red-400 hover:bg-dark-800 transition-all"><Trash2 size={16} /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
