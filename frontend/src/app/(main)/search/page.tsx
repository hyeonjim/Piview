"use client";

import { useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Plus,
  Heart,
  Package,
  X,
} from "lucide-react";

/* ── 색상 토큰 ── */
const C = {
  primary: "#A2AA7B",
  primaryBg: "#F0F2E8",
  bg: "#FFFFFF",
  text: "#1A1A1A",
  textMuted: "#9E9E9E",
  textSub: "#616161",
  border: "#F0F0F0",
  chip: "#F5F5F5",
};

const CATEGORIES = ["카테고리별", "피부별", "브랜드"];
const SUB_CATS = [
  "스킨케어",
  "클렌징",
  "선케어",
  "핸즈",
  "스킨/토너",
  "로션/에멀전",
  "에센스/앰플/세럼",
  "크림",
  "페이스오일",
  "미스트",
  "패드",
];
const CONCERNS_FILTER = [
  "아토피",
  "여드름",
  "미백",
  "색소침착",
  "안티에이징",
  "피지",
  "블랙헤드",
  "수분",
  "영양",
  "진정",
];

const DUMMY_PRODUCTS = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1,
  brand: ["타가", "생앤선", "미샤", "피터스", "반도", "라운드랩"][i % 6],
  category: "스킨/토너",
  categoryShort: "PR",
  name: [
    "(리뚤존식이 에디션) 아...",
    "[TROUBLE HATER] ...",
    "[니어스킨] 트러블컷 프...",
    "0.5% 바하토너",
    "082 어성초 토너",
    "1025 독도 토너",
    "1025 독도 패드",
    "109 토너",
    "119 스마트 시카 패드",
    "180 AHA 페이셜 필 앤...",
  ][i],
  skinTypes: [
    ["지성", "복합성"],
    ["수부지", "지성"],
    ["지성", "복합성"],
    ["지성", "수부지"],
    ["수부지", "지성"],
    ["수부지", "지성"],
    ["수부지", "지성"],
    ["수부지", "지성"],
    ["지성", "복합성"],
    ["지성"],
  ][i],
  effects:
    [
      ["여드름", "미백", "색소침착", "안티에이징"],
      ["여드름", "미백"],
      ["여드름", "피지", "블랙헤드", "진정"],
      ["지성", "수부지", "여드름", "피지"],
      [],
      [],
      [],
      [],
      ["여드름", "안티에이징", "진정"],
      [],
    ][i] || [],
  desc: "복합성 피부에 사용 가능하며, 특히 그이 허용에 도움을 줄 수 있는 제품입니다. 자세 선분 없이 안심하고 사용하게 세부 가능합니다.",
}));

/* ── 피부타입별 태그 색상 (피그마 원본) ── */
const SKIN_TAG_COLORS: Record<string, { bg: string; text: string }> = {
  건성: { bg: "#E8F0F8", text: "#3A6B9F" },
  지성: { bg: "#FFF3E0", text: "#C27A1E" },
  복합성: { bg: "#F3E8F9", text: "#7B3FA0" },
  수부지: { bg: "#E8F4EC", text: "#3D7A52" },
  민감성: { bg: "#FDEAEA", text: "#C0392B" },
  모든피부: { bg: "#E8F4EC", text: "#3D7A52" },
};

function SkinTag({ type }: { type: string }) {
  const c = SKIN_TAG_COLORS[type] ?? { bg: "#F5F5F5", text: "#757575" };
  return (
    <span
      style={{
        fontSize: "11px",
        padding: "2px 7px",
        borderRadius: "4px",
        backgroundColor: c.bg,
        color: c.text,
        fontWeight: 600,
      }}
    >
      {type}
    </span>
  );
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("카테고리별");
  const [activeSub, setActiveSub] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: C.bg }}>
      {/* ── 헤더 (피그마: linear-gradient surfaceCool→white) ── */}
      <div
        className="sticky top-0 z-20 px-5"
        style={{
          background: `linear-gradient(to bottom, #F0F2E8, #FFFFFF)`,
          paddingTop: "16px",
          paddingBottom: "10px",
        }}
      >
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: C.text,
            marginBottom: "10px",
          }}
        >
          전체 제품
        </h1>

        {/* 검색창 + 필터 버튼 */}
        <div className="flex items-center gap-2 mb-3">
          <div className="relative flex-1">
            <Search
              size={16}
              color="#9E9E9E"
              className="absolute left-3.5 top-1/2 -translate-y-1/2"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제품명, 브랜드 검색..."
              style={{
                width: "100%",
                height: "42px",
                paddingLeft: "36px",
                paddingRight: query ? "36px" : "16px",
                borderRadius: "12px",
                backgroundColor: "#F5F5F5",
                border: "none",
                fontSize: "13px",
                color: C.text,
                outline: "none",
              }}
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X size={14} color="#9E9E9E" />
              </button>
            )}
          </div>
          {/* 피그마: 34×34 원형 필터 버튼 */}
          <button
            className="flex items-center justify-center shrink-0"
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "50%",
              backgroundColor: "#F5F5F5",
              border: "none",
              cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={15} color="#757575" />
          </button>
        </div>

        {/* 대분류 탭 — 피그마: active #A2AA7B bg, height 34px, borderRadius 17px */}
        <div
          className="flex gap-1 pb-2"
          style={{ borderBottom: `1px solid ${C.border}` }}
        >
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveTab(c)}
              style={{
                height: "34px",
                padding: "0 16px",
                borderRadius: "17px",
                backgroundColor: activeTab === c ? C.primary : "transparent",
                color: activeTab === c ? "#FFFFFF" : "#757575",
                fontSize: "13px",
                fontWeight: activeTab === c ? 700 : 500,
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* 소분류 칩 — 피그마: active #A2AA7B bg + white text, inactive #F5F5F5 + #616161 */}
        <div className="flex gap-1.5 overflow-x-auto pt-2 pb-1">
          {SUB_CATS.map((c) => {
            const isActive = activeSub === c;
            return (
              <button
                key={c}
                onClick={() => setActiveSub(isActive ? null : c)}
                className="shrink-0"
                style={{
                  height: "32px",
                  padding: "0 12px",
                  borderRadius: "16px",
                  backgroundColor: isActive ? C.primary : C.chip,
                  color: isActive ? "#FFFFFF" : C.textSub,
                  fontSize: "12px",
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {c}
              </button>
            );
          })}
        </div>

        {/* 고민별 칩 */}
        <div className="flex gap-1.5 overflow-x-auto pt-1.5 pb-1">
          {CONCERNS_FILTER.map((c) => (
            <button
              key={c}
              className="shrink-0"
              style={{
                height: "28px",
                padding: "0 11px",
                borderRadius: "14px",
                backgroundColor: C.chip,
                color: C.textSub,
                fontSize: "11px",
                fontWeight: 500,
                border: `1px solid ${C.primary}22`,
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ── 제품 목록 ── */}
      <div className="flex flex-col divide-y" style={{ borderColor: C.border }}>
        {DUMMY_PRODUCTS.map((p) => (
          <div key={p.id} className="flex gap-3 px-5 py-4">
            {/* 이미지 placeholder */}
            <div
              className="shrink-0 flex items-center justify-center"
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "12px",
                backgroundColor: C.primaryBg,
                fontSize: "11px",
                fontWeight: 700,
                color: C.primary,
              }}
            >
              {p.categoryShort}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                <span
                  style={{
                    fontSize: "12px",
                    color: C.textMuted,
                    fontWeight: 500,
                  }}
                >
                  {p.brand}
                </span>
                <span style={{ fontSize: "11px", color: C.textMuted }}>
                  {p.category}
                </span>
              </div>
              <p
                style={{ fontSize: "14px", fontWeight: 600, color: C.text }}
                className="truncate"
              >
                {p.name}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {p.skinTypes.map((t) => (
                  <SkinTag key={t} type={t} />
                ))}
                {p.effects.slice(0, 2).map((e) => (
                  <span
                    key={e}
                    style={{
                      fontSize: "11px",
                      padding: "2px 7px",
                      borderRadius: "4px",
                      backgroundColor: "#F5F5F5",
                      color: C.textSub,
                      fontWeight: 500,
                    }}
                  >
                    {e}
                  </span>
                ))}
              </div>
              {p.desc && (
                <p
                  style={{
                    fontSize: "12px",
                    color: C.textMuted,
                    marginTop: "6px",
                    lineHeight: 1.5,
                  }}
                  className="line-clamp-2"
                >
                  {p.desc}
                </p>
              )}

              {/* 액션 버튼 */}
              <div className="flex items-center gap-2 mt-2.5">
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    height: "30px",
                    padding: "0 12px",
                    borderRadius: "15px",
                    backgroundColor: C.primaryBg,
                    color: C.primary,
                    fontSize: "12px",
                    fontWeight: 600,
                    border: `1px solid ${C.primary}40`,
                    cursor: "pointer",
                  }}
                >
                  <Plus size={12} /> 루틴추가
                </button>
                <button
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    height: "30px",
                    padding: "0 12px",
                    borderRadius: "15px",
                    backgroundColor: "#F5F5F5",
                    color: C.textSub,
                    fontSize: "12px",
                    fontWeight: 600,
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Package size={12} /> 보유추가
                </button>
                <button
                  className="ml-auto"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                  }}
                >
                  <Heart size={16} color="#BDBDBD" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 페이지네이션 ── */}
      <div className="flex items-center justify-center gap-1 py-6 pb-28">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            style={{
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              backgroundColor: page === n ? C.primary : "transparent",
              color: page === n ? "#FFFFFF" : C.textMuted,
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
              transition: "all 0.15s",
            }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
