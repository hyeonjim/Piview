"use client";

import { useLayoutEffect } from "react";
import { useProductFilters } from "@/hooks";
import { getCategoryDisplayName } from "@/utils/format";
import type { BigCategoryFilterDto } from "@/types/product";

interface CategoryFilterProps {
  selectedBigCategoryId: number | null;
  selectedCategoryId: number | null;
  onBigCategorySelect: (bigCategoryId: number | null) => void;
  onCategorySelect: (categoryId: number | null) => void;
  /** 대분류 탭 폰트 크기 오버라이드 (기본값: globals.css 기준) */
  bigCategoryFontSize?: string;
  /** 소분류 pill 폰트 크기 오버라이드 (기본값: globals.css 기준) */
  pillFontSize?: string;
}

export function CategoryFilter({
  selectedBigCategoryId,
  selectedCategoryId,
  onBigCategorySelect,
  onCategorySelect,
  bigCategoryFontSize,
  pillFontSize,
}: CategoryFilterProps) {
  const { data: filterMeta, isLoading } = useProductFilters();
  const bigCategories: BigCategoryFilterDto[] = filterMeta?.bigCategories ?? [];

  // API 데이터 로드되면 첫 번째 대분류 자동 선택 — 소분류는 전체(null)
  useLayoutEffect(() => {
    if (bigCategories.length > 0 && selectedBigCategoryId === null) {
      const firstBig = bigCategories[0];
      onBigCategorySelect(firstBig.bigCategoryId);
      onCategorySelect(null); // 소분류 전체 선택
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
    <div className="bg-[#f7f7f5]">
      {/* 대분류 탭 행 — 깔끔한 구분선 */}
      <div className="flex min-h-[40px] overflow-x-auto border-b border-[#dad3c8] px-5 scrollbar-none">
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
                      onBigCategorySelect(big.bigCategoryId);
                      onCategorySelect(null); // 소분류 전체 선택
                    }
                  }}
                  className="category-tab-button"
                  data-active={isActive}
                  style={
                    bigCategoryFontSize
                      ? { fontSize: bigCategoryFontSize }
                      : undefined
                  }
                >
                  {getCategoryDisplayName(big.bigCategoryName)}
                </button>
              );
            })}
      </div>

      {/* 소분류 pill 행 — 밝은 배경 */}
      <div className="flex flex-wrap gap-2 p-[10px_20px] min-h-[48px]">
        {showSubSkeleton
          ? // 로딩 중 — 실제 pill과 동일한 크기의 skeleton
            [56, 72, 48, 64, 52].map((w, i) => (
              <div
                key={i}
                className="h-[25px] rounded-full bg-[#fff] animate-pulse"
                style={{ width: w }}
              />
            ))
          : selectedBig && (
              <>
                {/* 소분류 전체 pill */}
                <button
                  onClick={() => {
                    if (selectedCategoryId !== null) onCategorySelect(null);
                  }}
                  className="category-pill-button"
                  data-active={selectedCategoryId === null}
                  style={pillFontSize ? { fontSize: pillFontSize } : undefined}
                >
                  전체
                </button>
                {selectedBig.categories.map((cat) => {
                  const isActive = selectedCategoryId === cat.categoryId;
                  return (
                    <button
                      key={cat.categoryId}
                      onClick={() => {
                        if (!isActive) onCategorySelect(cat.categoryId);
                      }}
                      className="category-pill-button"
                      data-active={isActive}
                      style={
                        pillFontSize ? { fontSize: pillFontSize } : undefined
                      }
                    >
                      {getCategoryDisplayName(cat.categoryName)}
                    </button>
                  );
                })}
              </>
            )}
      </div>
    </div>
  );
}
