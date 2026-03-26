"use client";

import { Leaf, Sun, Moon, Star, ChevronRight, ChessQueen } from "lucide-react";
import Link from "next/link";
import { useUserStore } from "@/stores";
import { useUserQuery, useMainRoutineQuery } from "@/hooks";
import { ROUTINE_STEPS } from "@/constants/routineSteps";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import ProductCard from "@/components/common/ProductCard";
import DataSourcesSection from "@/components/features/home/DataSourcesSection";
import ChatbotWidget from "@/components/common/ChatbotWidget";

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
    <div className="flex-1 bg-[#faf8f5]">
      <div className="bg-[#faf8f5] pt-3.75 pb-7 px-5">
        <div className="flex items-center gap-1.5">
          {greeting.icon}
          <span className="text-base font-normal text-[#99774b] tracking-[0.12em] uppercase italic [font-family:var(--font-english),serif]">
            {greeting.text}
          </span>
        </div>
        <h1 className="my-2 text-[18px] font-semibold text-[#6c6b66] tracking-[-0.5px] leading-[1.2]">
          {nickname}님,
        </h1>
        <p className="mt-1 text-sm text-[#4e4b47]">
          오늘의 스킨케어 루틴을 확인하세요
        </p>
      </div>

      {/* 메인 루틴 카드 */}
      <div className="py-3 px-5">
        <div className="bg-category-pill-default-bg rounded-xl overflow-hidden">
          {/* 루틴 헤더 */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-[16px] font-bold text-[#52514d] uppercase [font-family:var(--font-english),serif]">
                <ChessQueen size={16} className="text-[#52514d]" />
                Main routine
              </span>
              {hasRoutine && (
                <span className="text-[12px] font-medium py-0.5 px-2 rounded-full bg-[#f1f2f4] text-[#70685d]">
                  {mainRoutineItems.length}단계
                </span>
              )}
            </div>
            {hasRoutine ? (
              <Link href="/mypage">
                <span className="flex mr-5 items-center gap-1 text-[14px] text-[#A69D92]">
                  {mainRoutineData?.title && (
                    <span className="text-[14px] font-semibold text-[#8a7f74] truncate max-w-28 mr-0.5">
                      {mainRoutineData.title}
                    </span>
                  )}
                  <ChevronRight size={14} />
                </span>
              </Link>
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
            <div className="px-4 py-4 flex flex-col gap-0">
              {mainRoutineItems.map(({ step, product }, index) => (
                <div
                  key={`${step.code}-${product.name}`}
                  className="flex items-center py-2.5 first:pt-1 last:pb-1"
                >
                  {/* 스텝 번호 뱃지 */}
                  <div className="shrink-0 w-6 h-6 rounded-full bg-[#f1f2f4] flex items-center justify-center">
                    <span className="text-[16px] font-bold text-[#756f67] [font-family:var(--font-english),serif]">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>
                  {/* 제품 카드 — modal variant로 잘림 없이 표시 */}
                  <div className="flex-1 min-w-0">
                    <ProductCard
                      id={product.productId}
                      name={product.name ?? ""}
                      brand={product.brandName ?? ""}
                      imageUrl={product.imageUrl ?? undefined}
                      variant="modal"
                      category={product.categoryName ?? undefined}
                      skinTypes={
                        product.skinTypes?.map(fromSkinTypeEnum) ?? []
                      }
                      effects={product.tags ?? []}
                      showLike={false}
                      showEwg={false}
                      imageContainerClassName="justify-center"
                    />
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

      {/* 참고 데이터소스 — 성분 분석 기반 사이트 */}
      <DataSourcesSection />
      <ChatbotWidget context={{ screen: "search", currentProductId: null }} />
    </div>
  );
}
