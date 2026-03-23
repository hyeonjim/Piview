/**
 * components/features/product/IngredientsTab.tsx
 *
 * 제품 상세 페이지 > 전성분 탭.
 * EWG 등급을 색상으로 시각화.
 */

"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const SEARCH_INPUT_STYLE = {
  height: "40px",
  paddingLeft: "14px",
  paddingRight: "14px",
  borderRadius: "10px",
  backgroundColor: "var(--color-product-action-bg)",
  border: "none",
  fontSize: "13px",
  color: "var(--color-product-name)",
};
const INGRED_DIVIDER = "1px solid #F0F0F0";
const INGRED_NAME_STYLE = {
  fontSize: "13px",
  color: "var(--color-product-name)",
  flex: 1,
  paddingRight: "12px",
};
const EWG_DOT_BASE = { width: "8px", height: "8px", borderRadius: "50%" };
const EWG_SCORE_STYLE = { fontSize: "11px", fontWeight: 600 };
const EMPTY_TEXT_STYLE = {
  fontSize: "13px",
  color: "var(--color-product-brand)",
  textAlign: "center" as const,
  padding: "24px 0",
};
const LEGEND_WRAP_STYLE = { borderRadius: "10px", backgroundColor: "#F8F8F8" };
const LEGEND_DOT_BASE = { width: "8px", height: "8px", borderRadius: "50%" };
const LEGEND_TEXT_STYLE = { fontSize: "10px", color: "#757575" };

import { useState } from "react";

interface Ingredient {
  name: string;
  ewgScore?: number | null; // 1~10 or null
}

interface Props {
  ingredients: Ingredient[];
}

function ewgColor(score: number | null | undefined): string {
  if (score == null) return "#E0E0E0";
  if (score <= 2) return "#4CAF50";
  if (score <= 6) return "#FF9800";
  return "#F44336";
}

function ewgLabel(score: number | null | undefined): string {
  if (score == null) return "?";
  if (score <= 2) return "안전";
  if (score <= 6) return "주의";
  return "위험";
}

export function IngredientsTab({ ingredients }: Props) {
  const [search, setSearch] = useState("");

  const filtered = ingredients.filter((ingredient) =>
    ingredient.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      {/* 검색 */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="성분명 검색..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full outline-none"
          style={SEARCH_INPUT_STYLE}
        />
      </div>

      {/* 성분 목록 */}
      <div className="flex flex-col gap-0">
        {filtered.map((ingredient, index) => (
          <div
            key={`${ingredient.name}-${index}`}
            className="flex items-center justify-between py-2.5"
            style={{
              borderBottom:
                index < filtered.length - 1 ? "1px solid #F0F0F0" : "none",
            }}
          >
            <span style={INGRED_NAME_STYLE}>{ingredient.name}</span>
            {ingredient.ewgScore !== undefined && (
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  style={{
                    ...EWG_DOT_BASE,
                    backgroundColor: ewgColor(ingredient.ewgScore),
                  }}
                />
                <span
                  style={{ ...EWG_SCORE_STYLE, color: ewgColor(ingredient.ewgScore) }}
                >
                  {ingredient.ewgScore ?? "?"} {ewgLabel(ingredient.ewgScore)}
                </span>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={EMPTY_TEXT_STYLE}>검색 결과가 없습니다</p>
        )}
      </div>

      {/* EWG 범례 */}
      <div
        className="flex items-center gap-4 mt-4 p-3"
        style={LEGEND_WRAP_STYLE}
      >
        {[
          { label: "안전 (1-2)", color: "#4CAF50" },
          { label: "주의 (3-6)", color: "#FF9800" },
          { label: "위험 (7-10)", color: "#F44336" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div style={{ ...LEGEND_DOT_BASE, backgroundColor: item.color }} />
            <span style={LEGEND_TEXT_STYLE}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
