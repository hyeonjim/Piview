"use client";

import { Leaf, Sun, Moon, Droplets, Star, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SKINCARE_INSIGHTS } from "@/constants";
import {
  CATEGORY_COLORS,
  SKIN_TYPE_TAG_COLORS,
  SKIN_FUNCTION_COLORS,
} from "@/constants/categoryColors";
import { useUserStore } from "@/stores";
import { useUserQuery, useMainRoutineQuery } from "@/hooks";
import { ROUTINE_STEPS } from "@/constants/routineSteps";
import { fromSkinTypeEnum } from "@/utils/enumConvert";

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
  const { data: mainRoutineData } = useMainRoutineQuery();

  // 메인 루틴 제품 목록 — 스텝 순서대로 flat
  const mainRoutineItems = (mainRoutineData?.steps ?? []).flatMap((step) =>
    step.products.map((rp) => ({
      step: ROUTINE_STEPS.find((s) => s.columnId === step.columnId) ?? {
        code: step.columnId.toString(),
        label: step.columnName,
        icon: "🧴",
      },
      product: rp.product,
    })),
  );

  const hasRoutine = mainRoutineItems.length > 0;

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
        <h1 className="mt-2.5 mb-1.25 text-[20px] font-bold text-[#1C1C1E] tracking-[-0.5px] leading-[1.2]">
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
              메인 루틴
            </span>

            {hasRoutine ? (
              <div className="flex items-center gap-2">
                {/* 루틴 이름 */}
                <span className="text-[14px] font-semibold text-[#2A2118] truncate max-w-30">
                  {mainRoutineData?.title}
                </span>
                <span className="text-[12px] font-semibold py-0.75 px-2.5 rounded-xl bg-[#F2EFE9] text-[#A69D92]">
                  {mainRoutineItems.length}단계
                </span>
              </div>
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
              {mainRoutineItems.map(({ step, product }, index) => {
                // 카테고리 칩 색상
                const categoryColor = product.categoryName
                  ? CATEGORY_COLORS[product.categoryName]
                  : undefined;
                // 스텝 아이콘 (fallback용)
                const stepIcon =
                  "icon" in step ? (step as { icon: string }).icon : "🧴";

                return (
                  <div
                    key={`${step.code}-${product.name}`}
                    className={`flex items-center py-2${index < mainRoutineItems.length - 1 ? " border-b border-[#EDE9E3]" : ""}`}
                  >
                    {/* 스텝 번호 — 기존 위치/스타일 유지 */}
                    <span className="text-[14px] font-bold text-[#BFB6AA] w-4 shrink-0 [font-family:var(--font-english),serif]">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    {/* 아이템 콘텐츠 */}
                    <div className="flex-1 relative h-22 overflow-hidden">
                      <div className="flex items-center h-full">
                        {/* 이미지 영역 */}
                        <div className="relative shrink-0 w-22 h-full bg-[#F5F2EC]">
                          {product.imageUrl ? (
                            <Image
                              src={product.imageUrl}
                              alt={product.name ?? ""}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-[26px]">
                              {stepIcon}
                            </div>
                          )}
                        </div>

                        {/* 텍스트 영역 */}
                        <Link
                          href={`/product/${product.productId}`}
                          className="flex-1 px-3 py-2 min-w-0 no-underline"
                        >
                          {/* 브랜드명 + 카테고리 칩 */}
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[14px] font-semibold text-[#BFB6AA] uppercase tracking-[0.08em]">
                              {product.brandName}
                            </span>
                            {categoryColor && (
                              <span
                                className="text-[12px] px-1 py-px rounded-[3px] font-semibold"
                                style={{
                                  backgroundColor: categoryColor.chip,
                                  color: categoryColor.accent,
                                }}
                              >
                                {product.categoryName}
                              </span>
                            )}
                          </div>

                          {/* 제품명 */}
                          <p className="my-1 text-[16px] font-semibold text-[#2A2118] leading-[1.4] line-clamp-1">
                            {product.name}
                          </p>

                          {/* 피부타입 + 기능 태그 */}
                          <div className="flex flex-wrap gap-1 mt-1">
                            {product.skinTypes?.slice(0, 1).map((skinType) => {
                              const koSkinType = fromSkinTypeEnum(skinType);
                              return (
                                <span
                                  key={skinType}
                                  className="inline-block text-[12px] font-semibold px-1 rounded-[3px]"
                                  style={{
                                    backgroundColor:
                                      SKIN_TYPE_TAG_COLORS[koSkinType]?.bg ??
                                      "#F0EDE8",
                                    color:
                                      SKIN_TYPE_TAG_COLORS[koSkinType]?.text ??
                                      "#7A7060",
                                  }}
                                >
                                  {koSkinType}
                                </span>
                              );
                            })}
                            {product.tags?.slice(0, 2).map((effect) => {
                              const color = SKIN_FUNCTION_COLORS[effect] ?? {
                                chip: "#F0EDE8",
                                accent: "#7A7060",
                              };
                              return (
                                <span
                                  key={effect}
                                  className="inline-block text-[12px] font-semibold px-1 rounded-[3px]"
                                  style={{
                                    backgroundColor: color.chip,
                                    color: color.accent,
                                  }}
                                >
                                  {effect}
                                </span>
                              );
                            })}
                          </div>
                        </Link>
                      </div>
                    </div>
                  </div>
                );
              })}
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
