"use client";

import { useState } from "react";
import { PAGE_SIZE } from "@/constants/pagination";
import { FilterModal } from "@/components/common/FilterModal";
import { CategoryFilter } from "@/components/common/CategoryFilter";
import ProductCard from "@/components/common/ProductCard";
import { Pagination } from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import SearchBar from "@/components/common/SearchBar";
import CompareModal from "@/components/common/CompareModal";
import type { ProductViewModel } from "@/types/product/myCos";
import { useCompare, useProductSearch } from "@/hooks";
import { useAddMyCos, useRemoveMyCos, useMyCosQuery } from "@/hooks";
import { useRecommendStore } from "@/stores/useRecommendStore";
import { SlidersHorizontal, Search } from "lucide-react";

import { toSkinTypeParam } from "@/utils/enumConvert";
import { PRICE_MAX } from "@/types/common";
import type { SkinType } from "@/types/user";

export default function RecommendPage() {
  const {
    searchQuery,
    selectedBigCategoryId,
    selectedCategoryId,
    filter,
    page,
    maxKnownPage,
    setSearchQuery,
    setSelectedBigCategoryId,
    setSelectedCategoryId,
    setFilter,
    resetFilter,
    setPage,
  } = useRecommendStore();

  const [showFilter, setShowFilter] = useState(false);

  // ── API 연동 ───────────────────────────────────────────────────
  const {
    products,
    hasNext,
    totalCount,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
  } = useProductSearch({
    q: searchQuery.trim() || undefined,
    bigCategoryId: selectedBigCategoryId ?? undefined,
    categoryId: selectedCategoryId ?? undefined,
    skinType: filter.filterSkin
      ? toSkinTypeParam(filter.filterSkin as SkinType)
      : undefined,
    tagIds:
      Object.keys(filter.tagIds).filter((k) => filter.tagIds[Number(k)])
        .length > 0
        ? Object.keys(filter.tagIds)
            .filter((k) => filter.tagIds[Number(k)])
            .map(Number)
        : undefined,
    brandIds:
      Object.keys(filter.brandIds).filter((k) => filter.brandIds[Number(k)])
        .length > 0
        ? Object.keys(filter.brandIds)
            .filter((k) => filter.brandIds[Number(k)])
            .map(Number)
        : undefined,
    minPrice: filter.priceRange[0] > 0 ? filter.priceRange[0] : undefined,
    maxPrice:
      filter.priceRange[1] < PRICE_MAX ? filter.priceRange[1] : undefined,
    page: page - 1,
    size: PAGE_SIZE,
  });

  // Slice 기반 페이지네이션
  const totalPages =
    totalCount !== null
      ? Math.ceil(totalCount / PAGE_SIZE)
      : hasNext
        ? Math.max(maxKnownPage, page) + 1
        : Math.max(maxKnownPage, page);

  const handlePageChange = (p: number) => {
    setPage(p);
    window.scrollTo(0, 0);
  };

  // 보유 상태 — API 연동
  const { data: myCosData = [] } = useMyCosQuery();
  const { mutate: addMyCos } = useAddMyCos();
  const { mutate: removeMyCos } = useRemoveMyCos();
  const isOwned = (id: number) =>
    myCosData.some((item) => item.productInfo.productId === id);
  const handleToggleOwned = (productId: number) => {
    const owned = myCosData.find(
      (item) => item.productInfo.productId === productId,
    );
    if (owned) removeMyCos(owned.myCosId);
    else addMyCos(productId);
  };

  const {
    compareItems,
    showCompare,
    toggleCompare,
    clearCompare,
    openCompare,
    closeCompare,
    canCompare,
  } = useCompare<ProductViewModel>();

  const filterCount =
    (filter.filterSkin ? 1 : 0) +
    (Object.values(filter.tagIds).some(Boolean) ? 1 : 0) +
    (Object.values(filter.brandIds).some(Boolean) ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < PRICE_MAX ? 1 : 0);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };
  const handleBigCategorySelect = (bigCategoryId: number | null) => {
    setSelectedBigCategoryId(bigCategoryId);
  };
  const handleCategorySelect = (categoryId: number | null) => {
    setSelectedCategoryId(categoryId);
  };

  const handleToggleCompare = (product: ProductViewModel) => {
    const isAlreadySelected = compareItems.some(
      (item) => item.id === product.id,
    );
    toggleCompare(product);
    if (!isAlreadySelected && compareItems.length === 1) openCompare();
  };

  return (
    <div className="flex-1 bg-[#f9f8f6]">
      {showCompare && canCompare && (
        <CompareModal
          compareItems={compareItems as [ProductViewModel, ProductViewModel]}
          onClose={closeCompare}
        />
      )}

      {/* 상단 헤더 — 미세한 웜 베이지 */}
      <div className="bg-[#faf8f5] pt-[5px]">
        <div className="px-5 pt-4 pb-3">
          <h1 className="mt-[3px] mb-3.5 text-[20px] font-semibold text-[#635446] leading-[1.2]">
            Recommend
          </h1>
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="제품명, 브랜드 검색..."
              />
            </div>
            {/* 필터 버튼 — 미니멀 스타일 */}
            <button
              onClick={() => setShowFilter(true)}
              className={`flex items-center gap-1.5 h-[38px] px-3.5 rounded-full text-[13px] font-medium border cursor-pointer transition-all active:scale-[0.96] shrink-0 ${
                filterCount > 0
                  ? "bg-[#5a504a] border-[#5a504a] text-white"
                  : "bg-[#faf8f5] border-[#e8e4e0] text-[#8c8277]"
              }`}
            >
              <SlidersHorizontal size={14} />
              필터
              {filterCount > 0 && (
                <span className="flex items-center justify-center w-[18px] h-[18px] rounded-full bg-white/20 text-[10px] font-semibold">
                  {filterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <CategoryFilter
        selectedBigCategoryId={selectedBigCategoryId}
        selectedCategoryId={selectedCategoryId}
        onBigCategorySelect={handleBigCategorySelect}
        onCategorySelect={handleCategorySelect}
      />

      {/* 비교 힌트 바 — 1개 선택 시 */}
      {compareItems.length === 1 && (
        <div className="flex items-center justify-between mx-5 px-4 py-2 rounded-xl bg-white border border-[#e8e4e0]">
          <span className="text-[13px] font-medium text-[#6e6358]">
            비교할 제품을 1개 더 선택하세요
          </span>
          <button
            onClick={clearCompare}
            className="text-xs text-[#a69d92] bg-transparent border-none cursor-pointer"
          >
            취소
          </button>
        </div>
      )}

      {/* 비교 힌트 바 — 2개 선택 완료 */}
      {canCompare && (
        <div className="flex items-center justify-between mx-5 px-4 py-2 rounded-xl bg-[#e9c8b3]">
          <span className="text-[13px] font-medium text-[#fff]">
            2개 제품 선택 완료
          </span>
          <div className="flex gap-2">
            <button
              onClick={clearCompare}
              className="text-[11px] text-white/90 bg-transparent border-none cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={openCompare}
              className="text-xs font-semibold text-[#7f7772] bg-white border-none rounded-lg px-3 py-1.5 cursor-pointer"
            >
              비교하기
            </button>
          </div>
        </div>
      )}

      {/* 제품 그리드 */}
      <div className="px-5 py-4">
        {isLoading || (isFetching && isPlaceholderData) ? (
          <div className="flex justify-center py-20 text-[13px] text-[#a69d92]">
            불러오는 중...
          </div>
        ) : isError ? (
          <div className="flex justify-center py-20 text-[13px] text-[#a69d92]">
            오류가 발생했어요. 다시 시도해 주세요.
          </div>
        ) : products.length === 0 ? (
          <div className="mt-2 rounded-2xl border border-[#eee] bg-white">
            <EmptyState
              icon={Search}
              title="해당하는 제품이 없어요"
              description="검색어나 필터를 바꿔보세요"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-7 items-stretch">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                priority={index === 0}
                id={product.id}
                brand={product.brand}
                name={product.name}
                category={product.category}
                imageUrl={product.imageUrl ?? undefined}
                skinTypes={product.skinTypes}
                effects={product.effects}
                layout="grid"
                isRecommended={true}
                showActions={true}
                isOwned={isOwned(product.id)}
                onToggleOwned={() => handleToggleOwned(product.id)}
                isInCompare={compareItems.some(
                  (item) => item.id === product.id,
                )}
                onToggleCompare={() =>
                  handleToggleCompare({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    imageUrl: product.imageUrl ?? null,
                    skinTypes: product.skinTypes,
                    effects: product.effects,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={handlePageChange}
      />

      <FilterModal
        open={showFilter}
        onClose={() => setShowFilter(false)}
        state={filter}
        onChange={(next) => {
          setFilter(next);
        }}
        onReset={resetFilter}
      />
    </div>
  );
}
