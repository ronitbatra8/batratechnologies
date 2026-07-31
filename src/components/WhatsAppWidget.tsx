"use client";
import { MessageCircle } from "lucide-react";

export default function WhatsAppWidget() {
  const phone = "919351396757";
  const message = encodeURIComponent("Hi Batra Technologies! I have a question about your products.");
  return (
    <a
      href={`https://wa.me/${phone}?text=${message}`}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-24 right-4 lg:bottom-6 lg:right-6 z-50 w-14 h-14 rounded-full bg-dark-950/55 backdrop-blur-2xl backdrop-saturate-150 border border-white/10 shadow-lg shadow-black/40 flex items-center justify-center transition-all duration-300 hover:bg-white/10 hover:scale-110"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size="28" className="text-green-500" />
    </a>
  );
}
