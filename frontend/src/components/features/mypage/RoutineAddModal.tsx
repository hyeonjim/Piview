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
import { X, Search, Package, Heart, GitCompare, Loader2 } from "lucide-react";
import {
  SKIN_TYPE_TAG_COLORS,
  CATEGORY_COLORS,
} from "@/constants/categoryColors";
import { getRoutineSteps } from "@/constants/routineSteps";
import { useProductSearch, useProductFilters } from "@/hooks";
import { useUserStore, selectGender } from "@/stores";
import { getCategoryDisplayName } from "@/utils/format";
import type { MappedProduct } from "@/utils/productMapper";

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
  onClose,
  onAdd,
}: RoutineAddModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 7;


  // 성별에 따른 루틴 스텝 가져오기
  const currentGender = useUserStore(selectGender);
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

  // 검색어·카테고리 변경 시 첫 페이지로 초기화
  const totalPages = Math.ceil(products.length / PAGE_SIZE);
  const pagedProducts = products.slice(
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
            {/* 헤더 */}
            <div className="flex items-center justify-between mt-[15px]">
              <h3 className="text-base font-bold text-text-primary">
                {currentLabel} 선택
              </h3>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-bg-muted-warm)] border-none cursor-pointer"
              >
                <X size={14} color="#888" />
              </button>
            </div>

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
                  const catColor = CATEGORY_COLORS[cat.categoryName];
                  return (
                    <button
                      key={cat.categoryId}
                      onClick={() => {
                        if (!isActive) handleCategoryChange(cat.categoryId);
                      }}
                      className="category-pill-button"
                      data-active={isActive}
                      data-has-color={!!catColor}
                      style={
                        !isActive && catColor
                          ? ({
                              "--pill-bg": catColor.chip,
                              "--pill-color": catColor.accent,
                              "--pill-border": catColor.border,
                            } as React.CSSProperties)
                          : undefined
                      }
                    >
                      {getCategoryDisplayName(cat.categoryName)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 로딩 상태 */}
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
                <Loader2 size={24} className="animate-spin opacity-50" />
                <p className="text-xs">제품을 불러오는 중...</p>
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-stone)]">
                <Package size={32} className="mb-2 opacity-50" />
                <p className="text-xs">검색 결과가 없습니다</p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  {pagedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      isAdded={draftProductIds.includes(product.id)}
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
  onAdd: () => void;
}

function ProductCard({ product, isAdded, onAdd }: ProductCardProps) {
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
        {/* 이미지 */}
        <div
          className="shrink-0 flex items-center justify-center rounded-xl bg-[#F5F2EC] overflow-hidden"
          style={{ width: 72, height: 72 }}
        >
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

        {/* 텍스트 */}
        <div className="flex-1 min-w-0">
          <p className="text-xs text-text-muted mb-0.5">{product.brand}</p>
          <p className="text-sm font-semibold text-text-primary leading-snug line-clamp-2">
            {product.name}
          </p>
          {/* 피부타입 칩 */}
          {product.skinTypes.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {product.skinTypes.map((skinType) => {
                const colorScheme = SKIN_TYPE_TAG_COLORS[skinType];
                return colorScheme ? (
                  <span
                    key={skinType}
                    className="text-[11px] px-2 py-[2px] rounded-[4px] font-semibold"
                    style={{
                      backgroundColor: colorScheme.bg,
                      color: colorScheme.text,
                    }}
                  >
                    {skinType}
                  </span>
                ) : null;
              })}
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
