"use client";

import { PAGE_SIZE } from "@/constants/pagination";
import { CategoryFilter } from "@/components/common/CategoryFilter";
import ProductCard from "@/components/common/ProductCard";
import { Pagination } from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import CompareModal from "@/components/common/CompareModal";
import type { ProductViewModel } from "@/types/product/myCos";
import { useCompare, useDynamicRecommendations } from "@/hooks";
import { useAddMyCos, useRemoveMyCos, useMyCosQuery } from "@/hooks";
import { useRecommendStore } from "@/stores/useRecommendStore";
import { Sparkles } from "lucide-react";

export default function RecommendPage() {
  const {
    selectedBigCategoryId,
    selectedCategoryId,
    page,
    maxKnownPage,
    setSelectedBigCategoryId,
    setSelectedCategoryId,
    setPage,
  } = useRecommendStore();

  // ── 동적 추천 API ─────────────────────────────────────────────
  const {
    products,
    hasNext,
    totalCount,
    isLoading,
    isFetching,
    isPlaceholderData,
    isError,
  } = useDynamicRecommendations({
    bigCategoryId: selectedBigCategoryId ?? undefined,
    categoryId: selectedCategoryId ?? undefined,
  });

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

  // 보유 상태
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

      {/* 상단 헤더 */}
      <div className="bg-[#faf8f5] pt-[5px]">
        <div className="px-5 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={16} className="text-[#a69d92]" />
            <h1 className="mt-[3px] text-[20px] font-semibold text-[#635446] leading-[1.2]">
              Recommend
            </h1>
          </div>
          <p className="text-[13px] text-[#a69d92] mt-1">
            나의 탐색 기록을 반영한 맞춤 추천
          </p>
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
              icon={Sparkles}
              title="아직 추천 데이터가 없어요"
              description="제품을 둘러보면 맞춤 추천이 생겨요"
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
    </div>
  );
}
