"use client";

import { Sparkles, ArrowRight, Leaf, Sun, Moon, Droplets, Settings, Star } from "lucide-react";
import Link from "next/link";
import { SKINCARE_INSIGHTS } from "@/constants";
import { COLOR_BRAND } from "@/constants/colors";
import { useLocalRoutineStore, ROUTINE_STEP_META } from "@/stores/useLocalRoutineStore";

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

const P = COLOR_BRAND;

export default function HomePage() {
  const greeting  = getGreeting();
  const nickname  = "User";

  // 마이페이지와 공유하는 루틴 store
  const { routine } = useLocalRoutineStore();

  // 채워진 스텝만 순서대로 추출
  const mainRoutineItems = ROUTINE_STEP_META
    .map((meta) => ({ meta, product: routine[meta.code] }))
    .filter((item) => item.product !== null) as {
      meta: typeof ROUTINE_STEP_META[number];
      product: NonNullable<typeof routine[string]>;
    }[];

  const hasRoutine = mainRoutineItems.length > 0;

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

      {/* ── 나의 루틴 (메인루틴 표시) ─────────────────────────────── */}
      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-text-primary font-bold"
            style={{ fontSize: "18px", letterSpacing: "-0.2px", margin: 0 }}>
            나의 루틴
          </h2>
          {hasRoutine ? (
            <span style={{ fontSize: "13px", fontWeight: 500, color: P, letterSpacing: "0.5px" }}>
              {mainRoutineItems.length}단계
            </span>
          ) : (
            <Link href="/mypage">
              <span style={{ fontSize: "13px", fontWeight: 500, color: P, letterSpacing: "0.5px", cursor: "pointer" }}>
                설정하기 →
              </span>
            </Link>
          )}
        </div>

        {hasRoutine ? (
          /* 루틴 제품 목록 */
          <div className="flex flex-col">
            {mainRoutineItems.map(({ meta, product }, i) => (
              <div key={meta.code} className="flex items-center gap-4"
                style={{
                  padding: "14px 0",
                  borderBottom: i < mainRoutineItems.length - 1 ? "1px solid rgba(0,0,0,0.05)" : "none",
                }}>
                {/* 스텝 번호 */}
                <div className="flex flex-col items-center" style={{ width: "28px" }}>
                  <div className="flex items-center justify-center"
                    style={{ width: "28px", height: "28px", borderRadius: "50%",
                      backgroundColor: i === 0 ? P : "#F5F0E8" }}>
                    <span style={{ fontSize: "12px", fontWeight: 600, color: i === 0 ? "#fff" : "var(--color-warm-beige)" }}>
                      {i + 1}
                    </span>
                  </div>
                </div>

                {/* 제품 이미지 or 이모지 */}
                <span style={{ fontSize: "24px", width: "36px", textAlign: "center", flexShrink: 0 }}>
                  {product.emoji}
                </span>

                {/* 제품 정보 */}
                <div className="flex-1 min-w-0">
                  <p style={{ fontSize: "12px", fontWeight: 500, color: P, margin: 0, letterSpacing: "0.3px" }}>
                    {meta.label}
                  </p>
                  <p className="truncate text-text-primary font-semibold" style={{ fontSize: "15px", margin: 0, marginTop: "1px" }}>
                    {product.name}
                  </p>
                  <p style={{ fontSize: "12px", color: "var(--color-warm-beige)", margin: 0, marginTop: "1px" }}>
                    {product.brand}
                  </p>
                </div>

                {/* 점수 뱃지 */}
                {product.matchScore > 0 && (
                  <div className="shrink-0 flex flex-col items-center"
                    style={{ minWidth: "36px" }}>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: P }}>{product.matchScore}</span>
                    <span style={{ fontSize: "9px", color: "#AFAFAF", letterSpacing: "0.3px" }}>SCORE</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* 루틴 미설정 안내 */
          <div className="flex flex-col items-center justify-center py-8"
            style={{ borderRadius: "16px", backgroundColor: "#F8F5EF" }}>
            <Star size={28} color="#E0D6C8" style={{ marginBottom: "8px" }} />
            <p style={{ fontSize: "14px", fontWeight: 500, color: "#B8A99A", margin: 0, textAlign: "center" }}>
              아직 루틴이 없어요
            </p>
            <p style={{ fontSize: "12px", margin: 0, marginTop: "4px", textAlign: "center", color: "#CFCFCF", lineHeight: 1.5 }}>
              마이페이지에서 루틴을 설정해보세요
            </p>
            <Link href="/mypage">
              <button className="mt-4 flex items-center gap-1 cursor-pointer border-none"
                style={{ padding: "8px 18px", borderRadius: "20px", backgroundColor: P, color: "#fff", fontSize: "13px", fontWeight: 600 }}>
                <Leaf size={13} /> 루틴 설정하기
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Skincare Tips */}
      <div className="px-5 mt-7">
        <h2 className="text-text-primary font-bold"
          style={{ fontSize: "18px", letterSpacing: "-0.2px", margin: 0, marginBottom: "14px" }}>
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
