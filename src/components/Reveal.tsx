"use client";

import { useRef, useEffect, useState, ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  direction?: "up" | "left" | "right" | "scale";
  delay?: number;
  duration?: number;
  className?: string;
}

export default function Reveal({ children, direction = "up", delay = 0, duration = 800, className = "" }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.unobserve(el); } },
      { threshold: 0.12 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const directionClass = {
    up: "translate-y-[50px]",
    left: "-translate-x-[50px]",
    right: "translate-x-[50px]",
    scale: "scale-90",
  }[direction];

  return (
    <div
      ref={ref}
      className={`transition-all overflow-hidden ${className}`}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0) scale(1)" : undefined,
        transitionDuration: `${duration}ms`,
        transitionTimingFunction: "cubic-bezier(0.16, 1, 0.3, 1)",
        transitionDelay: `${delay}ms`,
        ...(visible ? {} : {}),
      }}
    >
      <div style={{
        opacity: visible ? 1 : 0,
        transform: visible
          ? "translate(0) scale(1)"
          : direction === "scale" ? "scale(0.9)" :
            direction === "left" ? "translateX(-50px)" :
            direction === "right" ? "translateX(50px)" : "translateY(50px)",
        transition: `opacity ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms, transform ${duration}ms cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
      }}>
        {children}
      </div>
    </div>
  );
}
