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
      className="fixed bottom-24 right-4 sm:bottom-6 sm:right-6 z-50 w-14 h-14 bg-green-500 rounded-full flex items-center justify-center shadow-lg shadow-green-500/30 hover:bg-green-400 hover:scale-110 transition-all duration-300"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size="28" className="text-white" />
    </a>
  );
}
