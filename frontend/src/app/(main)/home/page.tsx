"use client";

import { Leaf, Sun, Moon, Star, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/stores";
import { useUserQuery, useMainRoutineQuery } from "@/hooks";
import { ROUTINE_STEPS } from "@/constants/routineSteps";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import ProductCard from "@/components/common/ProductCard";

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
      },
      product: rp.product,
    })),
  );

  const hasRoutine = mainRoutineItems.length > 0;

  return (
    <div className="flex-1 bg-[#F5F2EC]">
      <div className="bg-[#F5F2EC] pt-3.75 pb-5 px-5">
        <div className="flex items-center gap-1.5">
          {greeting.icon}
          <span className="text-base font-normal text-[#B0A99F] tracking-[0.12em] uppercase italic [font-family:var(--font-english),serif]">
            {greeting.text}
          </span>
        </div>
        <h1 className="mt-2.5 mb-1.25 text-[20px] font-bold text-[#1C1C1E] tracking-[-0.5px] leading-[1.2]">
          {nickname}님,
        </h1>
        <p className="mt-1 text-sm text-[#B0A99F]">
          오늘의 스킨케어 루틴을 확인하세요
        </p>
      </div>

      {/* 메인 루틴 카드 */}
      <div className="py-3 px-4">
        <div className="bg-white rounded-xl border border-[#E2DDD8]">
          {/* 루틴 헤더 */}
          <div className="flex items-center justify-between py-3.5 px-4 border-b border-[#EDE9E3] rounded-t-xl">
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
            <div className="p-3 flex flex-col gap-3">
              {mainRoutineItems.map(({ step, product }, index) => {

                return (
                  <div
                    key={`${step.code}-${product.name}`}
                    className="flex items-center gap-3"
                  >
                    {/* 스텝 번호 */}
                    <span className="text-[18px] font-bold text-[#BFB6AA] w-4 shrink-0 [font-family:var(--font-english),serif]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {/* zoom으로 홈페이지에서만 카드 축소 — ProductCard 컴포넌트 수정 없이 비율 유지 */}
                    <div className="flex-1">
                      <ProductCard
                        id={product.productId}
                        name={product.name ?? ""}
                        brand={product.brandName ?? ""}
                        imageUrl={product.imageUrl ?? undefined}
                        layout="horizontal"
                        skinTypes={
                          product.skinTypes?.map(fromSkinTypeEnum) ?? []
                        }
                        effects={product.tags ?? []}
                        showLike={false}
                        showEwg={false}
                      />
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

      <div className="pt-5 px-4 pb-6">
        <div className="flex items-baseline gap-2 mb-3.75">
          <h2 className="text-[18px] font-bold text-[#2A2118] tracking-[-0.3px]">
            Skincare Tips
          </h2>
        </div>
      </div>
    </div>
  );
}
