"use client";

import { useState, useMemo } from "react";
import { Sparkles, Search } from "lucide-react";
import { MAIN_CATEGORIES, BRANDS } from "@/constants/productCategories";
import { DEFAULT_FILTER } from "@/constants/filterDefaults";
import { FilterModal } from "@/components/common/FilterModal";
import { FilterState } from "@/components/common/FilterModal";
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
import { MOCK_RECOMMEND } from "@/constants/_mock/recommend";

const PAGE_SIZE = 10;

export default function RecommendPage() {
  const [selectedMain, setSelectedMain] = useState<string | null>(null);
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const { toggleLike, isLiked } = useLike();
  const [inRoutine, setInRoutine] = useState<Set<string>>(new Set());
  const [owned, setOwned] = useState<Set<string>>(new Set());

  const { toastMessage, showToast } = useToast();

  const addRoutine = (id: string, name: string) => {
    setInRoutine((prev) => new Set([...prev, id]));
    showToast(`✓ ${name} 루틴에 추가됨!`);
  };

  const filterCount =
    (filter.filterSkin ? 1 : 0) +
    (filter.filterFns.size > 0 ? 1 : 0) +
    (filter.filterBrands.size > 0 ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < 1000000 ? 1 : 0);

  const filtered = useMemo(() => {
    let list = MOCK_RECOMMEND;
    // 검색어 필터
    if (searchQuery.trim()) {
      const searchKeyword = searchQuery.toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(searchKeyword) ||
          product.brand.toLowerCase().includes(searchKeyword),
      );
    }
    if (selectedSub)
      list = list.filter((product) => product.category === selectedSub);
    else if (selectedMain)
      list = list.filter((product) =>
        (MAIN_CATEGORIES[selectedMain] ?? []).includes(product.category),
      );
    if (filter.filterSkin)
      list = list.filter((product) =>
        product.skinTypes.includes(filter.filterSkin!),
      );
    if (filter.filterFns.size > 0)
      list = list.filter((product) =>
        [...filter.filterFns].some((effect) =>
          product.effects.includes(effect),
        ),
      );
    if (filter.filterBrands.size > 0)
      list = list.filter((product) => filter.filterBrands.has(product.brand));
    return [...list].sort((a, b) => b.matchScore - a.matchScore);
  }, [selectedMain, selectedSub, searchQuery, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setPage(1);
  };
  const handleMainSelect = (value: string | null) => {
    setSelectedMain(value);
    setPage(1);
  };
  const handleSubSelect = (value: string | null) => {
    setSelectedSub(value);
    setPage(1);
  };

  return (
    <div className="flex flex-col min-h-full bg-warm-bg">
      <Toast msg={toastMessage} />

      {/* 헤더 */}
      <div className="px-6 pt-5 pb-3 bg-gradient-to-br from-[#FFF8EE] to-[#F5F2EA]">
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-brand" />
              <h1 className="text-xl font-semibold text-text-primary m-0">
                맞춤 추천
              </h1>
            </div>
            <p className="text-xs text-text-hint m-0">
              루틴에 없는 카테고리 위주로 추천해드려요
            </p>
          </div>
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
      <div className="px-6 flex flex-col gap-2.5 pb-28">
        {filtered.length === 0 ? (
          <EmptyState
            icon={Search}
            title="해당하는 제품이 없어요"
            description="검색어나 필터를 바꿔보세요"
          />
        ) : (
          paginated.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              brand={product.brand}
              name={product.name}
              category={product.category}
              emoji={product.emoji}
              skinTypes={product.skinTypes}
              effects={product.effects}
              reason={product.reason}
              isRecommended={!!product.reason}
              actions={{
                onAddRoutine: () =>
                  !inRoutine.has(product.id) &&
                  addRoutine(product.id, product.name),
                inRoutine: inRoutine.has(product.id),
                onToggleOwned: () =>
                  setOwned((prev) => toggleSet(prev, product.id)),
                isOwned: owned.has(product.id),
                onToggleLike: () => toggleLike(product.id),
                isLiked: isLiked(product.id),
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
