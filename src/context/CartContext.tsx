"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

function getCartKey(): string {
  const userId = localStorage.getItem("bt-current-user-id") || "guest";
  return `bt-cart-${userId}`;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [cartKey, setCartKey] = useState<string>("bt-cart-guest");

  useEffect(() => {
    const key = getCartKey();
    setCartKey(key);
    const saved = localStorage.getItem(key);
    if (saved) { try { setItems(JSON.parse(saved)); } catch { setItems([]); } }
    else setItems([]);
  }, []);

  useEffect(() => {
    const handleAccountSwitch = () => {
      const key = getCartKey();
      setCartKey(key);
      const saved = localStorage.getItem(key);
      if (saved) { try { setItems(JSON.parse(saved)); } catch { setItems([]); } }
      else setItems([]);
    };
    window.addEventListener("bt-account-switch", handleAccountSwitch);
    return () => window.removeEventListener("bt-account-switch", handleAccountSwitch);
  }, []);

  useEffect(() => {
    localStorage.setItem(cartKey, JSON.stringify(items));
  }, [items, cartKey]);

  const addToCart = useCallback((product: Product, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.product.id === product.id);
      if (existing) {
        return prev.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + quantity } : i
        );
      }
      return [...prev, { product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.product.id !== productId));
  }, []);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) => (i.product.id === productId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
  const totalPrice = items.reduce((sum, i) => sum + i.product.price * i.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addToCart, removeFromCart, updateQuantity, clearCart, totalItems, totalPrice }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
