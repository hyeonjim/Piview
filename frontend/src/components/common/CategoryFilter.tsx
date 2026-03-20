"use client";

import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { MAIN_CATEGORIES } from "@/constants/productCategories";
import { getCategoryDisplayName } from "@/utils/format";

interface CategoryFilterProps {
  selectedMain: string | null;
  selectedSub: string | null;
  onMainSelect: (main: string | null) => void;
  onSubSelect: (sub: string | null) => void;
}

// 카테고리 필터 — 에디토리얼 언더라인 스타일
// "전체" 버튼 없음 — 대분류 재클릭으로 해제
export function CategoryFilter({
  selectedMain,
  selectedSub,
  onMainSelect,
  onSubSelect,
}: CategoryFilterProps) {
  const mainKeys = Object.keys(MAIN_CATEGORIES);

  return (
    <div className="bg-white">
      {/* 대분류 — 언더라인 탭 스타일 */}
      <div className="flex overflow-x-auto border-b border-(--color-border) px-4 scrollbar-none">
        {mainKeys.map((main) => {
          const isActive = selectedMain === main;
          return (
            <button
              key={main}
              onClick={() => {
                if (!isActive) {
                  // 새 대분류 선택 → 첫 번째 소분류 자동 선택
                  onMainSelect(main);
                  const firstSubCategory = MAIN_CATEGORIES[main]?.[0] ?? null;
                  onSubSelect(firstSubCategory);
                }
                // 같은 대분류 재클릭 → 무시 (항상 선택 유지)
              }}
              className="category-tab-button"
              data-active={isActive}
            >
              {main}
            </button>
          );
        })}
      </div>

      {/* 소분류 — flex-wrap pill (다음줄로 넘어가게) */}
      {selectedMain && MAIN_CATEGORIES[selectedMain] && (
        <div className="flex flex-wrap gap-2 p-[10px_16px] bg-category-sub-bg border-b border-(--color-border)">
          {MAIN_CATEGORIES[selectedMain].map((sub) => {
            const isActive = selectedSub === sub;
            const catColor = CATEGORY_COLORS[sub];
            return (
              <button
                key={sub}
                onClick={() => {
                  if (!isActive) onSubSelect(sub);
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
                {getCategoryDisplayName(sub)}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
