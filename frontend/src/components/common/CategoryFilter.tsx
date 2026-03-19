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
                if (!isActive) {
                  // 새 대분류 선택 → 첫 번째 소분류 자동 선택
                  onMainSelect(main);
                  const firstSubCategory = MAIN_CATEGORIES[main]?.[0] ?? null;
                  onSubSelect(firstSubCategory);
                }
                // 같은 대분류 재클릭 → 무시 (항상 선택 유지)
              }}
              className="shrink-0 cursor-pointer border-none bg-transparent relative"
              style={{
                height: "44px",
                padding: "0 14px",
                fontSize: "16px",
                fontWeight: isActive ? 600 : 400,
                // 활성 시 검정 대신 웜 브라운 계열
                color: isActive ? "#6B5445" : "#A8A39D",
                fontFamily: "var(--font-pretendard), sans-serif",
                letterSpacing: "0.01em",
                transition: "color 0.15s",
                // 활성 하단 선 — 웜 브라운
                borderBottom: isActive
                  ? "2px solid #6B5445"
                  : "2px solid transparent",
                marginBottom: "-1px",
              }}
            >
              {main}
            </button>
          );
        })}
      </div>

      {/* 소분류 — flex-wrap pill (다음줄로 넘어가게) */}
      {selectedMain && MAIN_CATEGORIES[selectedMain] && (
        <div
          className="flex flex-wrap gap-2"
          style={{
            padding: "10px 16px",
            // 연한 베이지 배경
            backgroundColor: "#F5F1EB",
            borderBottom: "1px solid #EDEBE8",
          }}
        >
          {MAIN_CATEGORIES[selectedMain].map((sub) => {
            const isActive = selectedSub === sub;
            const catColor = CATEGORY_COLORS[sub];
            return (
              <button
                key={sub}
                onClick={() => {
                  if (!isActive) onSubSelect(sub);
                }}
                className="cursor-pointer border transition-all"
                style={{
                  height: "30px",
                  padding: "0 12px",
                  borderRadius: "20px",
                  fontSize: "13px",
                  fontWeight: isActive ? 400 : 400,
                  fontFamily: "var(--font-pretendard), sans-serif",
                  letterSpacing: "0.01em",
                  ...(isActive
                    ? {
                        // 활성 시 검정 대신 웜 모카 브라운
                        backgroundColor: "#9B7D6A",
                        color: "#FFFFFF",
                        borderColor: "#9B7D6A",
                      }
                    : {
                        backgroundColor: catColor ? catColor.chip : "#F2EFE9",
                        color: catColor ? catColor.accent : "#8A8278",
                        // 비활성 테두리를 카테고리 컬러로
                        borderColor: catColor ? catColor.border : "#E2DDD8",
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
