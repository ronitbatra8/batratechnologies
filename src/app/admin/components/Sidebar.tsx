"use client";

import { RefreshCw, Shield, LayoutDashboard, Package, Users, MessageSquare, KeyRound, BarChart3, Newspaper, Truck, Store } from "lucide-react";
import { Tab } from "./types";

const navItems: { key: Tab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: Package },
  { key: "users", label: "Users", icon: Users },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "security", label: "Security", icon: KeyRound },
  { key: "analytics", label: "Analytics", icon: BarChart3 },
  { key: "newsletter", label: "Newsletter", icon: Newspaper },
  { key: "delivery", label: "Delivery Exec", icon: Truck },
  { key: "sellers", label: "BT Sellers", icon: Store },
];

export { navItems };

export default function Sidebar({ tab, setTab, loading, onRefresh, onSignOut, sidebarOpen, setSidebarOpen, badges }: {
  tab: Tab;
  setTab: (t: Tab) => void;
  loading: boolean;
  onRefresh: () => void;
  onSignOut: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (v: boolean) => void;
  badges: Partial<Record<Tab, number>>;
}) {
  return (
    <>
      {sidebarOpen && <div className="lg:hidden fixed inset-0 bg-black/60 z-30" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-24 left-0 h-[calc(100%-6rem)] w-64 bg-dark-900/80 backdrop-blur-xl border-r border-dark-800/50 z-40 transition-transform duration-300 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}>
        <div className="p-6 border-b border-dark-800/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center">
              <span className="text-dark-950 font-bold text-sm">BT</span>
            </div>
            <div>
              <h2 className="text-sm font-display font-bold text-white">Batra Technologies</h2>
              <p className="text-[10px] text-dark-500 uppercase tracking-wider">Owner Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {navItems.map((item) => (
            <button key={item.key} onClick={() => { setTab(item.key); setSidebarOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                tab === item.key
                  ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                  : "text-dark-400 hover:text-white hover:bg-dark-800/50"
              }`}>
              <item.icon size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {badges[item.key] !== undefined && badges[item.key]! > 0 && (
                <span className={`text-xs px-2 py-0.5 rounded-full ${tab === item.key ? "bg-gold-500/20 text-gold-400" : "bg-dark-800 text-dark-400"}`}>{badges[item.key]}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-dark-800/50 space-y-2">
          <button onClick={onRefresh} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-400 hover:text-gold-400 rounded-xl hover:bg-dark-800/50 transition-all">
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} /> Refresh Data
          </button>
          <button onClick={onSignOut} className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-dark-400 hover:text-red-400 rounded-xl hover:bg-dark-800/50 transition-all">
            <Shield size={16} /> Sign Out
          </button>
        </div>
      </aside>
    </>
  );
}
