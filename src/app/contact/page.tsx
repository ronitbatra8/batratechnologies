"use client";

import { useState } from "react";
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, Check, LogIn } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { apiFetch } from "@/lib/api";

export default function ContactPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!user) { setError("Please sign in to send a message"); return; }
    if (name.trim().length < 2) { setError("Name must be at least 2 characters"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Please enter a valid email address"); return; }
    if (!subject) { setError("Please select a subject"); return; }
    if (message.trim().length < 3) { setError("Message must be at least 3 characters"); return; }
    setLoading(true);
    try {
      await apiFetch("/messages", {
        method: "POST",
        body: JSON.stringify({ name: name.trim(), email: email.trim(), subject, message: message.trim() }),
      });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-transition">
      <section className="relative min-h-[50vh] flex items-center overflow-hidden">
        <div className="absolute inset-0">
          <img src="https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&h=1080&fit=crop" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-dark-950/85" />
        </div>
        <div className="max-w-7xl mx-auto px-6 relative z-10 py-32">
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Get in Touch</span>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mt-3">Contact</h1>
          <p className="text-dark-300 text-lg mt-4 max-w-lg font-light">Have a question? Our concierge team is at your service.</p>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 py-24">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="space-y-6">
            {[
              { icon: MapPin, title: "Visit", details: ["Ganj Road / Khairtal Road", "Kishangarh Bas, Alwar, Rajasthan"] },
              { icon: Phone, title: "Call", details: ["9351396757"] },
              { icon: Mail, title: "Email", details: ["batratechnologies@gmail.com", "batra.ronit.08.11@gmail.com"] },
              { icon: Clock, title: "Hours", details: ["24/7 — All Days"] },
            ].map((item) => (
              <div key={item.title} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6 flex gap-4 hover:border-gold-500/20 transition-colors">
                <div className="w-12 h-12 bg-gold-500/10 rounded-xl flex items-center justify-center shrink-0 border border-gold-500/10">
                  <item.icon size={20} className="text-gold-500" />
                </div>
                <div>
                  <h3 className="font-display font-semibold text-white mb-1">{item.title}</h3>
                  {item.details.map((d, i) => (<p key={i} className="text-sm text-dark-400">{d}</p>))}
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-2">
            <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8">
              {submitted ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/20">
                    <Check size={28} className="text-green-400" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">Message Sent</h2>
                  <p className="text-dark-400">We&apos;ve received your message and will respond within 24 hours.</p>
                  <div className="flex gap-4 justify-center mt-6">
                    <button onClick={() => { setSubmitted(false); setMessage(""); setSubject(""); }} className="text-gold-400 text-sm font-medium hover:text-gold-300 transition-colors">
                      Send another message
                    </button>
                    <Link href="/queries" className="text-gold-400 text-sm font-medium hover:text-gold-300 transition-colors">
                      View My Queries
                    </Link>
                  </div>
                </div>
              ) : !user ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-gold-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-gold-500/20">
                    <LogIn size={28} className="text-gold-400" />
                  </div>
                  <h2 className="text-2xl font-display font-bold text-white mb-2">Sign In Required</h2>
                  <p className="text-dark-400 mb-6">Please sign in to send us a message or query.</p>
                  <Link href="/login" className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-gold-500/20">
                    <LogIn size={18} /> Sign In
                  </Link>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-display font-bold text-white mb-8">Send a Message</h2>
                  {error && <p className="text-red-400 text-sm mb-4 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>}
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid md:grid-cols-2 gap-5">
                      <div>
                        <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Name</label>
                        <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                      </div>
                      <div>
                        <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Email</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Subject</label>
                      <select value={subject} onChange={(e) => setSubject(e.target.value)} required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-dark-300 focus:outline-none focus:border-gold-500 transition-colors">
                        <option value="">Select a topic</option>
                        <option>General Inquiry</option>
                        <option>Order Support</option>
                        <option>Returns & Refunds</option>
                        <option>Product Question</option>
                        <option>Business Partnership</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2 font-medium">Message</label>
                      <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={5} placeholder="How can we help?" required className="w-full bg-dark-800 border border-dark-700 rounded-xl px-4 py-3.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors resize-none" />
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-dark-500">Signed in as <span className="text-gold-400">{user.name}</span></p>
                      <button type="submit" disabled={loading} className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-8 py-4 rounded-xl font-semibold transition-all hover:shadow-lg hover:shadow-gold-500/20 flex items-center gap-2 disabled:opacity-50">
                        <Send size={16} /> {loading ? "Sending..." : "Send Message"}
                      </button>
                    </div>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 pb-24">
        <h2 className="text-2xl font-display font-bold text-white mb-8 text-center">Frequently Asked</h2>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
          {[
            { q: "What is your return policy?", a: "30-day hassle-free returns on all products. Items must be in original condition." },
            { q: "Do you offer international shipping?", a: "Currently shipping within India. International coming soon — subscribe for updates." },
            { q: "Are products authentic?", a: "100% authentic, sourced from authorized distributors with full manufacturer warranty." },
            { q: "How do I track my order?", a: "Tracking details are emailed upon shipment. Also available in your account dashboard." },
          ].map((faq) => (
            <div key={faq.q} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-6 hover:border-gold-500/20 transition-colors">
              <h3 className="font-display font-semibold text-white mb-2">{faq.q}</h3>
              <p className="text-sm text-dark-400 leading-relaxed font-light">{faq.a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
