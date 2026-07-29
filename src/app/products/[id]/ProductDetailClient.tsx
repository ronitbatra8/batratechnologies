"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { getProductById, products, getDiscountPercent } from "@/data/products";
import type { Product } from "@/data/types";
import { API_URL } from "@/lib/api";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Star, ShoppingCart, ChevronRight, Plus, Minus, Check, Shield, Truck, RotateCcw, Zap, Loader2 } from "lucide-react";
import ProductCard from "@/components/ProductCard";
import CartNotification from "@/components/CartNotification";
import ReviewsSection from "@/components/ReviewsSection";
import WishlistButton from "@/components/WishlistButton";
import { trackRecentlyViewed } from "@/components/RecentlyViewed";

export default function ProductDetailClient() {
  const params = useParams();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const fetchedRef = useRef(false);
  const { addToCart } = useCart();
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const [showNotif, setShowNotif] = useState(false);

  useEffect(() => {
    if (fetchedRef.current) return;
    fetchedRef.current = true;
    const id = params.id as string;
    const cached = getProductById(id);
    if (cached) {
      setProduct(cached);
      setLoading(false);
      trackRecentlyViewed(id);
      return;
    }
    fetch(`${API_URL}/products/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.error) {
          setProduct(data);
          trackRecentlyViewed(id);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <Loader2 className="w-10 h-10 text-gold-400 animate-spin mx-auto mb-4" />
        <p className="text-dark-400">Loading product...</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <h1 className="text-4xl font-display font-bold text-white mb-4">Product Not Found</h1>
        <Link href="/products" className="text-gold-400 font-medium hover:text-gold-300 transition-colors">Back to Products</Link>
      </div>
    );
  }

  const discount = getDiscountPercent(product.price, product.originalPrice);
  const relatedProducts = products.filter((p) => p.category === product.category && p.id !== product.id).slice(0, 4);

  const handleAddToCart = () => {
    addToCart(product, quantity);
    setAdded(true);
    setShowNotif(true);
    setTimeout(() => setAdded(false), 1500);
    setTimeout(() => setShowNotif(false), 2000);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push("/cart");
  };

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 page-transition">
      <nav className="flex items-center gap-2 text-sm text-dark-500 mb-10">
        <Link href="/" className="hover:text-gold-400 transition-colors">Home</Link>
        <ChevronRight size={12} />
        <Link href="/products" className="hover:text-gold-400 transition-colors">Products</Link>
        <ChevronRight size={12} />
        <Link href={`/products?category=${product.category}`} className="hover:text-gold-400 transition-colors capitalize">{product.category}</Link>
        <ChevronRight size={12} />
        <span className="text-white font-medium">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-12 mb-24">
        <div>
          <div className="bg-dark-900 rounded-2xl overflow-hidden border border-dark-800/50 aspect-square">
            <img src={product.images[activeImage]} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-3 mt-4">
            {product.images.map((img, i) => (
              <button key={i} onClick={() => setActiveImage(i)} className={`w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${activeImage === i ? "border-gold-500" : "border-dark-800 hover:border-dark-600"}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-xs font-semibold text-gold-400 uppercase tracking-[0.2em]">{product.brand}</span>
            {product.badge && <span className="bg-gold-500/10 text-gold-400 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">{product.badge}</span>}
            {discount > 0 && <span className="bg-red-500/10 text-red-400 text-[10px] font-bold px-3 py-1 rounded-full">Save {discount}%</span>}
          </div>

          <h1 className="text-3xl md:text-4xl font-display font-bold text-white mb-4">{product.name}</h1>

          <div className="flex items-center gap-3 mb-8">
            <div className="flex gap-0.5">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={16} className={i < Math.floor(product.rating) ? "fill-gold-400 text-gold-400" : "text-dark-700 fill-dark-700"} />
              ))}
            </div>
            <span className="text-sm text-dark-400">{product.rating} &middot; {product.reviewCount} reviews</span>
          </div>

          <div className="flex items-baseline gap-4 mb-8">
            <span className="text-4xl font-bold text-white">{formatPrice(product.price)}</span>
            {product.originalPrice && (
              <>
                <span className="text-xl text-dark-500 line-through">{formatPrice(product.originalPrice)}</span>
                <span className="text-sm font-semibold text-green-400">Save {formatPrice(product.originalPrice - product.price)}</span>
              </>
            )}
          </div>

          <p className="text-dark-300 leading-relaxed mb-8 font-light">{product.description}</p>

          <div className="flex flex-wrap gap-2 mb-10">
            {product.features.map((f) => (
              <span key={f} className="bg-dark-900 border border-dark-800 text-dark-300 text-sm px-4 py-2 rounded-xl flex items-center gap-1.5">
                <Check size={14} className="text-gold-500" /> {f}
              </span>
            ))}
          </div>

          <div className="flex flex-col gap-3 mb-10">
            <div className="flex items-center gap-3">
              <div className="flex items-center border border-dark-700 rounded-xl">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-3 hover:bg-dark-800 transition-colors rounded-l-xl text-dark-300"><Minus size={18} /></button>
                <span className="px-5 py-3 font-semibold min-w-[60px] text-center text-white">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="p-3 hover:bg-dark-800 transition-colors rounded-r-xl text-dark-300"><Plus size={18} /></button>
              </div>
              <WishlistButton productId={product.id} />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <button onClick={handleAddToCart} className={`flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all duration-300 ${added ? "bg-green-500 text-white" : "bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 hover:shadow-lg hover:shadow-gold-500/20"}`}>
                {added ? <><Check size={20} /> Added</> : <><ShoppingCart size={20} /> Add to Cart</>}
              </button>
              <button onClick={handleBuyNow} className="flex-1 py-4 rounded-xl font-semibold flex items-center justify-center gap-2 border border-gold-500/30 text-gold-400 hover:bg-gold-500/10 hover:border-gold-500/50 transition-all duration-300">
                <Zap size={20} /> Buy Now
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {[
              { icon: Truck, label: "Free Shipping" },
              { icon: Shield, label: "2-Year Warranty" },
              { icon: RotateCcw, label: "30-Day Returns" },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-xs text-dark-400 bg-dark-900/60 border border-dark-800/50 rounded-xl px-3 py-3">
                <item.icon size={14} className="text-gold-500 shrink-0" />
                {item.label}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8 mb-24">
        <h2 className="text-2xl font-display font-bold text-white mb-8">Specifications</h2>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-1">
          {Object.entries(product.specifications).map(([key, value], i) => (
            <div key={key} className={`flex justify-between py-4 ${i < Object.entries(product.specifications).length - 1 ? "border-b border-dark-800/50" : ""}`}>
              <span className="text-dark-500 text-sm">{key}</span>
              <span className="font-medium text-white text-sm">{value}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-24">
        <ReviewsSection productId={product.id} />
      </div>

      {relatedProducts.length > 0 && (
        <section>
          <h2 className="text-2xl font-display font-bold text-white mb-10">You May Also Like</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {relatedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} />
            ))}
          </div>
        </section>
      )}

      <CartNotification show={showNotif} productName={product.name} />
    </div>
  );
}
