"use client";

import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { MAIN_CATEGORIES } from "@/constants/productCategories";

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
    <div style={{ backgroundColor: "#FFFFFF" }}>
      {/* 대분류 — 언더라인 탭 스타일 */}
      <div
        className="flex overflow-x-auto"
        style={{
          borderBottom: "1px solid #EDEBE8",
          scrollbarWidth: "none",
          paddingLeft: "16px",
          paddingRight: "16px",
          gap: "0px",
        }}
      >
        {mainKeys.map((main) => {
          const isActive = selectedMain === main;
          return (
            <button
              key={main}
              onClick={() => {
                if (isActive) {
                  onMainSelect(null);
                  onSubSelect(null);
                } else {
                  onMainSelect(main);
                  onSubSelect(null);
                }
              }}
              className="shrink-0 cursor-pointer border-none bg-transparent relative"
              style={{
                height: "44px",
                padding: "0 14px",
                fontSize: "13px",
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#1C1C1E" : "#A8A39D",
                fontFamily: "var(--font-pretendard), sans-serif",
                letterSpacing: "0.01em",
                transition: "color 0.15s",
                // 활성 하단 선
                borderBottom: isActive ? "2px solid #1C1C1E" : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {main}
            </button>
          );
        })}
      </div>

      {/* 소분류 — 횡스크롤 pill */}
      {selectedMain && MAIN_CATEGORIES[selectedMain] && (
        <div
          className="flex gap-2 overflow-x-auto"
          style={{
            padding: "10px 16px",
            scrollbarWidth: "none",
            backgroundColor: "#FAFAF8",
            borderBottom: "1px solid #EDEBE8",
          }}
        >
          {MAIN_CATEGORIES[selectedMain].map((sub) => {
            const isActive = selectedSub === sub;
            const catColor = CATEGORY_COLORS[sub];
            return (
              <button
                key={sub}
                onClick={() => onSubSelect(isActive ? null : sub)}
                className="shrink-0 cursor-pointer border transition-all"
                style={{
                  height: "30px",
                  padding: "0 12px",
                  borderRadius: "4px",
                  fontSize: "12px",
                  fontWeight: isActive ? 600 : 400,
                  fontFamily: "var(--font-pretendard), sans-serif",
                  letterSpacing: "0.01em",
                  ...(isActive
                    ? {
                        backgroundColor: "#1C1C1E",
                        color: "#FFFFFF",
                        borderColor: "#1C1C1E",
                      }
                    : {
                        backgroundColor: catColor ? catColor.chip : "#F2EFE9",
                        color: catColor ? catColor.accent : "#8A8278",
                        borderColor: "transparent",
                      }),
                }}
              >
                {sub}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
