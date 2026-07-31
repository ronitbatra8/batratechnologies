"use client";
import { useRef, useState } from "react";
import { Upload, X, Link2, ImagePlus } from "lucide-react";
import { API_URL } from "@/lib/api";

const MAX_IMAGES = 8;

export default function SellerImageUpload({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [urlInput, setUrlInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const images = value.split("\n").filter(Boolean);

  const addUrl = (url: string) => {
    if (!/^https?:\/\/.+/i.test(url.trim())) {
      setError("Please enter a valid image URL");
      return;
    }
    if (images.length >= MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setError("");
    onChange([...images, url.trim()].join("\n"));
  };

  const uploadFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError("");
    const pending = Array.from(files);
    if (images.length + pending.length > MAX_IMAGES) {
      setError(`Maximum ${MAX_IMAGES} images allowed`);
      return;
    }
    setUploading(true);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("bt-token") : null;
      const list = [...images];
      for (const file of pending) {
        const fd = new FormData();
        fd.append("image", file);
        const res = await fetch(`${API_URL}/seller/upload`, {
          method: "POST",
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || "Upload failed");
        list.push(data.url);
      }
      onChange(list.join("\n"));
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div>
      <label className="block text-xs text-dark-400 uppercase tracking-wider mb-2">Images</label>
      <div className="grid grid-cols-3 gap-3">
        {images.map((url, i) => (
          <div key={i} className="relative aspect-square rounded-xl overflow-hidden border border-dark-800 bg-dark-800/60">
            <img src={url} alt="" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={() => onChange(images.filter((_, j) => j !== i).join("\n"))}
              className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-dark-950/80 border border-white/10 flex items-center justify-center text-dark-300 hover:text-white transition-colors"
              aria-label="Remove image"
            >
              <X size={12} />
            </button>
          </div>
        ))}
        {images.length === 0 && (
          <div className="aspect-square rounded-xl border border-dashed border-dark-700 flex items-center justify-center text-dark-600">
            <ImagePlus size={20} />
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3 mt-3">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gold-500/10 border border-gold-500/30 text-gold-400 text-sm font-medium hover:bg-gold-500/20 transition-colors disabled:opacity-50"
        >
          <Upload size={14} /> {uploading ? "Uploading..." : "Upload from Device"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={e => uploadFiles(e.target.files)} />

        <div className="flex-1 min-w-[180px] flex gap-2">
          <input
            value={urlInput}
            onChange={e => setUrlInput(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); if (urlInput.trim()) { addUrl(urlInput); setUrlInput(""); } } }}
            placeholder="Or paste an image URL"
            className="flex-1 min-w-0 bg-dark-800 border border-dark-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-dark-500 focus:outline-none focus:border-gold-500 transition-colors"
          />
          <button
            type="button"
            onClick={() => { if (urlInput.trim()) { addUrl(urlInput); setUrlInput(""); } }}
            className="px-3 rounded-xl bg-dark-800 border border-dark-700 text-dark-300 hover:text-gold-400 hover:border-gold-500/40 transition-colors"
            aria-label="Add URL"
          >
            <Link2 size={14} />
          </button>
        </div>
      </div>

      {error && <p className="text-red-400 text-xs mt-2">{error}</p>}
      <p className="text-[11px] text-dark-500 mt-2">JPG, PNG, WEBP, GIF or AVIF. Max 5MB each, up to {MAX_IMAGES} images.</p>
    </div>
  );
}
