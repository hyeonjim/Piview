"use client";

import { useEffect } from "react";
import {
  Sparkles,
  ArrowRight,
  Leaf,
  Sun,
  Moon,
  Droplets,
  Settings,
  Star,
} from "lucide-react";
import Link from "next/link";
import { SKINCARE_INSIGHTS } from "@/constants";
import { useLocalRoutineStore } from "@/stores/useLocalRoutineStore";
import { ROUTINE_STEPS, type RoutineStep } from "@/constants/routineSteps";

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

const ICON_MAP = {
  droplets: (size: number) => <Droplets size={size} className="text-brand" />,
  sun: (size: number) => <Sun size={size} className="text-warm-amber" />,
  leaf: (size: number) => <Leaf size={size} className="text-brand" />,
};

export default function HomePage() {
  const greeting = getGreeting();
  const nickname = "User";

  const { routine } = useLocalRoutineStore();

  // 페이지 마운트 시 localStorage에서 루틴 복구
  useEffect(() => {
    useLocalRoutineStore.persist.rehydrate();
  }, []);

  // ROUTINE_STEPS에서 직접 파생 — useLocalRoutineStore의 ROUTINE_STEP_META alias 불필요
  const mainRoutineItems = ROUTINE_STEPS.map((step) => ({
    step,
    product: routine[step.code],
  })).filter((item) => item.product !== null) as {
    step: RoutineStep;
    product: NonNullable<(typeof routine)[string]>;
  }[];

  const hasRoutine = mainRoutineItems.length > 0;

  return (
    <div className="flex flex-col min-h-full overflow-y-auto bg-warm-bg">
      {/* 헤더 */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-1.5 mb-1">
          {greeting.icon}
          <span className="text-warm-beige font-medium text-xs tracking-[1.5px] uppercase">
            {greeting.text}
          </span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[28px] font-bold text-text-primary tracking-[-0.3px] m-0 leading-[1.2]">
              {nickname}님,
            </h1>
            <p className="text-[15px] text-text-muted mt-1">
              오늘의 스킨케어 루틴을 확인해보세요
            </p>
          </div>
          <button className="w-9 h-9 rounded-full bg-white border-none flex items-center justify-center cursor-pointer shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
            <Settings size={18} className="text-warm-beige" />
          </button>
        </div>
      </div>

      {/* AI 피부 진단 배너 */}
      <div className="mx-5 mt-5">
        <Link href="/skin-test" className="block">
          <button className="w-full border-none cursor-pointer relative overflow-hidden rounded-[20px] min-h-[140px] p-0 bg-gradient-to-br from-brand to-brand-dark">
            <div className="absolute -top-10 right-[60px] w-[100px] h-[100px] rounded-full bg-white/[0.06]" />
            <div className="absolute -bottom-7 right-10 w-20 h-20 rounded-full bg-white/[0.04]" />
            <div className="flex items-center justify-between relative z-10 p-6">
              <div className="text-left">
                <div className="flex items-center gap-2 mb-2">
                  <div className="flex items-center justify-center w-8 h-8 rounded-[10px] bg-white/20">
                    <Sparkles size={16} color="#fff" />
                  </div>
                  <span className="text-xs font-semibold text-white/80 tracking-[1.5px] uppercase">
                    AI Skin Analysis
                  </span>
                </div>
                <p className="text-xl font-bold text-white m-0 leading-[1.3]">
                  나만의 피부 타입을
                  <br />
                  분석해보세요
                </p>
                <p className="text-xs text-white/70 mt-2">
                  맞춤 루틴을 추천받을 수 있어요
                </p>
              </div>
              <div className="flex items-center justify-center shrink-0 w-12 h-12 rounded-full bg-white/20">
                <ArrowRight size={22} color="#fff" />
              </div>
            </div>
          </button>
        </Link>
      </div>

      {/* 나의 루틴 */}
      <div className="px-5 mt-7">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-text-primary tracking-[-0.2px] m-0">
            나의 루틴
          </h2>
          {hasRoutine ? (
            <span className="text-xs font-medium text-brand tracking-[0.5px]">
              {mainRoutineItems.length}단계
            </span>
          ) : (
            <Link href="/mypage">
              <span className="text-xs font-medium text-brand tracking-[0.5px] cursor-pointer">
                설정하기 →
              </span>
            </Link>
          )}
        </div>

        {hasRoutine ? (
          <div className="flex flex-col">
            {mainRoutineItems.map(({ step, product }, i) => (
              <div
                key={step.code}
                className="flex items-center gap-4 py-3.5"
                style={{
                  borderBottom:
                    i < mainRoutineItems.length - 1
                      ? "1px solid rgba(0,0,0,0.05)"
                      : "none",
                }}
              >
                {/* 스텝 번호 */}
                <div className="flex flex-col items-center w-7">
                  <div
                    className={`flex items-center justify-center w-7 h-7 rounded-full ${i === 0 ? "bg-brand" : "bg-[#F5F0E8]"}`}
                  >
                    <span
                      className={`text-xs font-semibold ${i === 0 ? "text-white" : "text-warm-beige"}`}
                    >
                      {i + 1}
                    </span>
                  </div>
                </div>

                {/* 이모지 */}
                <span className="text-2xl w-9 text-center shrink-0">
                  {product.emoji}
                </span>

                {/* 정보 */}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-brand m-0 tracking-[0.3px]">
                    {step.label}
                  </p>
                  <p className="truncate text-[15px] font-semibold text-text-primary m-0 mt-px">
                    {product.name}
                  </p>
                  <p className="text-xs text-warm-beige m-0 mt-px">
                    {product.brand}
                  </p>
                </div>

                {/* 점수 */}
                {product.matchScore > 0 && (
                  <div className="shrink-0 flex flex-col items-center min-w-[36px]">
                    <span className="text-sm font-bold text-brand">
                      {product.matchScore}
                    </span>
                    <span className="text-[9px] text-text-muted tracking-[0.3px]">
                      SCORE
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 rounded-card bg-bg-beige">
            <Star size={28} color="#E0D6C8" className="mb-2" />
            <p className="text-sm font-medium text-warm-beige m-0 text-center">
              아직 루틴이 없어요
            </p>
            <p className="text-xs text-text-disabled m-0 mt-1 text-center leading-[1.5]">
              마이페이지에서 루틴을 설정해보세요
            </p>
            <Link href="/mypage">
              <button className="mt-4 flex items-center gap-1 cursor-pointer border-none px-[18px] py-2 rounded-[20px] bg-brand text-white text-xs font-semibold">
                <Leaf size={13} /> 루틴 설정하기
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Skincare Tips */}
      <div className="px-5 mt-7">
        <h2 className="text-lg font-bold text-text-primary tracking-[-0.2px] m-0 mb-3.5">
          Skincare Tips
        </h2>
        <div className="flex flex-col gap-3">
          {SKINCARE_INSIGHTS.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-4 p-4 bg-bg-beige rounded-card"
            >
              <div className="bg-white flex items-center justify-center shrink-0 w-10 h-10 rounded-[12px]">
                {ICON_MAP[item.iconName](18)}
              </div>
              <div>
                <p className="text-[15px] font-semibold text-text-primary m-0">
                  {item.label}
                </p>
                <p className="text-xs text-text-muted m-0 mt-px leading-[1.5]">
                  {item.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-24" />
    </div>
  );
}
