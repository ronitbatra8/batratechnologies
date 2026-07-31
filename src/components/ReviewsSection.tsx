"use client";

import { useState, useEffect } from "react";
import { Star, Trash2, Send } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";

interface ReviewItem {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  user: { id: string; name: string };
}

export default function ReviewsSection({ productId }: { productId: string }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewItem[]>([]);
  const [myReview, setMyReview] = useState<ReviewItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    apiFetch(`/reviews/product/${productId}`)
      .then((data) => { if (Array.isArray(data)) setReviews(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  useEffect(() => {
    if (!user) return;
    apiFetch(`/reviews/check/${productId}`)
      .then((data) => { if (data) setMyReview(data); })
      .catch(() => {});
  }, [user, productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (comment.trim().length < 3) { setError("Comment must be at least 3 characters"); return; }
    setSubmitting(true);
    try {
      const res = await apiFetch("/reviews", {
        method: "POST",
        body: JSON.stringify({ productId, rating, comment: comment.trim() }),
      });
      setReviews((prev) => [res, ...prev]);
      setMyReview(res);
      setComment("");
      setRating(5);
      setShowForm(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!myReview) return;
    if (!confirm("Delete your review?")) return;
    try {
      await apiFetch(`/reviews/${myReview.id}`, { method: "DELETE" });
      setReviews((prev) => prev.filter((r) => r.id !== myReview.id));
      setMyReview(null);
    } catch {}
  };

  const avgRating = reviews.length > 0 ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;

  return (
    <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl p-8">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-2xl font-display font-bold text-white">Customer Reviews</h2>
          <div className="flex items-center gap-3 mt-2">
            {reviews.length > 0 && (
              <>
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} className={i < Math.round(avgRating) ? "fill-gold-400 text-gold-400" : "text-dark-700 fill-dark-700"} />
                  ))}
                </div>
                <span className="text-sm text-dark-400">{avgRating.toFixed(1)} &middot; {reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </>
            )}
            {reviews.length === 0 && <span className="text-sm text-dark-500">No reviews yet</span>}
          </div>
        </div>
        {user && !myReview && (
          <button onClick={() => setShowForm(!showForm)} className="bg-gradient-to-r from-gold-500 to-gold-600 hover:from-gold-400 hover:to-gold-500 text-dark-950 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2">
            <Star size={16} /> Write Review
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="mb-8 bg-dark-800/50 rounded-xl p-6 space-y-4">
          <div>
            <label className="text-xs text-dark-400 uppercase tracking-wider mb-2 block">Rating</label>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((s) => (
                <button key={s} type="button" onMouseEnter={() => setHoverRating(s)} onMouseLeave={() => setHoverRating(0)} onClick={() => setRating(s)} className="transition-transform hover:scale-110">
                  <Star size={24} className={(hoverRating || rating) >= s ? "fill-gold-400 text-gold-400" : "text-dark-700 fill-dark-700"} />
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-dark-400 uppercase tracking-wider mb-2 block">Your Review</label>
            <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share your experience with this product..." className="w-full bg-dark-900 border border-dark-700 rounded-xl px-4 py-3 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors resize-none" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button type="submit" disabled={submitting} className="bg-gold-500 hover:bg-gold-400 text-dark-950 px-6 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center gap-2 disabled:opacity-50">
              <Send size={14} /> {submitting ? "Submitting..." : "Submit Review"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-dark-400 hover:text-white text-sm px-4 py-2.5 rounded-xl border border-dark-700 hover:border-dark-500 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="py-12 text-center"><div className="w-8 h-8 border-2 border-dark-700 border-t-gold-500 rounded-full animate-spin mx-auto" /></div>
      ) : reviews.length === 0 ? (
        <p className="text-dark-500 text-center py-12">Be the first to review this product</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="bg-dark-800/30 rounded-xl p-5 border border-dark-800/50">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-gold-500/10 border border-gold-500/20 flex items-center justify-center">
                    <span className="text-gold-400 font-semibold text-xs">{review.user.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-white">{review.user.name}</p>
                    <p className="text-[11px] text-dark-500">{new Date(review.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={12} className={i < review.rating ? "fill-gold-400 text-gold-400" : "text-dark-700 fill-dark-700"} />
                    ))}
                  </div>
                  {user && review.user.id === user.id && (
                    <button onClick={handleDelete} className="text-dark-600 hover:text-red-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-sm text-dark-300 leading-relaxed">{review.comment}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
