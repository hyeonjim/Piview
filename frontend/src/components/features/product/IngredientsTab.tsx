/**
 * components/features/product/IngredientsTab.tsx
 *
 * 제품 상세 페이지 > 전성분 탭.
 * EWG 등급을 색상으로 시각화.
 */

"use client";

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

  const filtered = ingredients.filter((i) =>
    i.name.toLowerCase().includes(search.toLowerCase())
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
          style={{
            height: "40px", paddingLeft: "14px", paddingRight: "14px",
            borderRadius: "10px", backgroundColor: "#F5F5F5",
            border: "none", fontSize: "13px", color: "#1A1A1A",
          }}
        />
      </div>

      {/* 성분 목록 */}
      <div className="flex flex-col gap-0">
        {filtered.map((ing, i) => (
          <div
            key={`${ing.name}-${i}`}
            className="flex items-center justify-between py-2.5"
            style={{ borderBottom: i < filtered.length - 1 ? "1px solid #F0F0F0" : "none" }}
          >
            <span style={{ fontSize: "13px", color: "#1A1A1A", flex: 1, paddingRight: "12px" }}>
              {ing.name}
            </span>
            {ing.ewgScore !== undefined && (
              <div className="flex items-center gap-1.5 shrink-0">
                <div
                  style={{
                    width: "8px", height: "8px", borderRadius: "50%",
                    backgroundColor: ewgColor(ing.ewgScore),
                  }}
                />
                <span style={{ fontSize: "11px", color: ewgColor(ing.ewgScore), fontWeight: 600 }}>
                  {ing.ewgScore ?? "?"} {ewgLabel(ing.ewgScore)}
                </span>
              </div>
            )}
          </div>
        ))}

        {filtered.length === 0 && (
          <p style={{ fontSize: "13px", color: "#9E9E9E", textAlign: "center", padding: "24px 0" }}>
            검색 결과가 없습니다
          </p>
        )}
      </div>

      {/* EWG 범례 */}
      <div className="flex items-center gap-4 mt-4 p-3" style={{ borderRadius: "10px", backgroundColor: "#F8F8F8" }}>
        {[
          { label: "안전 (1-2)", color: "#4CAF50" },
          { label: "주의 (3-6)", color: "#FF9800" },
          { label: "위험 (7-10)", color: "#F44336" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-1">
            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: item.color }} />
            <span style={{ fontSize: "10px", color: "#757575" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
