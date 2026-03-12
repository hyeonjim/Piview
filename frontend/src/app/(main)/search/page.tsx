"use client";

/**
 * app/(main)/search/page.tsx
 *
 * 변경사항:
 *  - 루틴추가 버튼: 모달 없이 클릭 즉시 추가 + 상단 토스트 ("✓ [상품명] 루틴에 추가됨!")
 *  - 추가된 제품 카드: "✓ 루틴추가됨" 그레이 버튼으로 변경 (피그마 이미지 동일)
 */

import { useState } from "react";
import { SlidersHorizontal, Plus, Heart, Package, Check, GitCompareArrows } from "lucide-react";
import Link from "next/link";
import { SearchBar, SkinTypeBadge } from "@/components/common";
import { SEARCH_TABS, SUB_CATS, CONCERNS_FILTER } from "@/constants";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/products";
import { CATEGORY_COLORS, SKIN_FUNCTION_COLORS, SKIN_TYPE_TAG_COLORS } from "@/constants/categoryColors";

const P = "#A2AA7B", PBG = "#F0F2E8";

export default function SearchPage() {
  const [query,      setQuery]      = useState("");
  const [activeTab,  setActiveTab]  = useState("카테고리별");
  const [page,       setPage]       = useState(1);

  // ✅ 루틴추가: Set으로 id 관리, 모달 없음
  const [routineAdded, setRoutineAdded] = useState<Set<number>>(new Set());
  const [wished,       setWished]       = useState<Set<number>>(new Set());
  const [owned,        setOwned]        = useState<Set<number>>(new Set());

  // 토스트
  const [toast, setToast] = useState("");
  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };

  const handleAddToRoutine = (id: number, name: string) => {
    setRoutineAdded((prev) => new Set([...prev, id]));
    showToast(`✓ ${name} 루틴에 추가됨!`);
  };

  return (
    <div className="flex flex-col min-h-full">

      {/* 토스트 */}
      {toast && (
        <div
          className="fixed top-16 left-1/2 z-[60] -translate-x-1/2 pointer-events-none"
          style={{
            padding:"10px 18px", borderRadius:40,
            backgroundColor:"rgba(40,40,40,0.88)", color:"white",
            fontSize:"13px", fontWeight:600,
            boxShadow:"0 4px 20px rgba(0,0,0,0.25)",
            backdropFilter:"blur(8px)",
            whiteSpace:"nowrap",
          }}
        >
          {toast}
        </div>
      )}

      {/* 상단 검색 / 탭 영역 */}
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
              className={`px-4 py-1.5 rounded-badge text-sm font-medium transition-all ${activeTab===c?"bg-text-primary text-white":"text-text-muted"}`}>
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUB_CATS.map((c) => (
            <button key={c} className="whitespace-nowrap px-3 py-1 rounded-badge border border-border text-xs text-text-secondary shrink-0 hover:border-brand hover:text-brand transition-colors">
              {c}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-1.5 overflow-x-auto pb-1 scrollbar-hide">
          {CONCERNS_FILTER.map((c) => (
            <button key={c} className="whitespace-nowrap px-3 py-1 rounded-badge border border-border text-xs text-text-secondary shrink-0 hover:border-brand hover:text-brand transition-colors">
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* 제품 카드 목록 */}
      <div className="flex flex-col divide-y divide-border">
        {MOCK_SEARCH_PRODUCTS.map((p) => {
          const inRoutine = routineAdded.has(p.id);
          const isWished  = wished.has(p.id);
          const isOwned   = owned.has(p.id);
          const catC = CATEGORY_COLORS[p.category];

          return (
            <div
              key={p.id}
              className="px-4 py-4 transition-all"
              style={{ backgroundColor: inRoutine ? "#FDFDF9" : undefined }}
            >
              <div className="flex gap-3">
                {/* 썸네일 */}
                <Link href={`/product/${p.id}`}>
                  <div className="w-[72px] h-[72px] rounded-xl bg-bg-surface flex items-center justify-center text-xs font-bold text-text-muted shrink-0 overflow-hidden">
                    {p.categoryShort}
                  </div>
                </Link>

                <div className="flex-1 min-w-0">
                  {/* 브랜드 + 카테고리 뱃지 */}
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-xs text-text-muted">{p.brand}</span>
                    {catC && (
                      <span style={{ fontSize:"10px", padding:"1px 6px", borderRadius:4, backgroundColor:catC.chip, color:catC.accent, fontWeight:500 }}>
                        {p.category}
                      </span>
                    )}
                    {inRoutine && (
                      <span style={{ fontSize:"10px", padding:"1px 6px", borderRadius:4, backgroundColor:PBG, color:P, fontWeight:600 }}>
                        루틴
                      </span>
                    )}
                  </div>

                  {/* 상품명 */}
                  <Link href={`/product/${p.id}`}>
                    <p className="text-sm font-semibold text-text-primary truncate">{p.name}</p>
                  </Link>

                  {/* 피부타입 태그 */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.skinTypes.map((st) => {
                      const c = SKIN_TYPE_TAG_COLORS[st] ?? { bg:"#F0EDE8", text:"#7A7060" };
                      return (
                        <span key={st} style={{ fontSize:"10px", padding:"1px 6px", borderRadius:4, backgroundColor:c.bg, color:c.text, fontWeight:600 }}>
                          {st}
                        </span>
                      );
                    })}
                  </div>

                  {/* 피부기능 태그 */}
                  <div className="flex flex-wrap gap-1 mt-1">
                    {p.effects.slice(0,4).map((fn) => {
                      const fc = SKIN_FUNCTION_COLORS[fn];
                      return fc ? (
                        <span key={fn} style={{ fontSize:"10px", padding:"1px 5px", borderRadius:4, backgroundColor:fc.chip, color:fc.accent, fontWeight:500 }}>
                          {fn}
                        </span>
                      ) : null;
                    })}
                  </div>
                </div>
              </div>

              {/* ✅ 액션 버튼 행 — 피그마 이미지 동일 레이아웃 */}
              <div className="flex items-center gap-2 mt-3">
                {/* 루틴추가 / 루틴추가됨 */}
                <button
                  onClick={() => !inRoutine && handleAddToRoutine(p.id, p.name)}
                  className="flex-1 flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
                  style={{
                    height: 36, borderRadius: 40,
                    backgroundColor: inRoutine ? "#F0F0F0" : P,
                    color: inRoutine ? "#AFAFAF" : "#fff",
                    fontSize: "13px", fontWeight: 700,
                    border: "none",
                  }}
                >
                  {inRoutine
                    ? <><Check size={12}/> 루틴추가됨</>
                    : <><Plus size={12}/> 루틴추가</>}
                </button>

                {/* 보유추가 */}
                <button
                  onClick={() => setOwned((prev) => {
                    const n = new Set(prev);
                    n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                    return n;
                  })}
                  className="flex items-center gap-1.5 transition-all active:scale-[0.97]"
                  style={{
                    height: 36, padding: "0 14px", borderRadius: 40,
                    backgroundColor: isOwned ? PBG : "white",
                    color: isOwned ? P : "#757575",
                    border: isOwned ? `1px solid ${P}40` : "1px solid #E0E0E0",
                    fontSize: "12px", fontWeight: 600,
                  }}
                >
                  <Package size={13}/> 보유추가
                </button>

                {/* 찜 */}
                <button
                  onClick={() => setWished((prev) => {
                    const n = new Set(prev);
                    n.has(p.id) ? n.delete(p.id) : n.add(p.id);
                    return n;
                  })}
                  className="flex items-center justify-center transition-all active:scale-[0.97]"
                  style={{ width:36, height:36, borderRadius:"50%", border:"1px solid #E0E0E0", backgroundColor:"white" }}
                >
                  <Heart
                    size={16}
                    color={isWished ? "#FF4081" : "#9E9E9E"}
                    fill={isWished ? "#FF4081" : "none"}
                  />
                </button>

                {/* 비교 */}
                <button
                  className="flex items-center justify-center transition-all active:scale-[0.97]"
                  style={{ width:36, height:36, borderRadius:"50%", border:"1px solid #E0E0E0", backgroundColor:"white" }}
                >
                  <GitCompareArrows size={15} color="#9E9E9E"/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 페이지네이션 */}
      <div className="flex items-center justify-center gap-1 py-6 pb-24">
        {[1,2,3,4,5].map((n) => (
          <button key={n} onClick={() => setPage(n)}
            className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${page===n?"bg-brand text-white":"text-text-muted hover:bg-bg-surface"}`}>
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
