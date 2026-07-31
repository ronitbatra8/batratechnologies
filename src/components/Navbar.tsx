"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { ShoppingCart, Search, User, LogOut, Package, ChevronDown, Plus, Check, Trash2, Crown, Heart, MessageSquare, Truck, Store, Home, ShoppingBag, Info, Mail } from "lucide-react";

export default function Navbar() {
  const { totalItems } = useCart();
  const { user, logout, accounts, currentIndex, switchAccount, removeAccount } = useAuth();
  const isOwner = user?.email === "batra.ronit.08.11@gmail.com" || user?.phone === "9351396757";
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [hideNav, setHideNav] = useState(false);
  const lastScrollY = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setScrolled(y > 20);
      if (y > lastScrollY.current && y > 120) {
        setHideNav(true);
      } else {
        setHideNav(false);
      }
      lastScrollY.current = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const hasMultiple = accounts.length > 1;

  return (
    <>
    <header className={`fixed left-4 right-4 top-3 z-50 rounded-2xl transition-all duration-500 lg:left-0 lg:right-0 lg:top-0 lg:rounded-none ${scrolled ? "py-3 bg-dark-950/55 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-lg shadow-black/40 lg:py-3 lg:bg-dark-950/90 lg:border-b lg:border-x-0 lg:border-t-0 lg:shadow-none" : "py-4 bg-dark-950/55 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-lg shadow-black/40 lg:py-5 lg:bg-transparent lg:backdrop-blur-none lg:backdrop-saturate-100 lg:border-0 lg:shadow-none"}`}>
      <div className="max-w-7xl mx-auto px-6 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-dark-950 font-bold text-sm group-hover:shadow-lg group-hover:shadow-gold-500/20 transition-shadow">
            BT
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-display font-semibold text-white tracking-wide">Batra</span>
            <span className="text-lg font-display font-light text-gold-400 ml-1">Technologies</span>
          </div>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: "About", href: "/about" },
            { label: "Contact", href: "/contact" },
          ].map((link) => (
            <Link key={link.label} href={link.href} className="text-sm text-dark-300 hover:text-gold-400 transition-colors duration-300 tracking-wide uppercase font-medium">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link href="/products?focus=search" className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-dark-800 transition-colors group">
            <Search size={18} className="text-dark-300 group-hover:text-gold-400 transition-colors" />
          </Link>
          {mounted && user && (
            <Link href="/wishlist" className="flex items-center justify-center w-9 h-9 rounded-lg hover:bg-dark-800 transition-colors group">
              <Heart size={18} className="text-dark-300 group-hover:text-gold-400 transition-colors" />
            </Link>
          )}
          {mounted && user ? (
            <div ref={userMenuRef} className="relative">
              <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 text-sm text-dark-300 hover:text-gold-400 transition-colors">
                <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                  <span className="text-gold-400 font-semibold text-xs">{user.name.charAt(0).toUpperCase()}</span>
                </div>
                <span className="hidden sm:inline font-medium">{user.name.split(" ")[0]}</span>
                <ChevronDown size={14} className={`transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
              </button>
              {userMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-56 bg-dark-900 border border-dark-800 rounded-xl shadow-xl py-2 animate-fade-in-down">
                  {hasMultiple && (
                    <>
                      <div className="px-4 py-2 border-b border-dark-800">
                        <p className="text-[10px] text-dark-500 uppercase tracking-widest font-medium">Accounts</p>
                      </div>
                      {accounts.map((acc, i) => (
                        <div key={acc.user.id} className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${i === currentIndex ? "text-gold-400 bg-dark-800/50" : "text-dark-300 hover:bg-dark-800"}`}>
                          <button onClick={() => { switchAccount(i); setUserMenuOpen(false); }} className="flex items-center gap-3 flex-1 text-left min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center flex-shrink-0">
                              <span className="text-gold-400 font-semibold text-[10px]">{acc.user.name.charAt(0).toUpperCase()}</span>
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium truncate">{acc.user.name.split(" ")[0]}</p>
                              <p className="text-[11px] text-dark-500 truncate">{acc.user.email || acc.user.phone || ""}</p>
                            </div>
                            {i === currentIndex && <Check size={14} className="text-gold-400 flex-shrink-0 ml-auto" />}
                          </button>
                          {accounts.length > 1 && (
                            <button onClick={() => { removeAccount(i); setUserMenuOpen(false); }} className="text-dark-600 hover:text-red-400 transition-colors flex-shrink-0 p-1">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      <div className="border-t border-dark-800 mt-1 pt-1" />
                    </>
                  )}
                  <Link href="/login?add=1" className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-gold-400 hover:bg-dark-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                    <Plus size={16} /> Add Account
                  </Link>
                  <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-gold-400 hover:bg-dark-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                    <User size={16} /> My Account
                  </Link>
                  {user.role === "DELIVERY" && (
                    <Link href="/delivery" className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-gold-400 hover:bg-dark-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <Truck size={16} /> Delivery Dashboard
                    </Link>
                  )}
                  {user.role === "SELLER" && (
                    <Link href="/seller" className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-gold-400 hover:bg-dark-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <Store size={16} /> Seller Dashboard
                    </Link>
                  )}
                {isOwner && (
                    <Link href="/admin/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-gold-400 hover:text-gold-300 hover:bg-dark-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                      <Crown size={16} /> Owner Dashboard
                    </Link>
                  )}
                  <Link href="/queries" className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-gold-400 hover:bg-dark-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                    <MessageSquare size={16} /> My Queries
                  </Link>
                  <Link href="/wishlist" className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-gold-400 hover:bg-dark-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                    <Heart size={16} /> My Wishlist
                  </Link>
                  <Link href="/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-gold-400 hover:bg-dark-800 transition-colors" onClick={() => setUserMenuOpen(false)}>
                    <Package size={16} /> My Orders
                  </Link>
                  <button onClick={() => { logout(); setUserMenuOpen(false); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-dark-300 hover:text-red-400 hover:bg-dark-800 transition-colors w-full">
                    <LogOut size={16} /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login" className="flex items-center gap-2 text-sm text-dark-300 hover:text-gold-400 transition-colors">
              <User size={18} />
            </Link>
          )}
          <Link href="/cart" className="relative group">
            <ShoppingCart size={20} className="text-dark-300 group-hover:text-gold-400 transition-colors" />
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 bg-gold-500 text-dark-950 text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-scale-in">
                {totalItems}
              </span>
            )}
          </Link>
        </div>
      </div>
    </header>

    <nav className={`fixed bottom-4 left-4 right-4 z-50 lg:hidden bg-dark-950/55 backdrop-blur-2xl backdrop-saturate-150 rounded-2xl border border-white/10 shadow-lg shadow-black/40 pb-[env(safe-area-inset-bottom)] transition-transform duration-300 ${hideNav ? "translate-y-[calc(100%+1rem)]" : "translate-y-0"}`}>
      <div className="grid grid-cols-4">
        {[
          { label: "Home", href: "/", icon: Home, active: pathname === "/" },
          { label: "Products", href: "/products", icon: ShoppingBag, active: pathname === "/products" || pathname.startsWith("/products/") },
          { label: "About", href: "/about", icon: Info, active: pathname.startsWith("/about") },
          { label: "Contact", href: "/contact", icon: Mail, active: pathname.startsWith("/contact") },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.label} href={item.href} className={`flex flex-col items-center gap-1 py-2.5 text-[10px] uppercase tracking-widest font-medium transition-colors ${item.active ? "text-gold-400" : "text-dark-400 hover:text-gold-400"}`}>
              <Icon size={18} className={item.active ? "text-gold-400" : ""} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
    </>
  );
}
