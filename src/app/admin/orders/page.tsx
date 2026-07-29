"use client";

import { useState, useMemo, useCallback } from "react";
import { Menu, X, RefreshCw } from "lucide-react";
import { Tab, API, adminHeaders } from "../components/types";
import AuthGate from "../components/AuthGate";
import Sidebar from "../components/Sidebar";
import OverviewTab from "../components/OverviewTab";
import OrdersTab from "../components/OrdersTab";
import UsersTab from "../components/UsersTab";
import MessagesTab from "../components/MessagesTab";
import SecurityTab from "../components/SecurityTab";
import AnalyticsTab from "../components/AnalyticsTab";
import NewsletterTab from "../components/NewsletterTab";
import DeliveryExecTab from "../components/DeliveryExecTab";
import SellersTab from "../components/SellersTab";

export default function AdminPage() {
  const [adminKey, setAdminKey] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [tab, setTab] = useState<Tab>("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showKey, setShowKey] = useState(false);

  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [newsletter, setNewsletter] = useState<any>(null);
  const [messages, setMessages] = useState<any>(null);
  const [passwordResets, setPasswordResets] = useState<any[]>([]);

  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [focusOrderId, setFocusOrderId] = useState<string | null>(null);

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const h = adminHeaders(adminKey);
      const [o, u, s, a, nl, mg, pr] = await Promise.all([
        fetch(`${API}/api/admin/orders`, { headers: h }).then((r) => r.json()),
        fetch(`${API}/api/admin/users`, { headers: h }).then((r) => r.json()),
        fetch(`${API}/api/admin/stats`, { headers: h }).then((r) => r.json()),
        fetch(`${API}/api/analytics/stats`, { headers: h }).then((r) => r.json()),
        fetch(`${API}/api/newsletter/list`, { headers: h }).then((r) => r.json()),
        fetch(`${API}/api/messages/list`, { headers: h }).then((r) => r.json()),
        fetch(`${API}/api/admin/password-resets`, { headers: h }).then((r) => r.json()),
      ]);
      if (o.error) { alert(o.error); return; }
      setOrders(o);
      setUsers(u);
      setStats(s);
      setAnalytics(a);
      setNewsletter(nl);
      setMessages(mg);
      setPasswordResets(Array.isArray(pr) ? pr : []);
      setAuthenticated(true);
    } catch { alert("Cannot connect to server"); }
    setLoading(false);
  }, [adminKey]);

  const updateStatus = useCallback(async (orderId: string, status: string) => {
    setUpdatingId(orderId);
    try {
      await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method: "PUT", headers: adminHeaders(adminKey), body: JSON.stringify({ status }),
      });
      setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
    } catch { alert("Failed to update status"); }
    setUpdatingId(null);
  }, [adminKey]);

  const assignOrder = useCallback(async (orderId: string, deliveryId: string) => {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API}/api/admin/orders/${orderId}/assign`, {
        method: "PUT", headers: adminHeaders(adminKey), body: JSON.stringify({ deliveryId }),
      });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Request failed"); }
      loadAll();
    } catch (e: any) { alert(e.message || "Failed to assign/unassign delivery executive"); }
    setUpdatingId(null);
  }, [adminKey, loadAll]);

  const handleSignOut = useCallback(() => {
    setAuthenticated(false);
    setAdminKey("");
    setTab("overview");
  }, []);

  const handleNavigateToTab = useCallback((targetTab: Tab, focusId?: string) => {
    setTab(targetTab);
    if (focusId && targetTab === "orders") {
      setFocusOrderId(focusId);
    }
  }, []);

  const badges = useMemo(() => ({
    orders: orders.length,
    users: users.length,
    messages: messages?.unread || 0,
    security: passwordResets.length,
    newsletter: newsletter?.active || 0,
  } as Partial<Record<Tab, number>>), [orders, users, messages, passwordResets, newsletter]);

  if (!authenticated) {
    return <AuthGate adminKey={adminKey} setAdminKey={setAdminKey} showKey={showKey} setShowKey={setShowKey} loading={loading} onSubmit={loadAll} />;
  }

  return (
    <div className="min-h-screen bg-dark-950 page-transition">
      <div className="lg:hidden fixed top-20 left-0 right-0 z-50 bg-dark-900/95 backdrop-blur-xl border-b border-dark-800/50 px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-dark-400 hover:text-white transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <h1 className="text-sm font-display font-bold text-gold-400">Owner Dashboard</h1>
        <button onClick={loadAll} className="text-dark-400 hover:text-gold-400 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center">
          <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
        </button>
      </div>

      <Sidebar tab={tab} setTab={setTab} loading={loading} onRefresh={loadAll} onSignOut={handleSignOut} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} badges={badges} />

      <main className="lg:ml-64 pt-28 lg:pt-8 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {tab === "overview" && <OverviewTab stats={stats} orders={orders} passwordResets={passwordResets} messages={messages} onNavigate={handleNavigateToTab} />}
          {tab === "orders" && <OrdersTab orders={orders} updatingId={updatingId} onStatusUpdate={updateStatus} onAssign={assignOrder} focusOrderId={focusOrderId} onFocusHandled={() => setFocusOrderId(null)} adminKey={adminKey} />}
          {tab === "users" && <UsersTab users={users} adminKey={adminKey} onNavigate={handleNavigateToTab} />}
          {tab === "messages" && <MessagesTab messages={messages} adminKey={adminKey} setMessages={setMessages} />}
          {tab === "security" && <SecurityTab passwordResets={passwordResets} adminKey={adminKey} />}
          {tab === "analytics" && <AnalyticsTab analytics={analytics} />}
          {tab === "newsletter" && <NewsletterTab newsletter={newsletter} adminKey={adminKey} setNewsletter={setNewsletter} />}
          {tab === "delivery" && <DeliveryExecTab adminKey={adminKey} />}
          {tab === "sellers" && <SellersTab adminKey={adminKey} />}
        </div>
      </main>
    </div>
  );
}
