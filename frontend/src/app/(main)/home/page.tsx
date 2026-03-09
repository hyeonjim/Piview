"use client";

import { useState } from "react";
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

/* ── 색상 토큰 (피그마 ThemeContext 원본) ── */
const C = {
  primary: "#A2AA7B",
  primaryBg: "#F0F2E8",
  primaryLight: "#C5CBA8",
  warm: "#C28C7E",
  beigeBg: "#F8F6F0",
  surfaceWarm: "#FFFAF5",
  text: "#1a1a1a",
  textMuted: "#9E9E9E",
  border: "#F0F0F0",
};

/* ── 인사말 ── */
function getGreeting(): { text: string; icon: React.ReactNode } {
  const h = new Date().getHours();
  if (h >= 5 && h < 12)
    return { text: "Good Morning", icon: <Sun size={16} color="#D4A96A" /> };
  if (h >= 12 && h < 18)
    return { text: "Good Afternoon", icon: <Sun size={16} color="#D4A96A" /> };
  return { text: "Good Evening", icon: <Moon size={16} color="#B8A99A" /> };
}

/* ── 루틴 데이터 ── */
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

/* ── 스킨케어 인사이트 ── */
const insights = [
  {
    label: "수분 관리",
    desc: "충분한 수분 공급이 건강한 피부의 기본입니다",
    icon: <Droplets size={18} color="#A2AA7B" />,
  },
  {
    label: "자외선 차단",
    desc: "외출 30분 전 선크림을 꼼꼼히 발라주세요",
    icon: <Sun size={18} color="#D4A96A" />,
  },
  {
    label: "성분 체크",
    desc: "내 피부에 맞는 성분을 알면 루틴이 달라져요",
    icon: <Leaf size={18} color="#A2AA7B" />,
  },
];

export default function HomePage() {
  const greeting = getGreeting();
  const routine = getRoutineInfo();
  const nickname = "User";

  return (
    <div
      className="flex flex-col min-h-full overflow-y-auto"
      style={{ backgroundColor: C.surfaceWarm }}
    >
      {/* ── 헤더 ── 피그마: px-6 pt-14 pb-2 */}
      <div className="px-6 pt-14 pb-2">
        <div
          className="flex items-center"
          style={{ gap: "6px", marginBottom: "4px" }}
        >
          {greeting.icon}
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: "#B8A99A",
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
              style={{
                fontSize: "28px",
                fontWeight: 700,
                color: C.text,
                letterSpacing: "-0.3px",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {nickname}님,
            </h1>
            <p
              style={{
                fontSize: "15px",
                color: C.textMuted,
                marginTop: "4px",
                fontWeight: 400,
              }}
            >
              오늘의 스킨케어 루틴을 확인해보세요
            </p>
          </div>
          <button
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: "white",
              border: "none",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
              cursor: "pointer",
            }}
          >
            <Settings size={18} color="#8A7B64" />
          </button>
        </div>
      </div>

      {/* ── AI 피부 진단 배너 ── 피그마: mx-5 mt-5, borderRadius 20px, minHeight 140px */}
      <div className="mx-5 mt-5">
        <Link href="/skin-test" className="block">
          <button
            className="w-full border-none cursor-pointer relative overflow-hidden"
            style={{
              borderRadius: "20px",
              padding: "0",
              background:
                "linear-gradient(135deg, #A2AA7B 0%, #8A9A6B 50%, #7B8F5E 100%)",
              minHeight: "140px",
            }}
          >
            {/* 배경 원형 장식 */}
            <div
              style={{
                position: "absolute",
                top: "-40px",
                right: "60px",
                width: "100px",
                height: "100px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.06)",
              }}
            />
            <div
              style={{
                position: "absolute",
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
              style={{
                padding: "24px",
                zIndex: 10,
              }}
            >
              <div className="text-left">
                {/* 뱃지 행 */}
                <div
                  className="flex items-center"
                  style={{ gap: "8px", marginBottom: "8px" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "10px",
                      backgroundColor: "rgba(255,255,255,0.2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
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
                {/* 타이틀 */}
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
                {/* 서브텍스트 */}
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

              {/* 화살표 버튼 */}
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <ArrowRight size={22} color="#fff" />
              </div>
            </div>
          </button>
        </Link>
      </div>

      {/* ── 오늘의 루틴 ── 피그마: px-5 mt-7 */}
      <div className="px-5 mt-7">
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: "16px" }}
        >
          <h2
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: C.text,
              letterSpacing: "-0.2px",
              margin: 0,
            }}
          >
            오늘의 루틴
          </h2>
          <span
            style={{
              fontSize: "13px",
              fontWeight: 500,
              color: C.primary,
              letterSpacing: "0.5px",
            }}
          >
            {routine.label} {routine.emoji}
          </span>
        </div>

        {/* 루틴 아이템 리스트 — 피그마: gap-0, padding 14px 0, 구분선 borderBottom */}
        <div className="flex flex-col">
          {routine.steps.map((item, i) => (
            <div
              key={item.step}
              className="flex items-center"
              style={{
                gap: "16px",
                padding: "14px 0",
                borderBottom:
                  i < routine.steps.length - 1
                    ? "1px solid rgba(0,0,0,0.05)"
                    : "none",
              }}
            >
              {/* 스텝 번호 — 피그마: w/h 28px, borderRadius 50%, 첫번째만 primary 색 */}
              <div
                className="flex flex-col items-center"
                style={{ width: "28px" }}
              >
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    backgroundColor: i === 0 ? C.primary : "#F5F0E8",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 600,
                      color: i === 0 ? "#fff" : "#B8A99A",
                    }}
                  >
                    {item.step}
                  </span>
                </div>
              </div>
              {/* 이모지 — 피그마: fontSize 20px */}
              <span style={{ fontSize: "20px" }}>{item.icon}</span>
              {/* 텍스트 */}
              <div className="flex-1">
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  {item.name}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#B8A99A",
                    margin: 0,
                    marginTop: "1px",
                  }}
                >
                  {item.sub}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Skincare Tips ── 피그마: px-5 mt-7 */}
      <div className="px-5 mt-7">
        <h2
          style={{
            fontSize: "18px",
            fontWeight: 700,
            color: C.text,
            letterSpacing: "-0.2px",
            margin: 0,
            marginBottom: "14px",
          }}
        >
          Skincare Tips
        </h2>
        <div className="flex flex-col" style={{ gap: "12px" }}>
          {insights.map((item) => (
            <div
              key={item.label}
              className="flex items-start"
              style={{
                gap: "16px",
                padding: "16px",
                borderRadius: "16px",
                backgroundColor: "#F8F5EF",
              }}
            >
              {/* 아이콘 컨테이너 — 피그마: w/h 40px, borderRadius 12px, bg white */}
              <div
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "12px",
                  backgroundColor: "#fff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                {item.icon}
              </div>
              <div>
                <p
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: C.text,
                    margin: 0,
                  }}
                >
                  {item.label}
                </p>
                <p
                  style={{
                    fontSize: "13px",
                    color: "#9E9E9E",
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

      {/* 하단 여백 — 피그마: height 32px */}
      <div style={{ height: "96px" }} />
    </div>
  );
}
