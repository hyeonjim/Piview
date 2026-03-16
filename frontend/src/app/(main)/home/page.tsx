"use client";

import { useEffect } from "react";
import { Sparkles, ArrowRight, Leaf, Sun, Moon, Droplets, Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SKINCARE_INSIGHTS } from "@/constants";
import { useLocalRoutineStore } from "@/stores/useLocalRoutineStore";
import { ROUTINE_STEPS, type RoutineStep } from "@/constants/routineSteps";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const ROUTINE_DIVIDER = "1px solid rgba(0,0,0,0.05)";

function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)
    return { text: "Morning Glow", icon: <Sun size={13} style={{ color: "#C8A96E" }} /> };
  if (hour >= 12 && hour < 18)
    return { text: "Afternoon Care", icon: <Sun size={13} style={{ color: "#C8A96E" }} /> };
  return { text: "Evening Ritual", icon: <Moon size={13} style={{ color: "#A8A39D" }} /> };
}

const ICON_MAP = {
  droplets: (size: number) => <Droplets size={size} style={{ color: "#8A9468" }} />,
  sun:      (size: number) => <Sun size={size} style={{ color: "#C8A96E" }} />,
  leaf:     (size: number) => <Leaf size={size} style={{ color: "#8A9468" }} />,
};

export default function HomePage() {
  const greeting = getGreeting();
  const nickname  = "User";
  const { routine } = useLocalRoutineStore();

  useEffect(() => { useLocalRoutineStore.persist.rehydrate(); }, []);

  const mainRoutineItems = ROUTINE_STEPS.map((step) => ({
    step,
    product: routine[step.code],
  })).filter((item) => item.product !== null) as {
    step: RoutineStep;
    product: NonNullable<(typeof routine)[string]>;
  }[];

  const hasRoutine = mainRoutineItems.length > 0;

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#F5F2EC" }}>

      {/* ── 상단 헤더 — 연한 베이지 배경 ──────────────────────── */}
      <div
        style={{
          backgroundColor: "#F5F2EC",
          paddingTop: "15px",
          paddingBottom: "20px",
          paddingLeft: "20px",
          paddingRight: "20px",
        }}
      >
        {/* 인사말 */}
        <div className="flex items-center gap-1.5">
          {greeting.icon}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 400,
              color: "#B0A99F",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              fontFamily: "var(--font-cormorant), serif",
              fontStyle: "italic",
            }}
          >
            {greeting.text}
          </span>
        </div>

        <h1
          style={{
            margin: 0,
            fontSize: "26px",
            fontWeight: 700,
            color: "#1C1C1E",
            letterSpacing: "-0.5px",
            lineHeight: 1.2,
            fontFamily: "var(--font-pretendard), sans-serif",
          }}
        >
          {nickname}님,
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "14px", color: "#B0A99F", fontFamily: "var(--font-pretendard), sans-serif" }}>
          오늘의 스킨케어 루틴을 확인하세요
        </p>

        {/* ── AI 진단 배너 ───────────────────────────────── */}
        <Link href="/skin-test" className="block" style={{ marginTop: "16px" }}>
          <div
            className="relative overflow-hidden flex items-center justify-between"
            style={{
              /* 연한 베이지 그라디언트 — 밝고 따뜻한 톤 */
              background: "linear-gradient(135deg, #BFB6AA 0%, #A69D92 100%)",
              borderRadius: "12px",
              padding: "20px",
            }}
          >
            {/* 배경 텍스처 원 */}
            <div style={{ position: "absolute", top: "-20px", right: "10px", width: "80px", height: "80px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.12)" }} />
            <div style={{ position: "absolute", bottom: "-15px", right: "60px", width: "56px", height: "56px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.08)" }} />

            <div style={{ position: "relative", zIndex: 1 }}>
              {/* 뱃지 */}
              <div
                className="flex items-center gap-1.5"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "4px",
                  padding: "4px 8px",
                  marginBottom: "10px",
                }}
              >
                <Sparkles size={11} style={{ color: "#FFFFFF" }} />
                <span style={{ fontSize: "9px", fontWeight: 600, color: "#FFFFFF", letterSpacing: "0.12em", textTransform: "uppercase", fontFamily: "var(--font-pretendard), sans-serif" }}>
                  AI SKIN ANALYSIS
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "#FFFFFF", lineHeight: 1.35, fontFamily: "var(--font-pretendard), sans-serif" }}>
                나만의 피부 타입을<br />분석해보세요
              </p>
            </div>

            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", justifyContent: "center", width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.2)", flexShrink: 0 }}>
              <ArrowRight size={17} style={{ color: "#FFFFFF" }} />
            </div>
          </div>
        </Link>
      </div>

      {/* ── 나의 루틴 ────────────────────────────────────── */}
      <div style={{ padding: "20px 16px 0" }}>
        <div
          style={{
            backgroundColor: "#FFFFFF",
            borderRadius: "12px",
            border: "1px solid #E2DDD8",
            overflow: "hidden",
          }}
        >
          {/* 섹션 헤더 */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "14px 16px",
              borderBottom: "1px solid #EDE9E3",
            }}
          >
            <div className="flex items-center gap-2">
              <Leaf size={14} style={{ color: "#A69D92" }} />
              <span style={{ fontSize: "14px", fontWeight: 700, color: "#2A2118", letterSpacing: "-0.2px", fontFamily: "var(--font-pretendard), sans-serif" }}>
                나의 루틴
              </span>
            </div>
            {hasRoutine ? (
              <span style={{ fontSize: "11px", fontWeight: 600, padding: "3px 10px", borderRadius: "12px", backgroundColor: "#F2EFE9", color: "#A69D92", fontFamily: "var(--font-pretendard), sans-serif" }}>
                {mainRoutineItems.length}단계
              </span>
            ) : (
              <Link href="/mypage">
                <span className="flex items-center gap-0.5" style={{ fontSize: "12px", color: "#A69D92", fontFamily: "var(--font-pretendard), sans-serif" }}>
                  설정하기 <ChevronRight size={12} />
                </span>
              </Link>
            )}
          </div>

          {/* 루틴 리스트 */}
          {hasRoutine ? (
            <div style={{ padding: "0 16px" }}>
              {mainRoutineItems.map(({ step, product }, index) => (
                <div
                  key={step.code}
                  className="flex items-center gap-3"
                  style={{
                    paddingTop: "12px",
                    paddingBottom: "12px",
                    borderBottom: index < mainRoutineItems.length - 1 ? "1px solid #EDE9E3" : "none",
                  }}
                >
                  <span style={{ fontSize: "10px", fontWeight: 700, color: "#BFB6AA", width: "16px", flexShrink: 0, fontFamily: "var(--font-cormorant), serif" }}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span style={{ fontSize: "20px", width: "28px", textAlign: "center", flexShrink: 0 }}>{product.emoji}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: 0, fontSize: "10px", color: "#A69D92", fontWeight: 500, letterSpacing: "0.03em", fontFamily: "var(--font-pretendard), sans-serif" }}>
                      {step.label}
                    </p>
                    <p style={{ margin: "1px 0 0", fontSize: "13px", fontWeight: 600, color: "#2A2118", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", fontFamily: "var(--font-pretendard), sans-serif" }}>
                      {product.name}
                    </p>
                    <p style={{ margin: 0, fontSize: "11px", color: "#BFB6AA", textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "var(--font-pretendard), sans-serif" }}>
                      {product.brand}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center" style={{ padding: "32px 20px" }}>
              <Star size={28} style={{ color: "#D9D5D0", marginBottom: "10px" }} />
              <p style={{ margin: 0, fontSize: "14px", fontWeight: 500, color: "#A69D92", textAlign: "center", fontFamily: "var(--font-pretendard), sans-serif" }}>
                아직 루틴이 없어요
              </p>
              <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#BFB6AA", textAlign: "center", lineHeight: 1.5, fontFamily: "var(--font-pretendard), sans-serif" }}>
                마이페이지에서 루틴을 설정해보세요
              </p>
              <Link href="/mypage">
                <button
                  className="flex items-center gap-1.5 cursor-pointer border-none"
                  style={{
                    marginTop: "14px",
                    padding: "8px 18px",
                    borderRadius: "6px",
                    /* 따뜻한 다크 브라운 — 베이지 테마와 조화 */
                    backgroundColor: "#3D3028",
                    color: "#F2EFE9",
                    fontSize: "12px",
                    fontWeight: 600,
                    fontFamily: "var(--font-pretendard), sans-serif",
                  }}
                >
                  <Leaf size={12} /> 루틴 설정하기
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Skincare Tips ─────────────────────────────────── */}
      <div style={{ padding: "20px 16px 24px" }}>
        {/* 섹션 타이틀 */}
        <div className="flex items-baseline gap-2" style={{ marginBottom: "12px" }}>
          <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#2A2118", letterSpacing: "-0.3px", fontFamily: "var(--font-pretendard), sans-serif" }}>
            Skincare Tips
          </h2>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {SKINCARE_INSIGHTS.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3"
              style={{
                backgroundColor: "#FFFFFF",
                borderRadius: "10px",
                border: "1px solid #E2DDD8",
                padding: "14px",
              }}
            >
              <div
                className="flex items-center justify-center shrink-0"
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  backgroundColor: "#F2EFE9",
                }}
              >
                {ICON_MAP[item.iconName](15)}
              </div>
              <div>
                <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#2A2118", fontFamily: "var(--font-pretendard), sans-serif" }}>
                  {item.label}
                </p>
                <p style={{ margin: "3px 0 0", fontSize: "12px", color: "#A69D92", lineHeight: 1.6, fontFamily: "var(--font-pretendard), sans-serif" }}>
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
