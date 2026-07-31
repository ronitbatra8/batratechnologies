"use client";

import { useState } from "react";
import { apiFetch } from "@/lib/api";
import { Mail, Check } from "lucide-react";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return;
    setLoading(true);
    setMessage("");
    try {
      const data = await apiFetch("/newsletter/subscribe", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setMessage(data.message || "Subscribed!");
      setSuccess(true);
      setEmail("");
    } catch {
      setMessage("Something went wrong. Try again.");
      setSuccess(false);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-md mx-auto">
      <div className="flex">
        {success && message ? (
          <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-xl px-6 py-4 text-green-400 text-sm w-full justify-center">
            <Check size={16} /> {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row w-full gap-2 sm:gap-0">
            <div className="relative flex-1">
              <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Enter your email" required className="w-full bg-dark-900 border border-dark-700 sm:border-r-0 rounded-xl sm:rounded-r-none pl-10 pr-4 py-4 text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
            </div>
            <button type="submit" disabled={loading} className="magnetic-btn w-full sm:w-auto bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl sm:rounded-r-xl sm:rounded-l-none font-semibold transition-all shrink-0 disabled:opacity-50">
              {loading ? "..." : "Subscribe"}
            </button>
          </form>
        )}
      </div>
      {message && !success && <p className="text-red-400 text-sm text-center mt-2">{message}</p>}
    </div>
  );
}
