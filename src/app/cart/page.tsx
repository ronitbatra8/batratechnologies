"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/utils";
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Shield, Truck, RotateCcw } from "lucide-react";

export default function CartPage() {
  const { items, removeFromCart, updateQuantity, totalPrice, totalItems, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="w-24 h-24 bg-dark-900 border border-dark-800 rounded-full flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={36} className="text-dark-600" />
        </div>
        <h1 className="text-4xl font-display font-bold text-white mb-3">Your Cart is Empty</h1>
        <p className="text-dark-400 mb-8">Begin your collection.</p>
        <Link href="/products" className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-gold-500/20">
          Explore Products <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  const shipping = totalPrice >= 4999 ? 0 : 99;
  const tax = totalPrice * 0.18;
  const total = totalPrice + shipping + tax;

  return (
    <div className="max-w-7xl mx-auto px-6 pt-32 pb-24 page-transition">
      <div className="flex items-center justify-between mb-12">
        <div>
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Cart</span>
          <h1 className="text-4xl font-display font-bold text-white mt-2">{totalItems} {totalItems === 1 ? "Item" : "Items"}</h1>
        </div>
        <button onClick={clearCart} className="text-sm text-dark-500 hover:text-red-400 transition-colors font-medium">Clear All</button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(({ product, quantity }) => (
            <div key={product.id} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6 flex gap-6 hover:border-dark-700/50 transition-colors">
              <Link href={`/products/${product.id}`} className="shrink-0">
                <img src={product.images[0]} alt={product.name} className="w-28 h-28 object-cover rounded-xl" />
              </Link>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] text-gold-400 font-semibold uppercase tracking-[0.2em]">{product.brand}</p>
                    <Link href={`/products/${product.id}`}>
                      <h3 className="font-display font-semibold text-white hover:text-gold-400 transition-colors">{product.name}</h3>
                    </Link>
                  </div>
                  <button onClick={() => removeFromCart(product.id)} className="text-dark-600 hover:text-red-400 transition-colors p-1">
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                  <div className="flex items-center border border-dark-700 rounded-lg self-start">
                    <button onClick={() => updateQuantity(product.id, quantity - 1)} className="p-2 hover:bg-dark-800 transition-colors rounded-l-lg text-dark-400"><Minus size={14} /></button>
                    <span className="px-3 py-2 font-medium text-sm text-white">{quantity}</span>
                    <button onClick={() => updateQuantity(product.id, quantity + 1)} className="p-2 hover:bg-dark-800 transition-colors rounded-r-lg text-dark-400"><Plus size={14} /></button>
                  </div>
                  <span className="text-xl font-semibold text-white sm:text-right">{formatPrice(product.price * quantity)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6 sticky top-28 space-y-6">
            <h2 className="font-display text-xl font-bold text-white">Summary</h2>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-dark-400">Subtotal</span><span className="font-medium text-white">{formatPrice(totalPrice)}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Shipping</span><span className={`font-medium ${shipping === 0 ? "text-green-400" : "text-white"}`}>{shipping === 0 ? "Complimentary" : formatPrice(shipping)}</span></div>
              <div className="flex justify-between"><span className="text-dark-400">Tax</span><span className="font-medium text-white">{formatPrice(tax)}</span></div>
              <div className="border-t border-dark-800 pt-3 flex justify-between"><span className="font-bold text-white">Total</span><span className="font-bold text-white text-lg">{formatPrice(total)}</span></div>
            </div>
            {shipping > 0 && (
              <div className="bg-gold-500/5 border border-gold-500/10 text-gold-400 text-xs rounded-xl px-4 py-3">
                Add {formatPrice(4999 - totalPrice)} more for complimentary shipping.
              </div>
            )}
            <Link href="/checkout" className="block w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 py-4 rounded-xl font-semibold text-center transition-all hover:shadow-lg hover:shadow-gold-500/20">
              Proceed to Checkout
            </Link>
            <Link href="/products" className="block w-full border border-dark-700 text-dark-300 py-3.5 rounded-xl font-medium text-center hover:border-dark-600 hover:text-white transition-all">
              Continue Shopping
            </Link>
            <div className="space-y-2.5 pt-2">
              {[{ icon: Shield, label: "Secure Checkout" }, { icon: Truck, label: "Complimentary shipping over ₹4,999" }, { icon: RotateCcw, label: "30-day hassle-free returns" }].map((item) => (
                <div key={item.label} className="flex items-center gap-2 text-xs text-dark-500">
                  <item.icon size={13} className="text-gold-500/60" /> {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
