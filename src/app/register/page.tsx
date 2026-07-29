"use client";

import Link from "next/link";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Eye, EyeOff, Mail, Lock, User, Truck, Store } from "lucide-react";

const ROLES = [
  { value: "CUSTOMER", label: "Customer", desc: "Browse and shop products", icon: User },
  { value: "DELIVERY", label: "Delivery Executive", desc: "Deliver orders to customers", icon: Truck },
  { value: "SELLER", label: "BT Seller", desc: "Sell your products on our platform", icon: Store },
];

function RegisterContent() {
  const searchParams = useSearchParams();
  const prefill = searchParams.get("prefill") || "";
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("CUSTOMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = sessionStorage.getItem("bt-register-role");
      if (storedRole) {
        setRole(storedRole);
        sessionStorage.removeItem("bt-register-role");
      }
    }
  }, []);

  useEffect(() => {
    if (prefill) {
      if (prefill.includes("@")) setEmail(prefill);
      else setPhone(prefill);
    }
  }, [prefill]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) { setError("Name must be at least 2 characters"); return; }
    if (!email) { setError("Email is required for verification"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }
    const blocked = ["tempmail.com","throwaway.com","fakemail.com","test.com","example.com","mailinator.com","guerrillamail.com","10minutemail.com","temp-mail.org","fakeinbox.com","sharklasers.com","dispostable.com","yopmail.com","yopmail.fr","maildrop.cc","trashmail.com","trashmail.me","trashmail.net","tempail.com","tempalias.com","tempinbox.com","discard.email","discardmail.com","mohmal.com","getnada.com","tmpmail.net","tmpmail.org","minutemail.com","tempmailer.com","binkmail.com","mailnull.com","mailexpire.com","saynotospams.com","mailzilla.com","lroid.com","kook.ml","zaiko.ml","guerrillamailblock.com","grr.la","bm-email.com","harakirimail.com","tmail.ws","tmail.io","temple.email"];
    const domain = email.split("@")[1]?.toLowerCase();
    if (domain && blocked.includes(domain)) { setError("Please use a valid email address (disposable/temporary emails are not allowed)"); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters"); return; }
    let cleaned = "";
    if (phone) {
      cleaned = phone.replace(/[\s\-\(\)+]/g, "");
      const phoneOk = cleaned.startsWith("91") && cleaned.length === 12 ? /^[6-9]\d{9}$/.test(cleaned.slice(2)) : /^[6-9]\d{9}$/.test(cleaned);
      if (!phoneOk) { setError("Please enter a valid 10-digit Indian phone number"); return; }
    }
    setLoading(true);
    try {
      await apiFetch("/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email, password, phone: cleaned || undefined, role }),
      });
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12 page-transition">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Join Us</span>
          <h1 className="text-4xl font-display font-bold text-white mt-2">Create Account</h1>
        </div>

        <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8">
          {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs text-dark-400 uppercase tracking-wider mb-3 font-medium">I want to join as</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map((r) => {
                  const Icon = r.icon;
                  return (
                    <button type="button" key={r.value} onClick={() => setRole(r.value)} className={`flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border text-xs transition-all ${role === r.value ? "border-gold-500 bg-gold-500/10 text-gold-400" : "border-dark-700 bg-dark-800/50 text-dark-400 hover:border-dark-600"}`}>
                      <Icon size={20} />
                      <span className="font-medium">{r.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Full Name</label>
              <div className="relative">
                <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
              </div>
              <p className="text-dark-600 text-xs mt-1.5">We&apos;ll send a verification code to this email</p>
            </div>
            <div>
              <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Phone <span className="text-dark-600">(optional)</span></label>
              <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="For login via phone" autoComplete="off" className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
            </div>
            <div>
              <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Create Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Min. 6 characters" required minLength={6} autoComplete="new-password" className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20 disabled:opacity-50">
              {loading ? "Sending OTP..." : "Send Verification Code"}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-dark-500 mt-8">
          Already have an account?{" "}
          <Link href="/login" className="text-gold-400 font-medium hover:text-gold-300 transition-colors">Sign in</Link>
        </p>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
