"use client";

import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";

export default function ScrollToTop() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const onScroll = () => setShow(window.scrollY > 400);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!show) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-[8.75rem] right-4 sm:bottom-8 sm:right-8 z-50 w-12 h-12 bg-gradient-to-br from-gold-500 to-gold-700 hover:from-gold-400 hover:to-gold-600 text-dark-950 rounded-full shadow-lg shadow-gold-500/20 flex items-center justify-center transition-all duration-300 hover:scale-110 hover:shadow-gold-500/30 active:scale-95"
      aria-label="Scroll to top"
    >
      <ArrowUp size={20} />
    </button>
  );
}
