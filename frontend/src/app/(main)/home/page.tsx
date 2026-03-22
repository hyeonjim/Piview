"use client";

import { useEffect } from "react";
import { Leaf, Sun, Moon, Droplets, Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import { SKINCARE_INSIGHTS } from "@/constants";
import { useRoutineStore, useUserStore } from "@/stores";
import { useUserQuery } from "@/hooks";
import { ROUTINE_STEPS } from "@/constants/routineSteps";

// 시간대별 인사말과 아이콘 반환
function getGreeting(): { text: string; icon: React.ReactNode } {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12)
    return {
      text: "Morning Glow",
      icon: <Sun size={13} className="text-[#C8A96E]" />,
    };
  if (hour >= 12 && hour < 18)
    return {
      text: "Afternoon Care",
      icon: <Sun size={13} className="text-[#C8A96E]" />,
    };
  return {
    text: "Evening Ritual",
    icon: <Moon size={13} className="text-[#A8A39D]" />,
  };
}

// 아이콘 이름 → JSX 컴포넌트 매핑 (SKINCARE_INSIGHTS.iconName에 대응)
const ICON_MAP = {
  droplets: (size: number) => (
    <Droplets size={size} className="text-[#8A9468]" />
  ),
  sun: (size: number) => <Sun size={size} className="text-[#C8A96E]" />,
  leaf: (size: number) => <Leaf size={size} className="text-[#8A9468]" />,
};

export default function HomePage() {
  // store.user 없을 때 /users/me 재조회 — 새로고침·직접 진입 시 이름 복원
  useUserQuery();
  const greeting = getGreeting();
  const nickname = useUserStore((state) => state.user?.name ?? "User");
  const { localRoutine: routine, isMainRoutine } = useRoutineStore();

  // 로컬 루틴 스토어 rehydrate (localStorage → zustand)
  useEffect(() => {
    useRoutineStore.persist.rehydrate();
  }, []);

  // 각 스텝별 제품 배열을 flat — 스텝당 여러 제품이 있을 수 있음
  const mainRoutineItems = ROUTINE_STEPS.flatMap((step) =>
    (routine[step.code] ?? []).map((product) => ({ step, product })),
  );

  // isMainRoutine이 off면 홈에서 루틴 미표시
  const hasRoutine = isMainRoutine && mainRoutineItems.length > 0;

  return (
    <div className="flex-1 bg-[#F5F2EC]">
      {/* ── 상단 헤더 ──────────────────────────────────────────── */}
      <div className="bg-[#F5F2EC] pt-3.75 pb-5 px-5">
        {/* 인사말 — Cormorant 폰트 (기본 폰트 아님) */}
        <div className="flex items-center gap-1.5">
          {greeting.icon}
          <span className="text-base font-normal text-[#B0A99F] tracking-[0.12em] uppercase italic [font-family:var(--font-english),serif]">
            {greeting.text}
          </span>
        </div>

        {/* 닉네임 */}
        <h1 className="mt-2.5 mb-1.25 text-[22px] font-bold text-[#1C1C1E] tracking-[-0.5px] leading-[1.2]">
          {nickname}님,
        </h1>

        {/* 서브타이틀 */}
        <p className="mt-1 text-sm text-[#B0A99F]">
          오늘의 스킨케어 루틴을 확인하세요
        </p>
      </div>

      {/* ── 나의 루틴 ─────────────────────────────────────────── */}
      <div className="py-5 px-4">
        <div className="bg-white rounded-xl border border-[#E2DDD8] overflow-hidden">
          {/* 섹션 헤더 */}
          <div className="flex items-center justify-between py-3.5 px-4 border-b border-[#EDE9E3]">
            <span className="text-[16px] font-bold text-[#2A2118] tracking-[-0.2px]">
              My main routine
            </span>

            {hasRoutine ? (
              <span className="text-[11px] font-semibold py-0.75 px-2.5 rounded-xl bg-[#F2EFE9] text-[#A69D92]">
                {mainRoutineItems.length}단계
              </span>
            ) : (
              <Link href="/mypage">
                <span className="flex items-center gap-0.5 text-xs text-[#A69D92]">
                  설정하기 <ChevronRight size={12} />
                </span>
              </Link>
            )}
          </div>

          {/* 루틴 리스트 */}
          {hasRoutine ? (
            <div className="px-4">
              {mainRoutineItems.map(({ step, product }, index) => (
                <div
                  key={`${step.code}-${product.name}`}
                  className={`flex items-center gap-3 py-3${
                    index < mainRoutineItems.length - 1
                      ? " border-b border-[#EDE9E3]"
                      : ""
                  }`}
                >
                  {/* 스텝 번호 — SortsMillGoudy 폰트 (영어 숫자용) */}
                  <span className="text-[10px] font-bold text-[#BFB6AA] w-4 shrink-0 [font-family:var(--font-english),serif]">
                    {String(index + 1).padStart(2, "0")}
                  </span>

                  {/* 이모지 */}
                  <span className="text-[20px] w-7 text-center shrink-0">
                    {product.emoji}
                  </span>

                  {/* 스텝 정보 */}
                  <div className="flex-1 min-w-0">
                    <p className="m-0 text-xs text-[#A69D92] font-bold tracking-[0.03em]">
                      {step.label}
                    </p>
                    <p className="mt-px text-base font-semibold text-[#2A2118] overflow-hidden text-ellipsis whitespace-nowrap">
                      {product.name}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* 루틴 없음 빈 상태 */
            <div className="flex flex-col items-center justify-center py-8 px-5">
              <Star size={28} className="text-[#D9D5D0] mb-2.5" />
              <p className="m-0 text-sm font-semibold text-[#A69D92] text-center">
                아직 루틴이 없어요
              </p>
              <p className="mt-1 text-xs text-[#BFB6AA] text-center leading-normal">
                마이페이지에서 루틴을 설정해보세요
              </p>
              <Link href="/mypage">
                <button className="flex items-center gap-1.5 cursor-pointer border-none mt-3.5 py-2 px-4.5 rounded-md bg-[#3D3028] text-[#F2EFE9] text-xs font-semibold">
                  <Leaf size={12} /> 루틴 설정하기
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* ── Skincare Tips ──────────────────────────────────────── */}
      <div className="pt-5 px-4 pb-6">
        {/* 섹션 타이틀 */}
        <div className="flex items-baseline gap-2 mb-3.75">
          <h2 className="text-[18px] font-bold text-[#2A2118] tracking-[-0.3px]">
            Skincare Tips
          </h2>
        </div>

        {/* 팁 카드 목록 */}
        <div className="flex flex-col gap-2">
          {SKINCARE_INSIGHTS.map((item) => (
            <div
              key={item.label}
              className="flex items-start gap-3 bg-white rounded-[10px] border border-[#E2DDD8] p-3.5"
            >
              {/* 아이콘 박스 */}
              <div className="flex items-center justify-center shrink-0 w-9 h-9 rounded-lg bg-[#F2EFE9]">
                {ICON_MAP[item.iconName](15)}
              </div>

              {/* 텍스트 */}
              <div>
                <p className="m-0 text-[13px] font-semibold text-[#2A2118]">
                  {item.label}
                </p>
                <p className="mt-0.75 text-xs text-[#A69D92] leading-[1.6]">
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
