"use client";

import { useLayoutEffect } from "react";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { useProductFilters } from "@/hooks";
import { getCategoryDisplayName } from "@/utils/format";
import type { BigCategoryFilterDto } from "@/types/product";

interface CategoryFilterProps {
  selectedBigCategoryId: number | null;
  selectedCategoryId: number | null;
  onBigCategorySelect: (bigCategoryId: number | null) => void;
  onCategorySelect: (categoryId: number | null) => void;
}

export function CategoryFilter({
  selectedBigCategoryId,
  selectedCategoryId,
  onBigCategorySelect,
  onCategorySelect,
}: CategoryFilterProps) {
  const { data: filterMeta, isLoading } = useProductFilters();
  const bigCategories: BigCategoryFilterDto[] = filterMeta?.bigCategories ?? [];

  // API 데이터 로드되면 첫 번째 대분류/소분류 자동 선택
  useLayoutEffect(() => {
    if (bigCategories.length > 0 && selectedBigCategoryId === null) {
      const firstBig = bigCategories[0];
      const firstCat = firstBig.categories[0] ?? null;
      onBigCategorySelect(firstBig.bigCategoryId);
      onCategorySelect(firstCat?.categoryId ?? null);
    }
  }, [bigCategories.length]);

  const selectedBig = bigCategories.find(
    (b) => b.bigCategoryId === selectedBigCategoryId,
  );

  // 소분류 행을 skeleton으로 대체해야 하는 경우:
  // 1) API 로딩 중
  // 2) 데이터는 왔지만 useEffect가 아직 selectedBigCategoryId를 세팅하기 전 (한 프레임)
  const showSubSkeleton =
    isLoading || (bigCategories.length > 0 && !selectedBig);

  return (
    <div className="bg-white">
      {/* 대분류 탭 행 */}
      <div className="flex min-h-[44px] overflow-x-auto border-b border-(--color-border) px-4 scrollbar-none">
        {isLoading
          ? // 로딩 중 — 실제 탭과 동일한 크기의 skeleton
            [80, 64, 72, 60].map((w, i) => (
              <div
                key={i}
                className="flex-shrink-0 self-center mx-1 h-5 rounded bg-gray-100 animate-pulse"
                style={{ width: w }}
              />
            ))
          : bigCategories.map((big) => {
              const isActive = selectedBigCategoryId === big.bigCategoryId;
              return (
                <button
                  key={big.bigCategoryId}
                  onClick={() => {
                    if (!isActive) {
                      const firstCat = big.categories[0] ?? null;
                      onBigCategorySelect(big.bigCategoryId);
                      onCategorySelect(firstCat?.categoryId ?? null);
                    }
                  }}
                  className="category-tab-button"
                  data-active={isActive}
                >
                  {big.bigCategoryName}
                </button>
              );
            })}
      </div>

      {/* 소분류 pill 행 */}
      <div className="flex flex-wrap gap-2 p-[10px_16px] bg-category-sub-bg border-b border-(--color-border) min-h-[52px]">
        {showSubSkeleton
          ? // 로딩 중 — 실제 pill과 동일한 크기의 skeleton
            [56, 72, 48, 64, 52].map((w, i) => (
              <div
                key={i}
                className="h-[30px] rounded-full bg-gray-200 animate-pulse"
                style={{ width: w }}
              />
            ))
          : selectedBig?.categories.map((cat) => {
              const isActive = selectedCategoryId === cat.categoryId;
              const catColor = CATEGORY_COLORS[cat.categoryName];
              return (
                <button
                  key={cat.categoryId}
                  onClick={() => {
                    if (!isActive) onCategorySelect(cat.categoryId);
                  }}
                  className="category-pill-button"
                  data-active={isActive}
                  data-has-color={!!catColor}
                  style={
                    !isActive && catColor
                      ? ({
                          "--pill-bg": catColor.chip,
                          "--pill-color": catColor.accent,
                          "--pill-border": catColor.border,
                        } as React.CSSProperties)
                      : undefined
                  }
                >
                  {getCategoryDisplayName(cat.categoryName)}
                </button>
              );
            })}
      </div>
    </div>
  );
}
