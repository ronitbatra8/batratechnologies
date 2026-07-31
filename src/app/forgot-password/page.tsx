"use client";

import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Mail, Phone, Lock, Eye, EyeOff, ShieldCheck, ArrowLeft, KeyRound, CheckCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [identifier, setIdentifier] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [resetToken, setResetToken] = useState("");
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
  }, [resendTimer]);

  const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const isValidPhone = (v: string) => {
    const cleaned = v.replace(/[\s\-\(\)+]/g, "");
    const num = cleaned.startsWith("91") && cleaned.length === 12 ? cleaned.slice(2) : cleaned;
    return /^[6-9]\d{9}$/.test(num);
  };

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const val = identifier.trim();
    if (!val) { setError("Please enter your email or phone number"); return; }
    if (isValidEmail(val)) {
    } else if (isValidPhone(val)) {
    } else {
      setError("Please enter a valid email address or phone number");
      return;
    }

    setLoading(true);
    try {
      const data = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier: val }),
      });
      setMaskedEmail(data.maskedEmail || data.email || "your email");
      setStep(2);
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit OTP"); return; }

    setLoading(true);
    try {
      const data = await apiFetch("/auth/verify-reset-code", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim(), code }),
      });
      setResetToken(data.resetToken);
      setStep(3);
      setError("");
    } catch (err: any) {
      setError(err.message);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (newPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmPassword) { setError("Passwords do not match"); return; }

    setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ resetToken, newPassword }),
      });
      setStep(4);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError("");
    try {
      const data = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ identifier: identifier.trim() }),
      });
      setMaskedEmail(data.maskedEmail || data.email || "your email");
      setResendTimer(60);
      setOtp(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleOTPChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleOTPKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) inputRefs.current[index - 1]?.focus();
  };

  const handleOTPPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length === 6) {
      setOtp(pasted.split(""));
      inputRefs.current[5]?.focus();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6 pt-24 pb-12 page-transition">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          {step === 1 && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-4">
                <KeyRound size={32} className="text-gold-400" />
              </div>
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em] block mb-2">Forgot Password</span>
              <h1 className="text-4xl font-display font-bold text-white">Reset Password</h1>
              <p className="text-dark-400 text-sm mt-3">Enter your email or phone number and we&apos;ll send a verification code to your registered email</p>
            </>
          )}
          {step === 2 && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-4">
                <ShieldCheck size={32} className="text-gold-400" />
              </div>
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em] block mb-2">Verify Identity</span>
              <h1 className="text-4xl font-display font-bold text-white">Enter OTP</h1>
              <p className="text-dark-400 text-sm mt-3">
                We sent a 6-digit code to<br />
                <span className="text-white font-medium">{maskedEmail}</span>
              </p>
            </>
          )}
          {step === 3 && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-500/10 border border-gold-500/20 mb-4">
                <Lock size={32} className="text-gold-400" />
              </div>
              <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em] block mb-2">New Password</span>
              <h1 className="text-4xl font-display font-bold text-white">Set New Password</h1>
              <p className="text-dark-400 text-sm mt-3">Choose a strong password for your account</p>
            </>
          )}
          {step === 4 && (
            <>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-500/10 border border-green-500/20 mb-4">
                <CheckCircle size={32} className="text-green-400" />
              </div>
              <span className="text-green-400 text-xs font-semibold uppercase tracking-[0.3em] block mb-2">Success</span>
              <h1 className="text-4xl font-display font-bold text-white">Password Reset!</h1>
              <p className="text-dark-400 text-sm mt-3">Your password has been updated successfully</p>
            </>
          )}
        </div>

        <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8">
          {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
          {success && <p className="text-green-400 text-sm mb-4 bg-green-500/10 border border-green-500/20 rounded-xl px-4 py-3">{success}</p>}

          {step === 1 && (
            <form onSubmit={handleSendOTP} className="space-y-5">
              <div>
                <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Email or Phone Number</label>
                <div className="relative">
                  {isValidEmail(identifier) ? (
                    <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                  ) : (
                    <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                  )}
                  <input
                    type="text"
                    value={identifier}
                    onChange={(e) => { setIdentifier(e.target.value); setError(""); }}
                    placeholder="Email or phone number"
                    autoComplete="off"
                    className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-11 pr-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors"
                  />
                </div>
                <p className="text-dark-500 text-xs mt-2">The verification code will always be sent to the email linked with your account</p>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20 disabled:opacity-50">
                {loading ? "Sending OTP..." : "Send OTP"}
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div className="grid grid-cols-6 gap-2 sm:gap-3 max-w-sm mx-auto w-full" onPaste={handleOTPPaste}>
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputRefs.current[i] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOTPChange(i, e.target.value)}
                    onKeyDown={(e) => handleOTPKeyDown(i, e)}
                    className="w-full aspect-square text-center text-xl font-bold bg-dark-800 border border-dark-700 rounded-xl text-white focus:outline-none focus:border-gold-500 transition-colors min-w-0"
                  />
                ))}
              </div>
              <button type="submit" disabled={loading || otp.join("").length !== 6} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20 disabled:opacity-50">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>
              <div className="text-center">
                {resendTimer > 0 ? (
                  <p className="text-dark-500 text-sm">Resend OTP in <span className="text-gold-400 font-medium">{resendTimer}s</span></p>
                ) : (
                  <button type="button" onClick={handleResend} className="text-gold-400 text-sm font-medium hover:text-gold-300 transition-colors">
                    Resend OTP
                  </button>
                )}
              </div>
              <button type="button" onClick={() => { setStep(1); setError(""); setOtp(["", "", "", "", "", ""]); }} className="flex items-center gap-2 text-dark-400 hover:text-white text-sm transition-colors mx-auto">
                <ArrowLeft size={14} /> Use a different email or phone
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleResetPassword} className="space-y-5">
              <div>
                <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">New Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(""); }} placeholder="Enter new password" autoComplete="new-password" className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Confirm Password</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-dark-500" />
                  <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }} placeholder="Confirm new password" autoComplete="new-password" className="w-full bg-dark-800 border border-dark-700 rounded-xl pl-11 pr-11 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                  <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-4 top-1/2 -translate-y-1/2 text-dark-500 hover:text-dark-300 transition-colors">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1.5">Passwords do not match</p>
                )}
              </div>
              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20 disabled:opacity-50">
                {loading ? "Resetting..." : "Reset Password"}
              </button>
            </form>
          )}

          {step === 4 && (
            <div className="text-center space-y-6">
              <p className="text-dark-300 text-sm">Your password has been successfully reset. You can now sign in with your new password.</p>
              <button onClick={() => router.push("/login")} className="w-full bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20">
                Sign In
              </button>
            </div>
          )}
        </div>

        <p className="text-center text-sm text-dark-500 mt-8">
          <Link href="/login" className="text-gold-400 font-medium hover:text-gold-300 transition-colors">Back to Sign In</Link>
        </p>
      </div>
    </div>
  );
}
