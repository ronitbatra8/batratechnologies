"use client";

export type Tab = "overview" | "orders" | "users" | "messages" | "security" | "analytics" | "newsletter" | "delivery" | "sellers";
export type UserDetailTab = "overview" | "orders" | "addresses" | "reviews" | "wishlist" | "messages" | "security";

export const API = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000").replace("/api", "");

export const statusColors: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  confirmed: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  shipped: "text-purple-400 bg-purple-500/10 border-purple-500/20",
  delivered: "text-green-400 bg-green-500/10 border-green-500/20",
  cancelled: "text-red-400 bg-red-500/10 border-red-500/20",
};

export const msgStatusColors: Record<string, string> = {
  pending: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  "in-progress": "text-blue-400 bg-blue-500/10 border-blue-500/20",
  replied: "text-green-400 bg-green-500/10 border-green-500/20",
  resolved: "text-gold-400 bg-gold-500/10 border-gold-500/20",
};

export function adminHeaders(key: string) {
  return { "x-admin-key": key, "Content-Type": "application/json" };
}
