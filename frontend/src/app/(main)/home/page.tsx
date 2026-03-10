"use client";

import { Sparkles, ArrowRight, Leaf, Sun, Moon, Droplets, Settings } from "lucide-react";
import Link from "next/link";
import { SKINCARE_INSIGHTS } from "@/constants";
import { getRoutineInfo } from "@/constants/_mock/routine";

function getGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)  return { text: "Good Morning",   icon: <Sun  size={16} color="var(--color-warm-amber)" /> };
  if (h >= 12 && h < 18) return { text: "Good Afternoon", icon: <Sun  size={16} color="var(--color-warm-amber)" /> };
  return                         { text: "Good Evening",   icon: <Moon size={16} color="var(--color-warm-beige)" /> };
}

const ICON_MAP = {
  droplets: (size: number) => <Droplets size={size} className="text-brand" />,
  sun:      (size: number) => <Sun      size={size} className="text-warm-amber" />,
  leaf:     (size: number) => <Leaf     size={size} className="text-brand" />,
};

export default function HomePage() {
  const greeting = getGreeting();
  const routine  = getRoutineInfo();
  const nickname = "User";

  return (
    <div className="flex flex-col min-h-full overflow-y-auto bg-warm-bg">

      {/* 헤더 */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-1.5 mb-1">
          {greeting.icon}
          <span className="text-warm-beige font-medium"
            style={{ fontSize: "13px", letterSpacing: "1.5px", textTransform: "uppercase" }}>
            {greeting.text}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-text-primary font-bold"
              style={{ fontSize: "28px", letterSpacing: "-0.3px", margin: 0, lineHeight: 1.2 }}>
              {nickname}님,
            </h1>
            <p className="text-text-muted mt-1" style={{ fontSize: "15px" }}>
              오늘의 스킨케어 루틴을 확인해보세요
            </p>
          </div>
          <button className="bg-white border-none flex items-center justify-center cursor-pointer"
            style={{ width: "36px", height: "36px", borderRadius: "50%", boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}>
            <Settings size={18} color="var(--color-warm-beige)" />
          </button>
        </div>
      </div>

      {/* AI 피부 진단 배너 */}
      <div className="mx-5 mt-5">
        <Link href="/skin-test" className="block">
          <button className="w-full border-none cursor-pointer relative overflow-hidden"
            style={{ borderRadius: "20px", padding: "0",
              background: "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)",
              minHeight: "140px" }}>
            <div className="absolute" style={{ top: "-40px", right: "60px", width: "100px", height: "100px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.06)" }} />
            <div className="absolute" style={{ bottom: "-30px", right: "40px", width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.04)" }} />
            <div className="flex items-center justify-between relative" style={{ padding: "24px", zIndex: 10 }}>
              <div className="text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center"
                    style={{ width: "32px", height: "32px", borderRadius: "10px", backgroundColor: "rgba(255,255,255,0.2)" }}>
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "rgba(255,255,255,0.8)", letterSpacing: "1.5px", textTransform: "uppercase" }}>
                    AI Skin Analysis
                  </span>
                </div>
                <p style={{ fontSize: "20px", fontWeight: 700, color: "#fff", margin: 0, lineHeight: 1.3 }}>
                  나만의 피부 타입을<br />분석해보세요
                </p>
                <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.7)", marginTop: "8px" }}>
                  맞춤 루틴을 추천받을 수 있어요
                </p>
              </div>
              <div className="flex items-center justify-center shrink-0"
                style={{ width: "48px", height: "48px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)" }}>
                <ArrowRight size={22} color="#fff" />
              </div>
            </div>
          </button>
        </Link>
      </div>

      {/* 오늘의 루틴 */}
      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-bold" style={{ fontSize: "18px", letterSpacing: "-0.2px", margin: 0 }}>
            오늘의 루틴
          </h2>
          <span className="text-brand font-medium" style={{ fontSize: "13px", letterSpacing: "0.5px" }}>
            {routine.label} {routine.emoji}
          </span>
        </div>
        <div className="flex flex-col">
          {routine.steps.map((item, i) => (
            <div key={item.step} className="flex items-center gap-4"
              style={{ padding: "14px 0", borderBottom: i < routine.steps.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none" }}>
              <div className="flex flex-col items-center" style={{ width: "28px" }}>
                <div className="flex items-center justify-center"
                  style={{ width: "28px", height: "28px", borderRadius: "50%",
                    backgroundColor: i === 0 ? "var(--color-brand)" : "#F5F0E8" }}>
                  <span style={{ fontSize: "12px", fontWeight: 600, color: i === 0 ? "#fff" : "var(--color-warm-beige)" }}>
                    {item.step}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <div className="flex-1">
                <p className="text-text-primary font-semibold" style={{ fontSize: "15px", margin: 0 }}>{item.name}</p>
                <p className="text-warm-beige" style={{ fontSize: "13px", margin: 0, marginTop: "1px" }}>{item.sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Skincare Tips */}
      <div className="px-5 mt-7">
        <h2 className="text-text-primary font-bold" style={{ fontSize: "18px", letterSpacing: "-0.2px", margin: 0, marginBottom: "14px" }}>
          Skincare Tips
        </h2>
        <div className="flex flex-col gap-3">
          {SKINCARE_INSIGHTS.map((item) => (
            <div key={item.label} className="flex items-start gap-4 p-4 bg-bg-beige" style={{ borderRadius: "16px" }}>
              <div className="bg-white flex items-center justify-center shrink-0"
                style={{ width: "40px", height: "40px", borderRadius: "12px" }}>
                {ICON_MAP[item.iconName](18)}
              </div>
              <div>
                <p className="text-text-primary font-semibold" style={{ fontSize: "15px", margin: 0 }}>{item.label}</p>
                <p className="text-text-muted" style={{ fontSize: "13px", margin: 0, marginTop: "3px", lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "96px" }} />
    </div>
  );
}
