"use client";

import Link from "next/link";
import { useState, useEffect, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { ShieldCheck } from "lucide-react";

function VerifyOTPContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const router = useRouter();

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resendMsg, setResendMsg] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!email) router.push("/register");
  }, [email, router]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP");
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, code }),
      });
      localStorage.setItem("bt-token", res.token);
      window.location.href = "/";
    } catch (err: any) {
      setError(err.message);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendMsg("");
    setError("");
    try {
      await apiFetch("/auth/resend-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      setResendTimer(60);
      setResendMsg("OTP resent successfully!");
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (!email) return null;

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12 page-transition">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-4">
            <ShieldCheck size={32} className="text-gold-400" />
          </div>
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em] block mb-2">Verify Email</span>
          <h1 className="text-4xl font-display font-bold text-white">Enter OTP</h1>
          <p className="text-dark-400 text-sm mt-3">
            We sent a 6-digit code to<br />
            <span className="text-white font-medium">{email}</span>
          </p>
        </div>

        <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8">
          {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          {resendMsg && <p className="text-green-400 text-sm mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">{resendMsg}</p>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => { inputRefs.current[i] = el; }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(i, e)}
                  className="w-12 h-14 text-center text-xl font-bold bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors"
                />
              ))}
            </div>

            <button type="submit" disabled={loading || otp.join("").length !== 6} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20 disabled:opacity-50">
              {loading ? "Verifying..." : "Verify & Create Account"}
            </button>
          </form>

          <div className="text-center mt-6">
            {resendTimer > 0 ? (
              <p className="text-dark-500 text-sm">Resend OTP in <span className="text-gold-400 font-medium">{resendTimer}s</span></p>
            ) : (
              <button onClick={handleResend} className="text-gold-400 text-sm font-medium hover:text-gold-300 transition-colors">
                Resend OTP
              </button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-dark-500 mt-8">
          <Link href="/register" className="text-gold-400 font-medium hover:text-gold-300 transition-colors">Back to Register</Link>
        </p>
      </div>
    </div>
  );
}

export default function VerifyOTPPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold-500/20 border-t-gold-500 rounded-full animate-spin" />
      </div>
    }>
      <VerifyOTPContent />
    </Suspense>
  );
}
