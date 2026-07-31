"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { formatPrice } from "@/lib/utils";
import { Heart, ShoppingCart, Trash2, ArrowRight } from "lucide-react";
import { useCart } from "@/context/CartContext";

interface WishlistItem {
  id: string;
  productId: string;
  createdAt: string;
  product: {
    id: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    images: string[];
    category: string;
    inStock: boolean;
  };
}

export default function WishlistPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { addToCart } = useCart();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      apiFetch("/wishlist")
        .then((data) => { if (Array.isArray(data)) setItems(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  const removeItem = async (productId: string) => {
    try {
      await apiFetch(`/wishlist/${productId}`, { method: "DELETE" });
      setItems((prev) => prev.filter((item) => item.productId !== productId));
    } catch {}
  };

  const addAllToCart = () => {
    items.forEach((item) => {
      if (item.product.inStock) {
        addToCart({
          id: item.product.id,
          name: item.product.name,
          brand: item.product.brand,
          price: item.product.price,
          originalPrice: item.product.originalPrice,
          images: item.product.images,
          category: item.product.category,
        } as any);
      }
    });
  };

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="w-10 h-10 border-2 border-dark-700 border-t-gold-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 page-transition">
      <div className="mb-12">
        <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Collection</span>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2">My Wishlist</h1>
        <p className="text-dark-400 mt-2">{items.length} item{items.length !== 1 ? "s" : ""}</p>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-24">
          <Heart size={48} className="text-dark-700 mx-auto mb-4" />
          <p className="text-dark-500 text-lg mb-4">Your wishlist is empty</p>
          <Link href="/products" className="bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-gold-500/20">
            Explore Products <ArrowRight size={18} />
          </Link>
        </div>
      ) : (
        <>
          <div className="flex justify-end mb-6">
            <button onClick={addAllToCart} className="flex items-center gap-2 bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-6 py-3 rounded-xl font-semibold text-sm transition-all">
              <ShoppingCart size={16} /> Add All to Cart
            </button>
          </div>
          <div className="space-y-4">
            {items.map((item) => {
              const p = item.product;
              return (
                <div key={item.id} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-4 flex items-center gap-5 hover:border-gold-500/20 transition-colors flex-wrap">
                  <Link href={`/products/${p.id}`} className="shrink-0">
                    <img src={p.images[0]} alt={p.name} className="w-20 h-20 rounded-xl object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-gold-400 uppercase tracking-widest font-semibold">{p.brand}</p>
                    <Link href={`/products/${p.id}`}>
                      <h3 className="text-sm font-medium text-white hover:text-gold-400 transition-colors truncate">{p.name}</h3>
                    </Link>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="font-bold text-white">{formatPrice(p.price)}</span>
                      {p.originalPrice && <span className="text-xs text-dark-500 line-through">{formatPrice(p.originalPrice)}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => {
                      if (p.inStock) addToCart({ id: p.id, name: p.name, brand: p.brand, price: p.price, originalPrice: p.originalPrice, images: p.images, category: p.category } as any);
                    }} className="p-2.5 rounded-xl bg-dark-800 hover:bg-gold-500 hover:text-dark-950 text-dark-300 transition-all" title="Add to Cart">
                      <ShoppingCart size={18} />
                    </button>
                    <button onClick={() => removeItem(item.productId)} className="p-2.5 rounded-xl bg-dark-800 hover:bg-red-500/10 text-dark-300 hover:text-red-400 transition-all" title="Remove">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
