"use client";

import { useState } from "react";
import { SlidersHorizontal, Plus, Heart, Package } from "lucide-react";
import { SearchBar, SkinTypeBadge } from "@/components/common";
import { SEARCH_TABS, SUB_CATS, CONCERNS_FILTER } from "@/constants";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/products";

export default function SearchPage() {
  const [query,     setQuery]     = useState("");
  const [activeTab, setActiveTab] = useState("카테고리별");
  const [page,      setPage]      = useState(1);

  return (
    <div className="flex flex-col min-h-full">
      <div className="sticky top-0 z-20 bg-bg-base px-4 pt-4 pb-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <SearchBar value={query} onChange={setQuery} placeholder="제품명, 브랜드 검색..." />
          </div>
          <button className="w-11 h-11 flex items-center justify-center rounded-xl border border-border bg-bg-card shrink-0">
            <SlidersHorizontal size={18} className="text-text-primary" />
          </button>
        </div>
        <div className="flex gap-1 mt-3">
          {SEARCH_TABS.map((c) => (
            <button key={c} onClick={() => setActiveTab(c)}
              className={`px-4 py-1.5 rounded-badge text-sm font-medium transition-all ${activeTab === c ? "bg-text-primary text-white" : "text-text-muted"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUB_CATS.map((c) => (
            <button key={c}
              className="whitespace-nowrap px-3 py-1 rounded-badge border border-border text-xs text-text-secondary shrink-0 hover:border-brand hover:text-brand transition-colors">
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CONCERNS_FILTER.map((c) => (
            <button key={c}
              className="whitespace-nowrap px-3 py-1 rounded-badge border border-border text-xs text-text-secondary shrink-0 hover:border-brand hover:text-brand transition-colors">
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col divide-y divide-border">
        {MOCK_SEARCH_PRODUCTS.map((p) => (
          <div key={p.id} className="flex gap-3 px-4 py-4">
            <div className="w-12 h-12 rounded-xl bg-bg-surface flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
              {p.categoryShort}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-1 flex-wrap mb-1">
                <span className="text-xs text-text-muted">{p.brand}</span>
                <span className="text-xs text-text-muted">{p.category}</span>
              </div>
              <p className="text-sm font-semibold text-text-primary truncate">{p.name}</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {p.skinTypes.map((t) => <SkinTypeBadge key={t} skinType={t} />)}
                {p.effects.slice(0, 3).map((e) => (
                  <span key={e} className="text-[10px] px-2 py-0.5 rounded-badge border border-border text-text-muted">{e}</span>
                ))}
              </div>
              {p.desc && (
                <p className="text-xs text-text-muted mt-1.5 line-clamp-2 leading-relaxed">{p.desc}</p>
              )}
              <div className="flex items-center gap-2 mt-2">
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-badge border border-brand text-brand font-medium hover:bg-brand-pale transition-colors">
                  <Plus size={12} /> 루틴추가
                </button>
                <button className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-badge border border-border text-text-muted hover:border-brand hover:text-brand transition-colors">
                  <Package size={12} /> 보유추가
                </button>
                <button className="ml-auto"><Heart size={16} className="text-text-muted" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-1 py-6 pb-24">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} onClick={() => setPage(n)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${page === n ? "bg-brand text-white" : "text-text-muted hover:bg-bg-surface"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
