"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { MessageSquare, Clock, CheckCircle, Loader, Send, ChevronDown, ChevronUp } from "lucide-react";

interface Query {
  id: string;
  subject: string;
  message: string;
  status: string;
  replyMessage: string | null;
  repliedAt: string | null;
  createdAt: string;
}

const statusConfig: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pending", color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", icon: Clock },
  "in-progress": { label: "In Progress", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", icon: Loader },
  replied: { label: "Replied", color: "text-green-400", bg: "bg-green-500/10 border-green-500/20", icon: MessageSquare },
  resolved: { label: "Resolved", color: "text-gold-400", bg: "bg-gold-500/10 border-gold-500/20", icon: CheckCircle },
};

export default function QueriesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) { router.push("/login"); return; }
    if (user) {
      apiFetch("/messages/my")
        .then((data) => { if (Array.isArray(data)) setQueries(data); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [user, authLoading, router]);

  if (authLoading || loading) {
    return (
      <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 text-center">
        <div className="w-10 h-10 border-2 border-dark-700 border-t-gold-500 rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto px-6 pt-32 pb-24 page-transition">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-12">
        <div>
          <span className="text-gold-400 text-xs font-semibold uppercase tracking-[0.3em]">Support</span>
          <h1 className="text-4xl md:text-5xl font-display font-bold text-white mt-2">My Queries</h1>
          <p className="text-dark-400 mt-2">{queries.length} quer{queries.length !== 1 ? "ies" : "y"}</p>
        </div>
        <Link href="/contact" className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-6 py-3 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
          <Send size={16} /> New Query
        </Link>
      </div>

      {queries.length === 0 ? (
        <div className="text-center py-24">
          <MessageSquare size={48} className="text-dark-700 mx-auto mb-4" />
          <p className="text-dark-500 text-lg mb-4">No queries yet</p>
          <Link href="/contact" className="bg-gradient-to-r from-gold-500 to-gold-600 text-dark-950 px-8 py-4 rounded-xl font-semibold inline-flex items-center gap-2 transition-all hover:shadow-lg hover:shadow-gold-500/20">
            <Send size={18} /> Send Your First Query
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {queries.map((query) => {
            const cfg = statusConfig[query.status] || statusConfig.pending;
            const StatusIcon = cfg.icon;
            const expanded = expandedId === query.id;
            return (
              <div key={query.id} className="bg-dark-900/60 border border-dark-800/50 rounded-2xl overflow-hidden hover:border-gold-500/20 transition-colors">
                <button onClick={() => setExpandedId(expanded ? null : query.id)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <span className={`text-xs font-medium px-3 py-1 rounded-full border shrink-0 ${cfg.bg} ${cfg.color}`}>
                      <StatusIcon size={12} className="inline mr-1" />
                      {cfg.label}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">{query.subject}</p>
                      <p className="text-xs text-dark-500 mt-0.5">{new Date(query.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                    </div>
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-dark-500 shrink-0" /> : <ChevronDown size={16} className="text-dark-500 shrink-0" />}
                </button>

                {expanded && (
                  <div className="px-6 pb-6 space-y-4 border-t border-dark-800/50 pt-4">
                    <div className="bg-dark-800/30 rounded-xl p-4">
                      <p className="text-[10px] text-dark-500 uppercase tracking-wider mb-2 font-medium">Your Message</p>
                      <p className="text-sm text-dark-300 leading-relaxed whitespace-pre-wrap">{query.message}</p>
                    </div>
                    {query.replyMessage && (
                      <div className="bg-gold-500/5 border border-gold-500/10 rounded-xl p-4">
                        <p className="text-[10px] text-gold-400 uppercase tracking-wider mb-2 font-medium">Reply from Batra Technologies</p>
                        <p className="text-sm text-dark-200 leading-relaxed whitespace-pre-wrap">{query.replyMessage}</p>
                        {query.repliedAt && (
                          <p className="text-[10px] text-dark-500 mt-2">
                            Replied on {new Date(query.repliedAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        )}
                      </div>
                    )}
                    {!query.replyMessage && query.status === "pending" && (
                      <p className="text-xs text-dark-500 italic">We&apos;ll respond to your query within 24 hours.</p>
                    )}
                    {!query.replyMessage && query.status === "in-progress" && (
                      <p className="text-xs text-blue-400 italic">Your query is being reviewed by our team.</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
