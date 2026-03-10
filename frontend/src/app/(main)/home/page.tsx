"use client";

import {
  Sparkles,
  ArrowRight,
  Leaf,
  Sun,
  Moon,
  Droplets,
  Settings,
} from "lucide-react";
import Link from "next/link";

function getGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)
    return {
      text: "Good Morning",
      icon: <Sun size={16} className="text-warm-amber" />,
    };
  if (h >= 12 && h < 18)
    return {
      text: "Good Afternoon",
      icon: <Sun size={16} className="text-warm-amber" />,
    };
  return {
    text: "Good Evening",
    icon: <Moon size={16} className="text-warm-beige" />,
  };
}

const morningSteps = [
  { step: 1, name: "클렌저", sub: "Gentle Cleanser", icon: "🫧" },
  { step: 2, name: "토너", sub: "Hydrating Toner", icon: "💧" },
  { step: 3, name: "세럼", sub: "Vitamin C Serum", icon: "✨" },
  { step: 4, name: "크림", sub: "Moisturizer", icon: "🤍" },
  { step: 5, name: "선크림", sub: "SPF 50+", icon: "☀️" },
];
const afternoonSteps = [
  { step: 1, name: "미스트", sub: "Hydrating Mist", icon: "💦" },
  { step: 2, name: "선크림", sub: "SPF 50+ 덧바르기", icon: "☀️" },
  { step: 3, name: "립밤", sub: "Lip Moisturizer", icon: "💋" },
];
const eveningSteps = [
  { step: 1, name: "클렌징", sub: "Oil / Balm Cleanser", icon: "🧴" },
  { step: 2, name: "폼클렌저", sub: "Foam Cleanser", icon: "🫧" },
  { step: 3, name: "토너", sub: "Calming Toner", icon: "💧" },
  { step: 4, name: "세럼", sub: "Retinol / Repair Serum", icon: "✨" },
  { step: 5, name: "나이트크림", sub: "Night Cream", icon: "🌙" },
];

function getRoutineInfo() {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)
    return { label: "Morning", emoji: "☀️", steps: morningSteps };
  if (h >= 12 && h < 18)
    return { label: "Afternoon", emoji: "🌤️", steps: afternoonSteps };
  return { label: "Evening", emoji: "🌙", steps: eveningSteps };
}

const insights = [
  {
    label: "수분 관리",
    desc: "충분한 수분 공급이 건강한 피부의 기본입니다",
    icon: <Droplets size={18} className="text-brand" />,
  },
  {
    label: "자외선 차단",
    desc: "외출 30분 전 선크림을 꼼꼼히 발라주세요",
    icon: <Sun size={18} className="text-warm-amber" />,
  },
  {
    label: "성분 체크",
    desc: "내 피부에 맞는 성분을 알면 루틴이 달라져요",
    icon: <Leaf size={18} className="text-brand" />,
  },
];

export default function HomePage() {
  const greeting = getGreeting();
  const routine = getRoutineInfo();
  const nickname = "User";

  return (
    <div className="flex flex-col min-h-full overflow-y-auto bg-warm-bg">
      {/* ── 헤더 ── */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-1.5 mb-1">
          {greeting.icon}
          <span
            className="text-warm-beige font-medium"
            style={{
              fontSize: "13px",
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            {greeting.text}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-text-primary font-bold"
              style={{
                fontSize: "28px",
                letterSpacing: "-0.3px",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {nickname}님,
            </h1>
            <p
              className="text-text-muted font-normal mt-1"
              style={{ fontSize: "15px" }}
            >
              오늘의 스킨케어 루틴을 확인해보세요
            </p>
          </div>
          <button
            className="bg-white border-none flex items-center justify-center cursor-pointer"
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
            }}
          >
            <Settings size={18} className="text-warm-beige" />
          </button>
        </div>
      </div>

      {/* ── AI 피부 진단 배너 ── */}
      <div className="mx-5 mt-5">
        <Link href="/skin-test" className="block">
          <button
            className="w-full border-none cursor-pointer relative overflow-hidden"
            style={{
              borderRadius: "20px",
              padding: "0",
              background:
                "linear-gradient(135deg, var(--color-brand) 0%, var(--color-brand-dark) 100%)",
              minHeight: "140px",
            }}
          >
            <div
              className="absolute"
              style={{
                top: "-40px",
                right: "60px",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            />
            <div
              className="absolute"
              style={{
                bottom: "-30px",
                right: "40px",
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.04)",
              }}
            />
            <div
              className="flex items-center justify-between relative"
              style={{ padding: "24px", zIndex: 10 }}
            >
              <div className="text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="flex items-center justify-center"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(255,255,255,0.2)",
                    }}
                  >
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <span
                    style={{
                      fontSize: "13px",
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.8)",
                      letterSpacing: "1.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    AI Skin Analysis
                  </span>
                </div>
                <p
                  style={{
                    fontSize: "20px",
                    fontWeight: 700,
                    color: "#fff",
                    margin: 0,
                    lineHeight: 1.3,
                  }}
                >
                  나만의 피부 타입을
                  <br />
                  분석해보세요
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "rgba(255,255,255,0.7)",
                    marginTop: "8px",
                  }}
                >
                  맞춤 루틴을 추천받을 수 있어요
                </p>
              </div>
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                }}
              >
                <ArrowRight size={22} color="#fff" />
              </div>
            </div>
          </button>
        </Link>
      </div>

      {/* ── 오늘의 루틴 ── */}
      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2
            className="text-text-primary font-bold"
            style={{ fontSize: "18px", letterSpacing: "-0.2px", margin: 0 }}
          >
            오늘의 루틴
          </h2>
          <span
            className="text-brand font-medium"
            style={{ fontSize: "13px", letterSpacing: "0.5px" }}
          >
            {routine.label} {routine.emoji}
          </span>
        </div>
        <div className="flex flex-col">
          {routine.steps.map((item, i) => (
            <div
              key={item.step}
              className="flex items-center gap-4"
              style={{
                padding: "14px 0",
                borderBottom:
                  i < routine.steps.length - 1
                    ? "1px solid rgba(0,0,0,0.05)"
                    : "none",
              }}
            >
              <div
                className="flex flex-col items-center"
                style={{ width: "28px" }}
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: i === 0 ? "var(--color-brand)" : "#F5F0E8",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: i === 0 ? "#fff" : "var(--color-warm-beige)",
                    }}
                  >
                    {item.step}
                  </span>
                </div>
              </div>
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              <div className="flex-1">
                <p
                  className="text-text-primary font-semibold"
                  style={{ fontSize: "15px", margin: 0 }}
                >
                  {item.name}
                </p>
                <p
                  className="text-warm-beige"
                  style={{ fontSize: "13px", margin: 0, marginTop: "1px" }}
                >
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Skincare Tips ── */}
      <div className="px-5 mt-7">
        <h2
          className="text-text-primary font-bold mb-3"
          style={{
            fontSize: "18px",
            letterSpacing: "-0.2px",
            margin: 0,
            marginBottom: "14px",
          }}
        >
          Skincare Tips
        </h2>
        <div className="flex flex-col gap-3">
          {insights.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 p-4 bg-bg-beige"
              style={{ borderRadius: "16px" }}
            >
              <div
                className="bg-white flex items-center justify-center shrink-0"
                style={{ width: "40px", height: "40px", borderRadius: "12px" }}
              >
                {item.icon}
              </div>
              <div>
                <p
                  className="text-text-primary font-semibold"
                  style={{ fontSize: "15px", margin: 0 }}
                >
                  {item.label}
                </p>
                <p
                  className="text-text-muted"
                  style={{
                    fontSize: "13px",
                    margin: 0,
                    marginTop: "3px",
                    lineHeight: 1.5,
                  }}
                >
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ height: "96px" }} />
    </div>
  );
}
