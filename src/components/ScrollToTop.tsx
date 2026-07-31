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
      className="fixed bottom-24 left-4 lg:bottom-[6.5rem] lg:right-6 lg:left-auto z-50 w-14 h-14 rounded-full bg-dark-950/55 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-lg shadow-black/40 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-110 active:scale-95"
      aria-label="Scroll to top"
    >
      <ArrowUp size="28" className="text-gold-400" />
    </button>
  );
}
