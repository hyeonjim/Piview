"use client";

import { useState, useMemo } from "react";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/searchProducts";
import { MAIN_CATEGORIES, BRANDS } from "@/constants/productCategories";
import { DEFAULT_FILTER } from "@/constants/filterDefaults";
import { FilterModal, FilterState } from "@/components/common/FilterModal";
import { CategoryFilter } from "@/components/common/CategoryFilter";
import ProductCard from "@/components/common/ProductCard";
import { Pagination } from "@/components/common/Pagination";
import { Toast } from "@/components/common/Toast";
import EmptyState from "@/components/common/EmptyState";
import FilterButton from "@/components/common/FilterButton";
import SearchBar from "@/components/common/SearchBar";
import { useToast } from "@/hooks";
import { useLike } from "@/hooks/useLike";
import { toggleSet } from "@/utils/format";
import { Search } from "lucide-react";

const PAGE_SIZE = 10;

// matchScore 보완 — ⚠️ API 연동 시 서버에서 계산된 값으로 교체
const PRODUCTS = MOCK_SEARCH_PRODUCTS.map((p, i) => ({
  ...p,
  matchScore: p.matchScore ?? 78 + (i % 18),
}));

export default function SearchPage() {
  const [selectedMain, setSelectedMain] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const { toggleLike, isLiked } = useLike();
  const [routineAdded, setRoutineAdded] = useState<Set<string>>(new Set());
  const [owned, setOwned] = useState<Set<string>>(new Set());

  const { toastMsg, showToast } = useToast();

  const addToRoutine = (id: string, name: string) => {
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
    // 검색어 필터
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
      );
    }
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
  }, [selectedMain, selectedSub, searchQuery, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // 검색어/필터 변경 시 페이지 초기화
  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    setPage(1);
  };
  const handleMainSelect = (val: string | null) => {
    setSelectedMain(val);
    setPage(1);
  };
  const handleSubSelect = (val: string | null) => {
    setSelectedSub(val);
    setPage(1);
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      <Toast msg={toastMsg} />

      {/* 헤더 */}
      <div className="px-6 pt-5 pb-3 bg-gradient-to-b from-[#F5F2EA] to-white">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-text-primary m-0">
            전체 제품
          </h1>
          <FilterButton
            filterCount={filterCount}
            onClick={() => setShowFilter(true)}
          />
        </div>
        <SearchBar
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="제품명, 브랜드 검색..."
        />
      </div>

      <CategoryFilter
        selectedMain={selectedMain}
        selectedSub={selectedSub}
        onMainSelect={handleMainSelect}
        onSubSelect={handleSubSelect}
      />

      {/* 제품 목록 */}
      <div className="px-6 pt-1 flex flex-col gap-2.5 pb-28">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="해당하는 제품이 없어요"
            description="검색어나 필터를 바꿔보세요"
          />
        ) : (
          paginated.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              brand={p.brand}
              name={p.name}
              category={p.category}
              emoji={p.emoji}
              skinTypes={p.skinTypes}
              effects={p.effects}
              actions={{
                onAddRoutine: () =>
                  !routineAdded.has(p.id) && addToRoutine(p.id, p.name),
                inRoutine: routineAdded.has(p.id),
                onToggleOwned: () => setOwned((prev) => toggleSet(prev, p.id)),
                isOwned: owned.has(p.id),
                onToggleLike: () => toggleLike(p.id),
                isLiked: isLiked(p.id),
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
