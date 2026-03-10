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
      className="absolute inset-0 z-50 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #D4C8BC 4.5%, var(--color-bg-base) 50%)",
        opacity: visible ? 1 : 0,
        transition: "opacity 0.6s ease",
      }}
    >
      {/* 장식 원형 */}
      <div
        className="absolute border border-brand"
        style={{
          width: "300px",
          height: "300px",
          borderRadius: "50%",
          opacity: 0.08,
        }}
      />
      <div
        className="absolute border border-brand"
        style={{
          width: "450px",
          height: "450px",
          borderRadius: "50%",
          opacity: 0.05,
        }}
      />

      {/* 리프 아이콘 */}
      <div
        className="flex items-center justify-center bg-brand"
        style={{ width: "48px", height: "48px", borderRadius: "50%" }}
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

      {/* 브랜드명 */}
      <div className="flex flex-col items-center mt-6">
        <p
          className="text-text-primary font-medium"
          style={{ fontSize: "32px", letterSpacing: "-0.5px", margin: 0 }}
        >
          PiView
        </p>
        <p
          style={{
            marginTop: "8px",
            fontSize: "11px",
            color: "#8A8A7A",
            letterSpacing: "3.5px",
            textTransform: "uppercase",
            fontWeight: 400,
          }}
        >
          Natural Skincare
        </p>
      </div>

      {/* 로딩 점 */}
      <div className="absolute bottom-16 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-brand"
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              animation: `pulse 1.2s infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 0.3; } 50% { opacity: 1; } }
      `}</style>
    </div>
  );
}
