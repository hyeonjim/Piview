"use client";

import { useEffect } from "react";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { useProductFilters } from "@/hooks";
import { getCategoryDisplayName } from "@/utils/format";
import type { BigCategoryFilterDto } from "@/types/product";

interface CategoryFilterProps {
  selectedBigCategoryId: number | null;
  selectedCategoryId: number | null;
  onBigCategorySelect: (
    bigCategoryId: number | null,
    bigCategoryName: string | null,
  ) => void;
  onCategorySelect: (categoryId: number | null) => void;
}

export function CategoryFilter({
  selectedBigCategoryId,
  selectedCategoryId,
  onBigCategorySelect,
  onCategorySelect,
}: CategoryFilterProps) {
  const { data: filterMeta } = useProductFilters();
  const bigCategories: BigCategoryFilterDto[] = filterMeta?.bigCategories ?? [];

  // API 데이터 로드되면 첫 번째 대분류/소분류 자동 선택
  useEffect(() => {
    if (bigCategories.length > 0 && selectedBigCategoryId === null) {
      const firstBig = bigCategories[0];
      const firstCat = firstBig.categories[0] ?? null;
      onBigCategorySelect(firstBig.bigCategoryId, firstBig.bigCategoryName);
      onCategorySelect(firstCat?.categoryId ?? null);
    }
  }, [bigCategories.length]);

  const selectedBig = bigCategories.find(
    (b) => b.bigCategoryId === selectedBigCategoryId,
  );

  return (
    <div className="bg-white">
      {/* 대분류 — 항상 선택 유지 */}
      <div className="flex overflow-x-auto border-b border-(--color-border) px-4 scrollbar-none">
        {bigCategories.map((big) => {
          const isActive = selectedBigCategoryId === big.bigCategoryId;
          return (
            <button
              key={big.bigCategoryId}
              onClick={() => {
                if (!isActive) {
                  const firstCat = big.categories[0] ?? null;
                  onBigCategorySelect(big.bigCategoryId, big.bigCategoryName);
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

      {/* 소분류 — 항상 선택 유지 */}
      {selectedBig && selectedBig.categories.length > 0 && (
        <div className="flex flex-wrap gap-2 p-[10px_16px] bg-category-sub-bg border-b border-(--color-border)">
          {selectedBig.categories.map((cat) => {
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
      )}
    </div>
  );
}
