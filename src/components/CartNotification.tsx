"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Check } from "lucide-react";

export default function CartNotification({ show, productName, onDone }: { show: boolean; productName: string; onDone?: () => void }) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!show) return;
    setVisible(true);
    setLeaving(false);
    let fadeTimer: ReturnType<typeof setTimeout> | undefined;
    const showTimer = setTimeout(() => {
      setLeaving(true);
      fadeTimer = setTimeout(() => {
        setVisible(false);
        setLeaving(false);
        onDoneRef.current?.();
      }, 300);
    }, 2000);
    return () => {
      clearTimeout(showTimer);
      if (fadeTimer) clearTimeout(fadeTimer);
    };
  }, [show]);

  if (!visible) return null;

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] lg:bottom-8 pointer-events-none transition-opacity duration-300 ${leaving ? "opacity-0" : "opacity-100"}`}
    >
      <div className="animate-fade-in-up">
        <div className="bg-dark-900/95 backdrop-luxury border border-gold-500/20 text-white rounded-2xl shadow-2xl shadow-black/50 px-6 py-4 flex items-center gap-3 min-w-[280px]">
          <div className="w-8 h-8 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shrink-0">
            <Check size={16} className="text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-white">Added to Cart</p>
            <p className="text-xs text-dark-400 truncate max-w-[200px]">{productName}</p>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
