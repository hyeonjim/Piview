"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const SEARCH_INPUT_PADDING_CLEAR = 36;
const SEARCH_INPUT_PADDING_DEFAULT = 12;
const MODAL_ACTION_ICON_BTN = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  border: "1px solid var(--color-border-warm)",
  backgroundColor: "white",
  cursor: "pointer",
};

import { useState, useMemo } from "react";
import { X, Search, Package, Heart, GitCompare, Loader2, Sparkles } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { getRoutineSteps } from "@/constants/routineSteps";
import { useProductSearch, useProductFilters } from "@/hooks";
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

  // 성별에 따른 루틴 스텝 가져오기
  const currentGender = useUserStore(selectGender);
  // 추천 API 요청에 필요한 유저 피부 타입 및 피부 고민
  const currentSkinType = useUserStore(selectSkinType);
  const userSkinProblems = useUserStore((state) => state.user?.skinProblems ?? []);
  const routineSteps = getRoutineSteps(currentGender);

  // 현재 루틴 단계 정보
  const currentStep = routineSteps.find((step) => step.code === openStep);
  const currentLabel = currentStep?.label ?? "";
  const stepCategories = currentStep?.categories ?? [];

  // 카테고리 필터 메타데이터 가져오기
  const { data: filterMeta } = useProductFilters();
  const bigCategories = filterMeta?.bigCategories ?? [];

  // 현재 루틴 단계의 카테고리들을 API 메타데이터와 매칭하여 ID 포함한 정보로 변환
  const availableCategories = useMemo(() => {
    if (!filterMeta || stepCategories.length === 0) return [];

    const allSubCategories = bigCategories.flatMap((bc) =>
      bc.categories.map((cat) => ({
        ...cat,
        bigCategoryId: bc.bigCategoryId,
      }))
    );

    return stepCategories
      .map((categoryName) => {
        // 정확히 일치하는 카테고리 찾기
        return allSubCategories.find((cat) => cat.categoryName === categoryName);
      })
      .filter((cat): cat is NonNullable<typeof cat> => cat !== undefined);
  }, [filterMeta, stepCategories, bigCategories]);

  // selectedCategoryId가 없거나 현재 목록에 없으면 첫 번째 카테고리를 기본값으로 파생
  const effectiveCategoryId =
    selectedCategoryId !== null &&
    availableCategories.some((cat) => cat.categoryId === selectedCategoryId)
      ? selectedCategoryId
      : (availableCategories[0]?.categoryId ?? null);

  // 실제 제품 검색 API 연동
  // 검색어와 카테고리 ID로 필터링
  const selectedCategory = availableCategories.find(
    (cat) => cat.categoryId === effectiveCategoryId
  );

  const searchParams = useMemo(() => ({
    q: searchQuery || undefined,
    bigCategoryId: selectedCategory?.bigCategoryId ?? undefined,
    categoryId: effectiveCategoryId ?? undefined,
    size: 20,
  }), [searchQuery, selectedCategory, effectiveCategoryId]);

  const { products, isLoading } = useProductSearch(searchParams);

  // 피뷰추천 API 뮤테이션 — POST /recommendations/products
  const recommendationMutation = useMutation({
    mutationFn: () => {
      // columnId가 0이면 모달이 아직 제대로 초기화되지 않은 상태 — 요청 차단
      if (!columnId) {
        return Promise.reject(new Error("columnId가 설정되지 않았습니다."));
      }
      const concernId = filterMeta?.tags?.find(
        (tag) => tag.tag === userSkinProblems[0]
      )?.tagId;
      return productService.getRecommendations({
        skinType: currentSkinType
          ? toSkinTypeEnum(currentSkinType as SkinType)
          : undefined,
        gender: currentGender ?? undefined,
        // filterMeta.tags에서 유저의 첫 번째 skinProblem과 일치하는 tagId를 concernId로 사용
        // swagger: tagIds는 내부적으로 concernId로 처리됨
        concernId,
        targetRoutineColId: columnId,
      });
    },
    onSuccess: (data) => {
      // 응답은 Record<categoryName, RecommendResponseDto[]>
      // 현재 선택된 카테고리명과 일치하는 제품 우선 사용, 없으면 전체 합산
      const currentCategoryName = selectedCategory?.categoryName;
      let productsFromApi: RecommendResponseDto[];

      if (currentCategoryName && data[currentCategoryName]) {
        productsFromApi = data[currentCategoryName];
      } else {
        productsFromApi = Object.values(data).flat();
      }

      // 최대 5개 표시
      const limitedProducts = productsFromApi.slice(0, 5).map(mapRecommendResponse);
      setRecommendedProducts(limitedProducts);
      setRecommendedProductIdSet(new Set(limitedProducts.map((product) => product.id)));
      setIsRecommendMode(true);
      setCurrentPage(1);
    },
    onError: (error) => {
      console.error("❌ 피뷰추천 API 실패:", error);
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
              <h3 className="text-base font-bold text-text-primary">
                {currentLabel}
              </h3>
              {/* 우측 버튼 그룹 */}
              <div className="flex items-center gap-2">
                {/* 피뷰추천 버튼 — 토글 시 브랜드 컬러로 활성화 */}
                <button
                  onClick={handleRecommendationToggle}
                  disabled={recommendationMutation.isPending}
                  className={[
                    "flex items-center gap-1 h-7 px-2.5 rounded-full border cursor-pointer text-[11px] font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed",
                    isRecommendMode
                      ? "bg-(--color-brand) text-white border-(--color-brand)"
                      : "bg-bg-muted-warm text-text-stone border-border-warm",
                  ].join(" ")}
                >
                  {recommendationMutation.isPending ? (
                    <Loader2 size={11} className="animate-spin" />
                  ) : (
                    <Sparkles size={11} />
                  )}
                  피뷰추천
                </button>
                {/* 닫기 버튼 */}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-bg-muted-warm border-none cursor-pointer"
                >
                  <X size={14} color="#888" />
                </button>
              </div>
            </div>

            {/* 추천 모드 활성 시 안내 배너 */}
            {isRecommendMode && (
              <div className="flex items-center gap-1.5 mt-2 px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-(--color-brand-bg) text-(--color-brand)">
                <Sparkles size={11} />
                {recommendedProducts.length > 0
                  ? `피부 맞춤 ${recommendedProducts.length}개 제품 추천`
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
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border-warm bg-[#FAF8F5] text-xs text-[#2A2A2A] outline-none"
                style={{
                  paddingRight: searchQuery
                    ? SEARCH_INPUT_PADDING_CLEAR
                    : SEARCH_INPUT_PADDING_DEFAULT,
                }}
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
              <div className="flex flex-wrap gap-2 p-[10px_0px] min-h-[52px] mb-2">
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
                      {getCategoryDisplayName(cat.categoryName)}
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
                  {pagedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isAdded={draftProductIds.includes(product.id)}
                      isRecommended={recommendedProductIdSet.has(product.id)}
                      onAdd={() => onAdd(product.id)}
                    />
                  ))}
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
                        className="w-7 h-7 rounded-full border text-xs font-semibold cursor-pointer transition-colors"
                        style={{
                          borderColor: currentPage === page ? "var(--color-brand)" : "var(--color-border-warm)",
                          backgroundColor: currentPage === page ? "var(--color-brand)" : "white",
                          color: currentPage === page ? "white" : "var(--color-text-muted)",
                        }}
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

// ── 제품 카드 ────────────────────────────────────────────────────────────────
interface ProductCardProps {
  product: MappedProduct;
  isAdded: boolean;
  /** 피뷰추천 결과 제품 여부 — true이면 PICK 배지 표시 */
  isRecommended?: boolean;
  onAdd: () => void;
}

function ProductCard({ product, isAdded, isRecommended = false, onAdd }: ProductCardProps) {
  return (
    <div
      className="rounded-[14px] p-4 border"
      style={{
        borderColor: isAdded
          ? "var(--color-brand-light)"
          : "var(--color-border-warm)",
        backgroundColor: isAdded ? "var(--color-brand-bg)" : "white",
      }}
    >
      {/* 제품 정보 행 */}
      <div className="flex gap-3">
        {/* 이미지 컨테이너 — PICK 배지 포함 */}
        <div className="relative shrink-0" style={{ width: 72, height: 72 }}>
          <div className="w-full h-full flex items-center justify-center rounded-xl bg-[#F5F2EC] overflow-hidden">
            {product.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.imageUrl}
                alt={product.name ?? "제품 이미지"}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[11px] font-bold text-text-muted">
                {product.category?.slice(0, 2) ?? "🧴"}
              </span>
            )}
          </div>
          {/* PICK 배지 — 추천 제품에만 표시 */}
          {isRecommended && (
            <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-[2px] rounded-[4px] bg-(--color-brand) text-white">
              PICK
            </span>
          )}
        </div>

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted mb-0.5">{product.brand}</p>
          <p className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">
            {product.name}
          </p>
          {/* 피부타입 칩 */}
          {product.skinTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {product.skinTypes.map((skinType) => (
                <span
                  key={skinType}
                  className="text-[11px] px-2 py-[2px] rounded-[4px] font-semibold bg-[#F0EDE8] text-[#7A7060]"
                >
                  {skinType}
                </span>
              ))}
            </div>
          )}
          {/* 태그 칩 */}
          {product.effects && product.effects.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1">
              {product.effects.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[11px] px-2 py-[2px] rounded-[4px] font-bold bg-[#F5F2EC] text-text-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 액션 버튼 행 */}
      <div className="flex items-center gap-2 mt-3">
        {/* 루틴추가 */}
        <button
          onClick={onAdd}
          disabled={isAdded}
          className="flex items-center justify-center gap-1 flex-1 h-9 rounded-[40px] border-none cursor-pointer transition-all text-sm font-bold"
          style={{
            backgroundColor: isAdded
              ? "var(--color-brand-bg)"
              : "var(--color-brand)",
            color: isAdded ? "var(--color-brand)" : "white",
          }}
        >
          + {isAdded ? "추가됨" : "루틴추가"}
        </button>
        {/* 찜 — ⚠️ API 연동 시 useLike 훅으로 연결 */}
        <button
          className="flex items-center justify-center cursor-pointer"
          style={MODAL_ACTION_ICON_BTN}
        >
          <Heart size={15} className="text-text-muted" />
        </button>
        {/* 비교 — ⚠️ API 연동 시 useCompare 훅으로 연결 */}
        <button
          className="flex items-center justify-center cursor-pointer"
          style={MODAL_ACTION_ICON_BTN}
        >
          <GitCompare size={15} className="text-text-muted" />
        </button>
      </div>
    </div>
  );
}
