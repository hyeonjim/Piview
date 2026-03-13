"use client";

import { useState, useMemo } from "react";
import { SlidersHorizontal } from "lucide-react";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/products";
import { MAIN_CATEGORIES, BRANDS } from "@/constants/productCategories";
import { DEFAULT_FILTER } from "@/constants/filterDefaults";
import { FilterModal, FilterState } from "@/components/common/FilterModal";
import { CategoryFilter } from "@/components/common/CategoryFilter";
import ProductCard from "@/components/common/ProductCard";
import { Pagination } from "@/components/common/Pagination";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import { toggleSet } from "@/utils/format";

const PAGE_SIZE = 10;

const PRODUCTS = MOCK_SEARCH_PRODUCTS.map((p, i) => ({
  ...p,
  matchScore: 78 + (i % 18),
}));

export default function SearchPage() {
  const [selectedMain, setSelectedMain] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const [routineAdded, setRoutineAdded] = useState<Set<number>>(new Set());
  const [wished, setWished] = useState<Set<number>>(new Set());
  const [owned, setOwned] = useState<Set<number>>(new Set());

  const { toastMsg, showToast } = useToast();

  const addToRoutine = (id: number, name: string) => {
    setRoutineAdded((p) => new Set([...p, id]));
    showToast(`✓ ${name} 루틴에 추가됨!`);
  };

  const filterCount =
    (filter.filterSkin ? 1 : 0) +
    (filter.filterFns.size > 0 ? 1 : 0) +
    (filter.filterBrands.size > 0 ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < 1000000 ? 1 : 0);

  const filtered = useMemo(() => {
    let list = PRODUCTS;
    if (selectedSub) list = list.filter((p) => p.category === selectedSub);
    else if (selectedMain)
      list = list.filter((p) =>
        (MAIN_CATEGORIES[selectedMain] ?? []).includes(p.category),
      );
    if (filter.filterSkin)
      list = list.filter((p) => p.skinTypes.includes(filter.filterSkin!));
    if (filter.filterFns.size > 0)
      list = list.filter((p) =>
        [...filter.filterFns].some((f) => p.effects.includes(f)),
      );
    if (filter.filterBrands.size > 0)
      list = list.filter((p) => filter.filterBrands.has(p.brand));
    return list;
  }, [selectedMain, selectedSub, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="flex flex-col min-h-full bg-white">
      <Toast msg={toastMsg} />

      {/* 헤더 */}
      <div className="px-6 pt-5 pb-3 flex items-center justify-between bg-gradient-to-b from-[#F5F2EA] to-white">
        <h1 className="text-xl font-semibold text-text-primary m-0">
          전체 제품
        </h1>
        <FilterButton
          filterCount={filterCount}
          onClick={() => setShowFilter(true)}
        />
      </div>

      <CategoryFilter
        selectedMain={selectedMain}
        selectedSub={selectedSub}
        onMainSelect={setSelectedMain}
        onSubSelect={setSelectedSub}
      />

      {/* 제품 목록 */}
      <div className="px-6 pt-1 flex flex-col gap-2.5 pb-28">
        {filtered.length === 0 ? (
          <EmptyResult />
        ) : (
          paginated.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              brand={p.brand}
              name={p.name}
              category={p.category}
              categoryShort={p.categoryShort}
              skinTypes={p.skinTypes}
              effects={p.effects}
              layout="vertical"
              actions={{
                onAddRoutine: () => !routineAdded.has(p.id) && addToRoutine(p.id, p.name),
                inRoutine: routineAdded.has(p.id),
                onToggleOwned: () => setOwned((prev) => toggleSet(prev, p.id)),
                isOwned: owned.has(p.id),
                onToggleWish: () => setWished((prev) => toggleSet(prev, p.id)),
                isWished: wished.has(p.id),
                showCompare: true,
              }}
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

function FilterButton({
  filterCount,
  onClick,
}: {
  filterCount: number;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`relative flex items-center justify-center w-9 h-9 rounded-full border-none cursor-pointer ${
        filterCount > 0 ? "bg-brand" : "bg-bg-chip"
      }`}
    >
      <SlidersHorizontal
        size={17}
        color={filterCount > 0 ? "#fff" : "#616161"}
      />
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
        해당하는 제품이 없어요.
        <br />
        필터를 바꿔보세요
      </p>
    </div>
  );
}
