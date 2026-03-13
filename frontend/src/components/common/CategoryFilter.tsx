"use client";

import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { MAIN_CATEGORIES } from "@/constants/productCategories";

interface CategoryFilterProps {
  selectedMain: string | null;
  selectedSub: string | null;
  onMainSelect: (main: string | null) => void;
  onSubSelect: (sub: string | null) => void;
}

export function CategoryFilter({
  selectedMain,
  selectedSub,
  onMainSelect,
  onSubSelect,
}: CategoryFilterProps) {
  return (
    <div className="px-6 pb-2">
      {/* 대분류 */}
      <div className="flex flex-wrap gap-2 mb-2">
        {Object.keys(MAIN_CATEGORIES).map((main) => {
          const isActive = selectedMain === main;
          return (
            <button
              key={main}
              onClick={() => {
                onMainSelect(isActive ? null : main);
                onSubSelect(null);
              }}
              className={`shrink-0 h-8 px-3 rounded-2xl border-none cursor-pointer transition-all text-xs ${
                isActive
                  ? "bg-brand text-white font-semibold"
                  : "bg-bg-chip text-text-sub font-medium"
              }`}
            >
              {main}
            </button>
          );
        })}
      </div>

      {/* 소분류 */}
      {selectedMain && (
        <div className="flex flex-wrap gap-1.5 pb-1">
          {MAIN_CATEGORIES[selectedMain].map((sub) => {
            const isActive = selectedSub === sub;
            const catC = CATEGORY_COLORS[sub];
            return (
              <button
                key={sub}
                onClick={() => onSubSelect(isActive ? null : sub)}
                className="shrink-0 h-7 px-[13px] rounded-[14px] cursor-pointer transition-all text-xs font-medium border"
                style={
                  isActive
                    ? { backgroundColor: "#6B7A54", color: "#fff", borderColor: "transparent" }
                    : {
                        backgroundColor: catC ? catC.chip : "#ECEADE",
                        color: catC ? catC.accent : "#616161",
                        borderColor: "rgba(162,170,123,0.13)",
                      }
                }
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
