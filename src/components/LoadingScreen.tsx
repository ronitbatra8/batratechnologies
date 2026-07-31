"use client";

import { useState, useEffect } from "react";
import { useLoadingDone } from "./LoadingProvider";

export default function LoadingScreen() {
  const done = useLoadingDone();
  const [show, setShow] = useState(!done);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!show) return;
    const t1 = setTimeout(() => setFadeOut(true), 4800);
    const t2 = setTimeout(() => setShow(false), 5500);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [show]);

  if (!show) return null;

  return (
    <div className={`fixed inset-0 z-[100] bg-dark-950 flex items-center justify-center transition-opacity duration-700 overflow-hidden ${fadeOut ? "opacity-0" : "opacity-100"}`}>
      <div className="flex flex-col items-center select-none px-4">

        {/* Row 1: BT logo + BATRA side by side */}
        <div className="flex items-center gap-2 sm:gap-3 md:gap-5">
          <div className="ld-bt-fall">
            <div className="w-14 h-14 sm:w-20 sm:h-20 md:w-28 md:h-28 rounded-xl sm:rounded-2xl bg-gradient-to-br from-gold-400 to-gold-700 flex items-center justify-center text-dark-950 font-bold text-2xl sm:text-3xl md:text-5xl font-display shadow-2xl shadow-gold-500/40 ld-bt-squash">
              BT
            </div>
          </div>
          <div className="ld-batra">
            <span className="text-white text-4xl sm:text-5xl md:text-8xl font-display font-bold tracking-tight">
              BATRA
            </span>
          </div>
        </div>

        {/* Row 2: TECHNOLOGIES + headphone hanging on T */}
        <div className="ld-tech-row relative overflow-visible">
          {/* Headphone SVG — hangs on the letter T like a wall nail */}
          <div className="ld-headphone absolute" style={{ left: "-20px", top: "-10px" }}>
            <svg className="w-[70px] h-[90px] sm:w-[90px] sm:h-[110px] md:w-[130px] md:h-[160px]" viewBox="0 0 130 160" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ transform: "rotate(-10deg)" }}>
              <defs>
                <linearGradient id="ldHbGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#e4e4e7" />
                  <stop offset="40%" stopColor="#d4d4d8" />
                  <stop offset="100%" stopColor="#71717a" />
                </linearGradient>
                <linearGradient id="ldCupGrad" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#52525b" />
                  <stop offset="100%" stopColor="#18181b" />
                </linearGradient>
                <linearGradient id="ldCupInner" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#27272a" />
                  <stop offset="100%" stopColor="#09090b" />
                </linearGradient>
                <filter id="ldShadow" x="-15%" y="-5%" width="130%" height="120%">
                  <feDropShadow dx="0" dy="6" stdDeviation="8" floodColor="#000" floodOpacity="0.6" />
                </filter>
              </defs>

              <g filter="url(#ldShadow)">
                {/* Headband arc — arches UP, apex sits on T's crossbar */}
                <path d="M18,72 C18,4 112,4 112,72" stroke="url(#ldHbGrad)" strokeWidth="7" fill="none" strokeLinecap="round" />

                {/* Headband cushion pad at apex */}
                <path d="M48,8 C48,1 82,1 82,8 L82,16 C82,20 48,20 48,16 Z" fill="#52525b" opacity="0.8" />

                {/* Left slider arm */}
                <rect x="13" y="70" width="10" height="24" rx="5" fill="#a1a1aa" />
                <rect x="15" y="74" width="6" height="16" rx="3" fill="#d4d4d8" opacity="0.3" />
                {/* Left hinge joint */}
                <ellipse cx="18" cy="94" rx="6" ry="4.5" fill="#71717a" stroke="#52525b" strokeWidth="1" />

                {/* Right slider arm */}
                <rect x="107" y="70" width="10" height="24" rx="5" fill="#a1a1aa" />
                <rect x="109" y="74" width="6" height="16" rx="3" fill="#d4d4d8" opacity="0.3" />
                {/* Right hinge joint */}
                <ellipse cx="112" cy="94" rx="6" ry="4.5" fill="#71717a" stroke="#52525b" strokeWidth="1" />

                {/* ── Left ear cup ── */}
                {/* Outer shell */}
                <ellipse cx="18" cy="124" rx="20" ry="28" fill="url(#ldCupGrad)" />
                {/* Cushion ring */}
                <ellipse cx="18" cy="124" rx="15" ry="22" fill="#27272a" />
                {/* Inner mesh */}
                <ellipse cx="18" cy="124" rx="10" ry="15" fill="url(#ldCupInner)" />
                {/* Center logo dot */}
                <circle cx="18" cy="124" r="3.5" fill="#3f3f46" opacity="0.5" />
                {/* Cup highlight */}
                <ellipse cx="14" cy="116" rx="5" ry="7" fill="#52525b" opacity="0.15" />

                {/* ── Right ear cup ── */}
                {/* Outer shell */}
                <ellipse cx="112" cy="124" rx="20" ry="28" fill="url(#ldCupGrad)" />
                {/* Cushion ring */}
                <ellipse cx="112" cy="124" rx="15" ry="22" fill="#27272a" />
                {/* Inner mesh */}
                <ellipse cx="112" cy="124" rx="10" ry="15" fill="url(#ldCupInner)" />
                {/* Center logo dot */}
                <circle cx="112" cy="124" r="3.5" fill="#3f3f46" opacity="0.5" />
                {/* Cup highlight */}
                <ellipse cx="108" cy="116" rx="5" ry="7" fill="#52525b" opacity="0.15" />
              </g>
            </svg>
          </div>

          <span className="text-dark-400 text-4xl sm:text-5xl md:text-8xl font-display font-bold tracking-tight relative">
            T
          </span>
          <span className="text-dark-400 text-4xl sm:text-5xl md:text-8xl font-display font-bold tracking-tight">
            ECHNOLOGIES
          </span>
        </div>

      </div>
    </div>
  );
}
