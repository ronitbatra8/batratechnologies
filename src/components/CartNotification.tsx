"use client";

import { useEffect, useState } from "react";
import { Check } from "lucide-react";

export default function CartNotification({ show, productName }: { show: boolean; productName: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setVisible(true);
      const t = setTimeout(() => setVisible(false), 2000);
      return () => clearTimeout(t);
    }
  }, [show]);

  if (!visible) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] animate-fade-in-up lg:bottom-8">
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
  );
}
