"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function SplashPage() {
  const router = useRouter();
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => router.push("/welcome"), 600);
    }, 2200);
    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden transition-opacity duration-[600ms] ease-in-out"
      style={{
        background: "linear-gradient(160deg, #D4C8BC 4.5%, #ECEADE 50%)",
        opacity: visible ? 1 : 0,
      }}
    >
      {/* Decorative circles - Inner ring */}
      <div
        className="absolute w-[300px] h-[300px] rounded-full border border-[#A2AA7B] opacity-[0.08]"
        style={{
          animation: "splashScaleIn 1.2s ease both",
        }}
      />

      {/* Decorative circles - Outer ring */}
      <div
        className="absolute w-[450px] h-[450px] rounded-full border border-[#A2AA7B] opacity-[0.05]"
        style={{
          animation: "splashScaleIn 1.4s 0.15s ease both",
        }}
      />

      {/* Leaf icon with circle background */}
      <div
        className="flex items-center justify-center w-12 h-12 rounded-full bg-[#A2AA7B] opacity-0"
        style={{
          animation: "splashFadeUp 0.7s 0.2s ease both",
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 24 24"
          fill="none"
          stroke="white"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M11 20A7 7 0 0 1 9.8 6.9C15.5 4.9 17 3.5 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
          <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
        </svg>
      </div>

      {/* Brand name */}
      <div
        className="flex flex-col items-center mt-6"
        style={{ animation: "splashFadeUp 0.6s 0.4s ease both" }}
      >
        <p
          className="text-[32px] font-semibold text-[#1A1A1A] tracking-[-0.5px] m-0"
          style={{ fontFamily: "var(--font-english)" }}
        >
          PiView
        </p>
        <p
          className="mt-2 text-[11px] text-[#8A8A7A] tracking-[3.5px] uppercase font-normal opacity-0"
          style={{
            fontFamily: "var(--font-english)",
            animation: "splashFadeIn 0.5s 0.7s ease both",
          }}
        >
          Natural Skincare
        </p>
      </div>

      {/* Loading dots */}
      <div
        className="absolute bottom-16 flex gap-1.5 opacity-0"
        style={{ animation: "splashFadeIn 0.4s 1.0s ease both" }}
      >
        {[0, 1, 2].map((index) => (
          <div
            key={index}
            className="w-1 h-1 rounded-full bg-[#A2AA7B]"
            style={{
              animation: `pulse 1.2s infinite ${index * 0.2}s`,
            }}
          />
        ))}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }
        @keyframes splashScaleIn {
          from { transform: scale(0); opacity: 0; }
          to   { transform: scale(1); }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes splashFadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
