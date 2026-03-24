"use client";

import { useState } from "react";
import { X, Search, Package, Loader2 } from "lucide-react";
import ProductCard from "@/components/common/ProductCard";
import { useMutation } from "@tanstack/react-query";
import { getRoutineSteps } from "@/constants/routineSteps";
import { useProductSearch, useProductFilters, useLike } from "@/hooks";
import { useCompare } from "@/hooks/useCompare";
import { useUserStore, selectGender, selectSkinType } from "@/stores";
import { getCategoryDisplayName } from "@/utils/format";
import { toSkinTypeEnum } from "@/utils/enumConvert";
import { mapRecommendResponse } from "@/utils/productMapper";
import type { MappedProduct } from "@/utils/productMapper";
import { productService } from "@/services/product";
import type { RecommendResponseDto } from "@/types/product";
import type { SkinType } from "@/types/user";

interface RoutineAddModalProps {
  /** 현재 열린 스텝 코드 (CL, PR, SR ...) */
  openStep: string;
  /** 현재 draft에 담긴 productId 목록 — 중복 추가 방지용 */
  draftProductIds: number[];
  /** columnId — POST /api/v1/routines/draft 요청에 사용 */
  columnId: number;
  onClose: () => void;
  /** 선택된 제품의 productId를 전달 — page.tsx에서 draft API 호출 */
  onAdd: (productId: number) => void;
}

export default function RoutineAddModal({
  openStep,
  draftProductIds,
  columnId,
  onClose,
  onAdd,
}: RoutineAddModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 7;

  // 피뷰추천 활성화 여부
  const [isRecommendMode, setIsRecommendMode] = useState(false);
  // 추천 API 결과 제품 목록 (최대 5개)
  const [recommendedProducts, setRecommendedProducts] = useState<MappedProduct[]>([]);
  // 추천 제품 ID 집합 — PICK 배지 표시 O(1) 조회용
  const [recommendedProductIdSet, setRecommendedProductIdSet] = useState<Set<number>>(new Set());

  // 좋아요 API 연동 — toggleLike만 사용 (likeList는 ProductCard 내부에서 처리)
  const { toggleLike } = useLike();
  // 비교하기 상태 관리
  const { compareItems, toggleCompare } = useCompare<MappedProduct>();

  // 성별에 따른 루틴 스텝 가져오기
  const currentGender = useUserStore(selectGender);
  // 추천 API 요청에 필요한 유저 피부 타입 및 피부 고민
  const currentSkinType = useUserStore(selectSkinType);
  const userSkinProblems = useUserStore((state) => state.user?.skinProblems ?? []);
  const routineSteps = getRoutineSteps(currentGender);

  // 현재 루틴 단계 정보
  const currentStep = routineSteps.find((step) => step.code === openStep);
  const currentLabel = currentStep?.label ?? "";

  // 카테고리 필터 메타데이터 가져오기
  const availableCategories = currentStep?.categories ?? [];

  // 추천 API의 concernId 조회용으로만 filterMeta 사용
  const { data: filterMeta } = useProductFilters();

  // selectedCategoryId가 없거나 현재 목록에 없으면 첫 번째 카테고리를 기본값으로 파생
  const effectiveCategoryId =
    selectedCategoryId !== null &&
    availableCategories.some((cat) => cat.categoryId === selectedCategoryId)
      ? selectedCategoryId
      : (availableCategories[0]?.categoryId ?? null);

  // 실제 제품 검색 API 연동
  const selectedCategory = availableCategories.find(
    (cat) => cat.categoryId === effectiveCategoryId
  );

  const searchParams = {
    q: searchQuery || undefined,
    bigCategoryId: selectedCategory?.bigCategoryId ?? undefined,
    categoryId: effectiveCategoryId ?? undefined,
    size: 20,
  };

  const { products, isLoading } = useProductSearch(searchParams);

  // 피뷰추천 API 뮤테이션 — POST /recommendations/products
  const recommendationMutation = useMutation({
    mutationFn: () => {
      if (!columnId) {
        return Promise.reject(new Error("columnId가 설정되지 않았습니다."));
      }
      const concernId = userSkinProblems
        .map((problem) => filterMeta?.tags?.find((tag) => tag.tag === problem)?.tagId)
        .find((id) => id !== undefined);
      return productService.getRecommendations({
        skinType: currentSkinType
          ? toSkinTypeEnum(currentSkinType as SkinType)
          : undefined,
        gender: currentGender ?? undefined,
        ...(concernId !== undefined && { concernId }),
        targetRoutineColId: columnId,
      });
    },
    onSuccess: (data) => {
      const currentCategoryName = selectedCategory?.name;
      let productsFromApi: RecommendResponseDto[];

      if (currentCategoryName && data[currentCategoryName]) {
        productsFromApi = data[currentCategoryName];
      } else {
        productsFromApi = Object.values(data).flat();
      }

      const limitedProducts = productsFromApi.slice(0, 5).map(mapRecommendResponse);
      setRecommendedProducts(limitedProducts);
      setRecommendedProductIdSet(new Set(limitedProducts.map((product) => product.id)));
      setIsRecommendMode(true);
      setCurrentPage(1);
    },
    onError: (error) => {
      console.error("피뷰추천 API 실패:", error);
    },
  });

  // 피뷰추천 버튼 클릭 — 추천 모드 토글
  const handleRecommendationToggle = () => {
    if (isRecommendMode) {
      setIsRecommendMode(false);
      setRecommendedProducts([]);
      setRecommendedProductIdSet(new Set());
      setCurrentPage(1);
    } else {
      recommendationMutation.mutate();
    }
  };

  // 추천 모드면 추천 제품, 아니면 검색 결과 사용
  const displayProducts = isRecommendMode ? recommendedProducts : products;
  const totalPages = Math.ceil(displayProducts.length / PAGE_SIZE);
  const pagedProducts = displayProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 검색어 또는 카테고리가 바뀌면 1페이지로 리셋
  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
  };

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none py-10 px-5">
        <div className="bg-white flex flex-col pointer-events-auto rounded-[20px] w-full max-w-[420px] max-h-full shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden">
          <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
            {/* 헤더 — 타이틀, 피뷰추천 버튼, 닫기 버튼 */}
            <div className="flex items-center justify-between mt-[15px]">
              <h3 className="text-[14px] font-bold text-text-primary">
                {currentLabel}
              </h3>
              {/* 우측 버튼 그룹 */}
              <div className="flex items-center gap-2">
                {/* Piview pick 버튼 — 토글 시 활성화 */}
                <button
                  onClick={handleRecommendationToggle}
                  disabled={recommendationMutation.isPending}
                  className={[
                    "flex items-center gap-1.5 h-6 px-2.5 rounded-full cursor-pointer text-[12px] font-semibold transition-all duration-200 border-none disabled:opacity-50 disabled:cursor-not-allowed",
                    isRecommendMode
                      ? "bg-[#f7d2e5] text-[#636161]"
                      : "bg-[#faf0b9] text-[#7A6F5C] hover:bg-[#e2e1e2]",
                  ].join(" ")}
                >
                  {recommendationMutation.isPending && (
                    <Loader2 size={14} className="animate-spin" />
                  )}
                  Piview pick
                </button>
                {/* 닫기 버튼 */}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F5F2EC] border-none cursor-pointer transition-colors hover:bg-[#EAE5DA]"
                >
                  <X size={14} color="#7A6F5C" />
                </button>
              </div>
            </div>

            {/* 추천 모드 활성 시 안내 배너 */}
            {isRecommendMode && (
              <div className="flex items-center gap-1.5 mt-2 px-2 py-1 rounded-xl text-[12px] font-medium bg-[#fff] text-[#555454]">
                {recommendedProducts.length > 0
                  ? `사용자 맞춤 ${recommendedProducts.length}개 제품 추천`
                  : "추천 결과가 없습니다"}
              </div>
            )}

            {/* 검색바 */}
            <div className="relative mt-3 mb-3">
              <Search
                size={16}
                color="var(--color-text-stone)"
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                value={searchQuery}
                onChange={(event) => handleSearchChange(event.target.value)}
                placeholder="제품명 또는 브랜드 검색"
                className={[
                  "w-full h-10 pl-9 rounded-xl border border-border-warm bg-[#FAF8F5] text-xs text-[#2A2A2A] outline-none",
                  searchQuery ? "pr-9" : "pr-3",
                ].join(" ")}
              />
              {searchQuery && (
                <button
                  onClick={() => handleSearchChange("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-border-warm border-none cursor-pointer"
                >
                  <X size={12} color="#888" />
                </button>
              )}
            </div>

            {/* 카테고리 필터 - 현재 루틴 단계의 소분류만 표시 */}
            {availableCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 p-[5px_0px] min-h-[32px] mb-2">
                {availableCategories.map((cat) => {
                  const isActive = effectiveCategoryId === cat.categoryId;
                  return (
                    <button
                      key={cat.categoryId}
                      onClick={() => {
                        if (!isActive) handleCategoryChange(cat.categoryId);
                      }}
                      className="category-pill-button"
                      data-active={isActive}
                    >
                      {getCategoryDisplayName(cat.name)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 로딩 상태 — 일반 검색 로딩 또는 추천 API 로딩 */}
            {(isLoading && !isRecommendMode) || recommendationMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
                <Loader2 size={24} className="animate-spin opacity-50" />
                <p className="text-xs">제품을 불러오는 중...</p>
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-stone)]">
                <Package size={32} className="mb-2 opacity-50" />
                <p className="text-xs">
                  {isRecommendMode ? "추천 결과가 없습니다" : "검색 결과가 없습니다"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {pagedProducts.map((product) => {
                    const isInCompare = compareItems.some((item) => item.id === product.id);

                    return (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        brand={product.brand}
                        imageUrl={product.imageUrl ?? undefined}
                        category={product.category}
                        skinTypes={product.skinTypes}
                        effects={product.effects}
                        variant="modal"
                        isRecommended={recommendedProductIdSet.has(product.id)}
                        inRoutine={draftProductIds.includes(product.id)}
                        onAddRoutine={() => onAdd(product.id)}
                        onToggleLike={() => toggleLike(product.id)}
                        isInCompare={isInCompare}
                        onToggleCompare={() => toggleCompare(product)}
                      />
                    );
                  })}
                </div>

                {/* 페이지네이션 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-1 mt-4 mb-1">
                    <button
                      onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                      disabled={currentPage === 1}
                      className="w-7 h-7 rounded-full border border-border-warm bg-white text-xs text-text-muted disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      ‹
                    </button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={[
                          "w-7 h-7 rounded-full border text-xs font-semibold cursor-pointer transition-colors",
                          currentPage === page
                            ? "border-(--color-brand) bg-(--color-brand) text-white"
                            : "border-border-warm bg-white text-text-muted",
                        ].join(" ")}
                      >
                        {page}
                      </button>
                    ))}
                    <button
                      onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                      disabled={currentPage === totalPages}
                      className="w-7 h-7 rounded-full border border-border-warm bg-white text-xs text-text-muted disabled:opacity-30 cursor-pointer disabled:cursor-default"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
