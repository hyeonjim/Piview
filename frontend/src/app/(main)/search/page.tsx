"use client";

import { useState } from "react";
import { SlidersHorizontal, Plus, Heart, Package } from "lucide-react";
import { SearchBar, SkinTypeBadge } from "@/components/common";

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
  "세스칙착",
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
      ["여드름", "미백", "세스칙착", "안티에이징"],
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

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [activeTab, setActiveTab] = useState("카테고리별");
  const [page, setPage] = useState(1);

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-20 bg-bg-base px-4 pt-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar
              value={query}
              onChange={setQuery}
              placeholder="제품명, 브랜드 검색..."
            />
          </div>
          <button className="w-11 h-11 flex items-center justify-center rounded-xl border border-border bg-bg-card shrink-0">
            <SlidersHorizontal size={18} className="text-text-primary" />
          </button>
        </div>
        <div className="flex gap-1 mt-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setActiveTab(c)}
              className={`px-4 py-1.5 rounded-badge text-sm font-medium transition-all ${activeTab === c ? "bg-text-primary text-white" : "text-text-muted"}`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUB_CATS.map((c) => (
            <button
              key={c}
              className="whitespace-nowrap px-3 py-1 rounded-badge border border-border text-xs text-text-secondary shrink-0 hover:border-brand hover:text-brand transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CONCERNS_FILTER.map((c) => (
            <button
              key={c}
              className="whitespace-nowrap px-3 py-1 rounded-badge border border-border text-xs text-text-secondary shrink-0 hover:border-brand hover:text-brand transition-colors"
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex flex-col divide-y divide-border">
        {DUMMY_PRODUCTS.map((p) => (
          <div key={p.id} className="flex gap-3 px-4 py-4">
            <div className="w-12 h-12 rounded-xl bg-bg-surface flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
              {p.categoryShort}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1 flex-wrap mb-1">
                <span className="text-xs text-text-muted">{p.brand}</span>
                <span className="text-xs text-text-muted">{p.category}</span>
              </div>
              <p className="text-sm font-semibold text-text-primary truncate">
                {p.name}
              </p>
              <div className="flex flex-wrap gap-1 mt-1">
                {p.skinTypes.map((t) => (
                  <SkinTypeBadge key={t} skinType={t} />
                ))}
                {p.effects.slice(0, 3).map((e) => (
                  <span
                    key={e}
                    className="text-[10px] px-2 py-0.5 rounded-badge border border-border text-text-muted"
                  >
                    {e}
                  </span>
                ))}
              </div>
              {p.desc && (
                <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">
                  {p.desc}
                </p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-badge border border-brand text-brand font-medium hover:bg-brand-pale transition-colors">
                  <Plus size={12} /> 루틴추가
                </button>
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-badge border border-border text-text-muted hover:border-brand hover:text-brand transition-colors">
                  <Package size={12} /> 보유추가
                </button>
                <button className="ml-auto">
                  <Heart size={16} className="text-text-muted" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1 py-6 pb-24">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            onClick={() => setPage(n)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${page === n ? "bg-brand text-white" : "text-text-muted hover:bg-bg-surface"}`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
