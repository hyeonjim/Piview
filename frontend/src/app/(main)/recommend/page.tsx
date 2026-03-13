"use client";

import { useState, useMemo } from "react";
import { Sparkles, SlidersHorizontal } from "lucide-react";
import { MAIN_CATEGORIES, BRANDS } from "@/constants/productCategories";
import { DEFAULT_FILTER } from "@/constants/filterDefaults";
import { FilterModal, FilterState } from "@/components/common/FilterModal";
import { CategoryFilter } from "@/components/common/CategoryFilter";
import { ProductListCard } from "@/components/common/ProductListCard";
import { Pagination } from "@/components/common/Pagination";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import { toggleSet } from "@/utils/format";
import { MOCK_RECOMMEND } from "@/constants/_mock/recommend";

const PAGE_SIZE = 10;

export default function RecommendPage() {
  const [selectedMain, setSelectedMain] = useState<string | null>(null);
  const [selectedSub,  setSelectedSub]  = useState<string | null>(null);
  const [page,         setPage]         = useState(1);
  const [showFilter,   setShowFilter]   = useState(false);
  const [filter,       setFilter]       = useState<FilterState>(DEFAULT_FILTER);

  const [inRoutine, setInRoutine] = useState<Set<string>>(new Set());
  const [wished,    setWished]    = useState<Set<string>>(new Set());
  const [owned,     setOwned]     = useState<Set<string>>(new Set());

  const { toastMsg, showToast } = useToast();

  const addRoutine = (id: string, name: string) => {
    setInRoutine((p) => new Set([...p, id]));
    showToast(`✓ ${name} 루틴에 추가됨!`);
  };

  const filterCount =
    (filter.filterSkin ? 1 : 0) +
    (filter.filterFns.size > 0 ? 1 : 0) +
    (filter.filterBrands.size > 0 ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < 1000000 ? 1 : 0);

  const filtered = useMemo(() => {
    let list = MOCK_RECOMMEND;
    if (selectedSub) list = list.filter((p) => p.category === selectedSub);
    else if (selectedMain)
      list = list.filter((p) => (MAIN_CATEGORIES[selectedMain] ?? []).includes(p.category));
    if (filter.filterSkin)
      list = list.filter((p) => p.skinTypes.includes(filter.filterSkin!));
    if (filter.filterFns.size > 0)
      list = list.filter((p) => [...filter.filterFns].some((f) => p.effects.includes(f)));
    if (filter.filterBrands.size > 0)
      list = list.filter((p) => filter.filterBrands.has(p.brand));
    return [...list].sort((a, b) => b.matchScore - a.matchScore);
  }, [selectedMain, selectedSub, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-full bg-warm-bg">
      <Toast msg={toastMsg} />

      {/* 헤더 */}
      <div className="px-6 pt-5 pb-3 bg-gradient-to-br from-[#FFF8EE] to-[#F5F2EA]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-brand" />
              <h1 className="text-xl font-semibold text-text-primary m-0">맞춤 추천</h1>
            </div>
            <p className="text-xs text-text-hint m-0">루틴에 없는 카테고리 위주로 추천해드려요</p>
          </div>
          <FilterButton filterCount={filterCount} onClick={() => setShowFilter(true)} />
        </div>
      </div>

      <CategoryFilter
        selectedMain={selectedMain}
        selectedSub={selectedSub}
        onMainSelect={setSelectedMain}
        onSubSelect={setSelectedSub}
      />

      {/* 제품 목록 */}
      <div className="px-6 flex flex-col gap-2.5 pb-28">
        {filtered.length === 0 ? (
          <EmptyResult />
        ) : (
          paginated.map((product) => (
            <ProductListCard
              key={product.id}
              id={product.id}
              brand={product.brand}
              name={product.name}
              category={product.category}
              emoji={product.emoji}
              skinTypes={product.skinTypes}
              effects={product.effects}
              matchScore={product.matchScore}
              reason={product.reason}
              inRoutine={inRoutine.has(product.id)}
              isWished={wished.has(product.id)}
              isOwned={owned.has(product.id)}
              onAddRoutine={() => !inRoutine.has(product.id) && addRoutine(product.id, product.name)}
              onToggleWish={() => setWished((prev) => toggleSet(prev, product.id))}
              onToggleOwned={() => setOwned((prev) => toggleSet(prev, product.id))}
            />
          ))
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

      <FilterModal
        open={showFilter}
        onClose={() => setShowFilter(false)}
        state={filter}
        onChange={(next) => setFilter((prev) => ({ ...prev, ...next }))}
        onReset={() => setFilter(DEFAULT_FILTER)}
        resultCount={filtered.length}
        availableBrands={BRANDS}
      />
    </div>
  );
}

function FilterButton({ filterCount, onClick }: { filterCount: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-9 h-9 rounded-full border-none cursor-pointer ${
        filterCount > 0 ? "bg-brand" : "bg-bg-base"
      }`}
    >
      <SlidersHorizontal size={17} color={filterCount > 0 ? "#fff" : "#616161"} />
      {filterCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center w-4 h-4 rounded-full bg-[#FF5252] text-white text-[9px] font-bold border-2 border-white">
          {filterCount}
        </span>
      )}
    </button>
  );
}

function EmptyResult() {
  return (
    <div className="flex flex-col items-center py-16">
      <span className="text-[40px]">🔍</span>
      <p className="text-center mt-3 text-xs text-text-muted">
        해당하는 제품이 없어요.<br />필터를 바꿔보세요
      </p>
    </div>
  );
}
