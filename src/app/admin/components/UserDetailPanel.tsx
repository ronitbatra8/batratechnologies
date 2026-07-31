"use client";

import { useState } from "react";
import {
  X,
  Mail,
  Phone,
  Star,
  Heart,
  MessageSquare,
  KeyRound,
  Package,
  MapPin,
  LayoutDashboard,
  Globe,
  ExternalLink,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { statusColors, msgStatusColors } from "./types";
import type { Tab, UserDetailTab } from "./types";

interface Props {
  userDetail: any | null;
  loading: boolean;
  onClose: () => void;
  onNavigate: (tab: Tab, focusId?: string) => void;
}

const tabs: { key: UserDetailTab; label: string; icon: any }[] = [
  { key: "overview", label: "Overview", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: Package },
  { key: "addresses", label: "Addresses", icon: MapPin },
  { key: "reviews", label: "Reviews", icon: Star },
  { key: "wishlist", label: "Wishlist", icon: Heart },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "security", label: "Security", icon: KeyRound },
];

export default function UserDetailPanel({ userDetail, loading, onClose, onNavigate }: Props) {
  const [activeTab, setActiveTab] = useState<UserDetailTab>("overview");

  if (!userDetail && !loading) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative w-full max-w-2xl bg-dark-950 border-l border-dark-800/50 overflow-y-auto animate-slide-in-right">
        {loading ? (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-dark-950/95 backdrop-blur-xl border-b border-dark-800/50">
              <h2 className="text-lg font-serif text-white">Loading...</h2>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex items-center justify-center py-32">
              <div className="w-8 h-8 border-2 border-dark-700 border-t-gold-500 rounded-full animate-spin" />
            </div>
          </>
        ) : (
          userDetail && (
            <>
              <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 bg-dark-950/95 backdrop-blur-xl border-b border-dark-800/50">
                <h2 className="text-lg font-serif text-white">{userDetail.name}</h2>
                <button
                  onClick={onClose}
                  className="p-2 rounded-xl text-dark-400 hover:text-white hover:bg-dark-800/50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="bg-dark-900/60 rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gold-400 to-gold-600 flex items-center justify-center shrink-0">
                      <span className="text-xl font-bold text-dark-950">
                        {userDetail.name?.charAt(0)?.toUpperCase() || "?"}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-serif text-white">{userDetail.name}</h3>
                      <div className="flex items-center gap-1.5 mt-1">
                        <Mail className="w-3.5 h-3.5 text-dark-500 shrink-0" />
                        <p className="text-sm text-dark-400 truncate">{userDetail.email}</p>
                      </div>
                      {userDetail.phone && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <Phone className="w-3.5 h-3.5 text-dark-500 shrink-0" />
                          <p className="text-sm text-dark-400">{userDetail.phone}</p>
                        </div>
                      )}
                      {userDetail.createdAt && (
                        <p className="text-xs text-dark-500 mt-2">
                          Joined {new Date(userDetail.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4 mt-6 pt-5 border-t border-dark-800/50">
                    <div>
                      <p className="text-xs text-dark-500 mb-1">Spent</p>
                      <p className="text-sm font-semibold text-gold-400">
                        {formatPrice(userDetail.totalSpent || 0)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-500 mb-1">Orders</p>
                      <p className="text-sm font-semibold text-white">{userDetail.orders?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-500 mb-1">Reviews</p>
                      <p className="text-sm font-semibold text-white">{userDetail.reviews?.length || 0}</p>
                    </div>
                    <div>
                      <p className="text-xs text-dark-500 mb-1">Wishlist</p>
                      <p className="text-sm font-semibold text-white">{userDetail.wishlists?.length || 0}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const count =
                      tab.key === "orders" ? userDetail.orders?.length :
                      tab.key === "addresses" ? userDetail.savedAddresses?.length :
                      tab.key === "reviews" ? userDetail.reviews?.length :
                      tab.key === "wishlist" ? userDetail.wishlists?.length :
                      tab.key === "messages" ? userDetail.messages?.length :
                      tab.key === "security" ? userDetail.passwordResets?.length :
                      undefined;

                    return (
                      <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all ${
                          activeTab === tab.key
                            ? "bg-gold-500/10 text-gold-400 border border-gold-500/20"
                            : "bg-dark-900 text-dark-400 border border-dark-800 hover:text-white"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {tab.label}
                        {count !== undefined && count > 0 && (
                          <span className="ml-0.5 px-1.5 py-0.5 rounded-full bg-dark-800 text-[10px] text-dark-300">
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                {activeTab === "overview" && <OverviewTab user={userDetail} onNavigate={onNavigate} />}
                {activeTab === "orders" && <OrdersTab orders={userDetail.orders} onNavigate={onNavigate} />}
                {activeTab === "addresses" && <AddressesTab addresses={userDetail.savedAddresses} />}
                {activeTab === "reviews" && <ReviewsTab reviews={userDetail.reviews} />}
                {activeTab === "wishlist" && <WishlistTab wishlists={userDetail.wishlists} />}
                {activeTab === "messages" && <MessagesTab messages={userDetail.messages} onNavigate={onNavigate} />}
                {activeTab === "security" && <SecurityTab resets={userDetail.passwordResets} />}
              </div>
            </>
          )
        )}
      </div>
    </div>
  );
}

function OverviewTab({ user, onNavigate }: { user: any; onNavigate: (tab: Tab, focusId?: string) => void }) {
  return (
    <div className="space-y-6">
      <section>
        <h4 className="text-sm font-medium text-dark-300 mb-3">Recent Orders</h4>
        {user.orders?.length > 0 ? (
          <div className="space-y-3">
            {user.orders.slice(0, 3).map((order: any) => (
              <div
                key={order.id}
                onClick={() => onNavigate("orders", order.id)}
                className="bg-dark-900/60 rounded-xl p-4 border border-dark-800/50 cursor-pointer hover:border-gold-500/20 hover:bg-dark-900/80 transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs text-dark-500 font-mono">{order.id?.slice(0, 8)}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[order.status] || "text-dark-400 bg-dark-800/50 border-dark-700/50"}`}>
                      {order.status}
                    </span>
                    <ExternalLink className="w-3 h-3 text-dark-600 group-hover:text-gold-400 transition-colors" />
                  </div>
                </div>
                <p className="text-sm text-white font-medium">{formatPrice(order.totalAmount)}</p>
                {order.items?.slice(0, 2).map((item: any, i: number) => (
                  <p key={i} className="text-xs text-dark-400 mt-1">{item.name} × {item.quantity}</p>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={Package} label="No orders yet" />
        )}
      </section>

      <section>
        <h4 className="text-sm font-medium text-dark-300 mb-3">Saved Addresses</h4>
        {user.savedAddresses?.length > 0 ? (
          <div className="space-y-3">
            {user.savedAddresses.slice(0, 2).map((addr: any) => (
              <div key={addr.id} className="bg-dark-900/60 rounded-xl p-4 border border-dark-800/50">
                <div className="flex items-center gap-2 mb-1">
                  <p className="text-sm text-white">{addr.label}</p>
                  {addr.isDefault && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-gold-500/10 text-gold-400 border border-gold-500/20">
                      Default
                    </span>
                  )}
                </div>
                <p className="text-xs text-dark-400">{addr.address}, {addr.city}, {addr.state} - {addr.pincode}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={MapPin} label="No saved addresses" />
        )}
      </section>

      <section>
        <h4 className="text-sm font-medium text-dark-300 mb-3">Password History</h4>
        {user.passwordResets?.length > 0 ? (
          <div className="space-y-3">
            {user.passwordResets.slice(0, 2).map((reset: any) => (
              <div key={reset.id} className="bg-dark-900/60 rounded-xl p-4 border border-dark-800/50">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-dark-400">{reset.method}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    reset.status === "completed"
                      ? "text-green-400 bg-green-500/10 border-green-500/20"
                      : reset.status === "failed"
                        ? "text-red-400 bg-red-500/10 border-red-500/20"
                        : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
                  }`}>
                    {reset.status}
                  </span>
                </div>
                <p className="text-xs text-dark-500 mt-1">
                  {new Date(reset.requestedAt || reset.createdAt).toLocaleDateString("en-IN")}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={KeyRound} label="No password resets" />
        )}
      </section>

      <section>
        <h4 className="text-sm font-medium text-dark-300 mb-3">Messages Sent</h4>
        {user.messages?.length > 0 ? (
          <div className="space-y-3">
            {user.messages.slice(0, 3).map((msg: any) => (
              <div
                key={msg.id}
                onClick={() => onNavigate("messages")}
                className="bg-dark-900/60 rounded-xl p-4 border border-dark-800/50 cursor-pointer hover:border-gold-500/20 hover:bg-dark-900/80 transition-all group"
              >
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm text-white">{msg.subject}</p>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${msgStatusColors[msg.status] || "text-dark-400 bg-dark-800/50 border-dark-700/50"}`}>
                      {msg.status}
                    </span>
                    <ExternalLink className="w-3 h-3 text-dark-600 group-hover:text-gold-400 transition-colors" />
                  </div>
                </div>
                <p className="text-xs text-dark-500 line-clamp-1">{msg.message}</p>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState icon={MessageSquare} label="No messages sent" />
        )}
      </section>
    </div>
  );
}

function OrdersTab({ orders, onNavigate }: { orders: any[]; onNavigate: (tab: Tab, focusId?: string) => void }) {
  if (!orders?.length) return <EmptyState icon={Package} label="No orders found" />;

  return (
    <div className="space-y-4">
      {orders.map((order: any) => (
        <div
          key={order.id}
          onClick={() => onNavigate("orders", order.id)}
          className="bg-dark-900/60 rounded-2xl p-6 border border-dark-800/50 space-y-4 cursor-pointer hover:border-gold-500/20 hover:bg-dark-900/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-dark-500 font-mono mb-1">Order #{order.id?.slice(0, 8)}</p>
              <p className="text-sm text-dark-400">
                {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${statusColors[order.status] || "text-dark-400 bg-dark-800/50 border-dark-700/50"}`}>
                  {order.status}
                </span>
                <ExternalLink className="w-3 h-3 text-dark-600 group-hover:text-gold-400 transition-colors" />
              </div>
              <p className="text-sm font-semibold text-gold-400 mt-1">{formatPrice(order.totalAmount)}</p>
            </div>
          </div>

          {order.items?.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-dark-800/50">
              {order.items.map((item: any, i: number) => (
                <div key={i} className="flex items-center gap-3">
                  {item.image ? (
                    <img src={item.image} alt={item.name} className="w-10 h-10 rounded-lg object-cover bg-dark-800" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-dark-800 flex items-center justify-center">
                      <Package className="w-4 h-4 text-dark-600" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-white truncate">{item.name}</p>
                    <p className="text-xs text-dark-500">Qty: {item.quantity} × {formatPrice(item.price)}</p>
                  </div>
                  <p className="text-sm text-white shrink-0">{formatPrice(item.quantity * item.price)}</p>
                </div>
              ))}
            </div>
          )}

          {order.shippingAddress && (
            <div className="pt-3 border-t border-dark-800/50">
              <div className="flex items-start gap-2">
                <MapPin className="w-3.5 h-3.5 text-dark-500 mt-0.5 shrink-0" />
                <p className="text-xs text-dark-400">
                  {order.shippingAddress}, {order.shippingCity}, {order.shippingState}
                </p>
              </div>
              {order.paymentMethod && (
                <p className="text-xs text-dark-500 mt-1.5">Payment: {order.paymentMethod === "ONLINE" ? "Online Payment" : order.paymentMethod}{order.paymentStatus === "APPROVED" ? " · Paid" : order.paymentStatus === "PENDING" ? " · Pending" : ""}</p>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function AddressesTab({ addresses }: { addresses: any[] }) {
  if (!addresses?.length) return <EmptyState icon={MapPin} label="No saved addresses" />;

  return (
    <div className="space-y-4">
      {addresses.map((addr: any) => (
        <div key={addr.id} className="bg-dark-900/60 rounded-2xl p-6 border border-dark-800/50">
          <div className="flex items-center gap-2 mb-3">
            <p className="text-sm font-medium text-white">{addr.label}</p>
            {addr.isDefault && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-gold-500/10 text-gold-400 border border-gold-500/20">
                Default
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            <p className="text-sm text-dark-300">{addr.name}</p>
            {addr.phone && <p className="text-xs text-dark-400">{addr.phone}</p>}
            <p className="text-xs text-dark-400">{addr.address}</p>
            <p className="text-xs text-dark-400">{addr.city}, {addr.state} - {addr.pincode}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function ReviewsTab({ reviews }: { reviews: any[] }) {
  if (!reviews?.length) return <EmptyState icon={Star} label="No reviews yet" />;

  return (
    <div className="space-y-4">
      {reviews.map((review: any) => (
        <div
          key={review.id}
          className="bg-dark-900/60 rounded-2xl p-6 border border-dark-800/50 cursor-pointer hover:border-gold-500/20 hover:bg-dark-900/80 transition-all group"
          onClick={() => review.product?.id && window.open(`/products/${review.product.id}`, "_blank")}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div>
                <p className="text-sm text-white group-hover:text-gold-400 transition-colors">{review.product?.name}</p>
                <p className="text-xs text-dark-500">{review.product?.brand}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-dark-600 group-hover:text-gold-400 transition-colors shrink-0" />
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((i) => (
                <Star
                  key={i}
                  className={`w-3.5 h-3.5 ${
                    i <= review.rating
                      ? "fill-gold-400 text-gold-400"
                      : "text-dark-700"
                  }`}
                />
              ))}
            </div>
          </div>
          {review.comment && (
            <p className="text-xs text-dark-400 leading-relaxed">{review.comment}</p>
          )}
          <p className="text-[10px] text-dark-600 mt-3">
            {new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      ))}
    </div>
  );
}

function WishlistTab({ wishlists }: { wishlists: any[] }) {
  if (!wishlists?.length) return <EmptyState icon={Heart} label="Wishlist is empty" />;

  return (
    <div className="space-y-4">
      {wishlists.map((item: any) => (
        <div
          key={item.id}
          className="bg-dark-900/60 rounded-2xl p-6 border border-dark-800/50 cursor-pointer hover:border-gold-500/20 hover:bg-dark-900/80 transition-all group"
          onClick={() => item.product?.id && window.open(`/products/${item.product.id}`, "_blank")}
        >
          <div className="flex items-center gap-4">
            {item.product?.images?.[0] ? (
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                className="w-14 h-14 rounded-lg object-cover bg-dark-800 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-lg bg-dark-800 flex items-center justify-center shrink-0">
                <Heart className="w-5 h-5 text-dark-600" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-sm text-white truncate group-hover:text-gold-400 transition-colors">{item.product?.name}</p>
              <p className="text-xs text-dark-500">{item.product?.brand}</p>
            </div>
            <p className="text-sm font-semibold text-gold-400 shrink-0">
              {formatPrice(item.product?.price || 0)}
            </p>
            <ExternalLink className="w-3 h-3 text-dark-600 group-hover:text-gold-400 transition-colors shrink-0" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MessagesTab({ messages, onNavigate }: { messages: any[]; onNavigate: (tab: Tab, focusId?: string) => void }) {
  if (!messages?.length) return <EmptyState icon={MessageSquare} label="No messages" />;

  return (
    <div className="space-y-4">
      {messages.map((msg: any) => (
        <div
          key={msg.id}
          onClick={() => onNavigate("messages")}
          className="bg-dark-900/60 rounded-2xl p-6 border border-dark-800/50 space-y-3 cursor-pointer hover:border-gold-500/20 hover:bg-dark-900/80 transition-all group"
        >
          <div className="flex items-center justify-between">
            <p className="text-sm text-white font-medium group-hover:text-gold-400 transition-colors">{msg.subject}</p>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${msgStatusColors[msg.status] || "text-dark-400 bg-dark-800/50 border-dark-700/50"}`}>
                {msg.status}
              </span>
              <ExternalLink className="w-3 h-3 text-dark-600 group-hover:text-gold-400 transition-colors" />
            </div>
          </div>
          <p className="text-xs text-dark-400 leading-relaxed">{msg.message}</p>
          {msg.replyMessage && (
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-3">
              <p className="text-[10px] text-green-400 font-medium mb-1">Reply</p>
              <p className="text-xs text-dark-300 leading-relaxed">{msg.replyMessage}</p>
            </div>
          )}
          <p className="text-[10px] text-dark-600">
            {new Date(msg.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        </div>
      ))}
    </div>
  );
}

function SecurityTab({ resets }: { resets: any[] }) {
  if (!resets?.length) return <EmptyState icon={KeyRound} label="No password reset history" />;

  return (
    <div className="space-y-4">
      {resets.map((reset: any) => {
        const timeline = [
          { label: "Requested", time: reset.requestedAt, done: true },
          { label: "Verified", time: reset.verifiedAt, done: !!reset.verifiedAt },
          { label: reset.status === "failed" ? "Failed" : "Completed", time: reset.completedAt || (reset.status === "failed" ? reset.createdAt : null), done: reset.status === "completed" || reset.status === "failed" },
        ];

        return (
          <div key={reset.id} className="bg-dark-900/60 rounded-2xl p-6 border border-dark-800/50 space-y-4">
            <div className="flex items-center justify-between">
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                reset.status === "completed"
                  ? "text-green-400 bg-green-500/10 border-green-500/20"
                  : reset.status === "failed"
                    ? "text-red-400 bg-red-500/10 border-red-500/20"
                    : "text-yellow-400 bg-yellow-500/10 border-yellow-500/20"
              }`}>
                {reset.status}
              </span>
              <span className="text-[10px] text-dark-500 font-medium px-2 py-0.5 rounded-full bg-dark-800 border border-dark-700/50">
                {reset.method}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-center gap-2 flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div className={`w-2 h-2 rounded-full ${step.done ? "bg-green-400" : "bg-dark-700"}`} />
                    <p className={`text-[10px] mt-1 text-center ${step.done ? "text-dark-300" : "text-dark-600"}`}>
                      {step.label}
                    </p>
                    {step.time && (
                      <p className="text-[9px] text-dark-600 mt-0.5">
                        {new Date(step.time).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                      </p>
                    )}
                  </div>
                  {i < timeline.length - 1 && (
                    <div className={`w-6 h-px mt-[-12px] ${step.done ? "bg-green-500/30" : "bg-dark-800"}`} />
                  )}
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-dark-800/50 space-y-1.5">
              {reset.ipAddress && (
                <div className="flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-dark-500" />
                  <p className="text-xs text-dark-400">{reset.ipAddress}</p>
                </div>
              )}
              {reset.failReason && (
                <p className="text-xs text-red-400/80">Reason: {reset.failReason}</p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function EmptyState({ icon: Icon, label }: { icon: any; label: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-dark-500">
      <Icon className="w-10 h-10 mb-3" />
      <p className="text-sm">{label}</p>
    </div>
  );
}
