"use client";

import { useState } from "react";
import { X, Search, ShieldAlert, ShoppingBag, Loader2, Package } from "lucide-react";
import ProductCard from "@/components/common/ProductCard";
import { CategoryFilter } from "@/components/common/CategoryFilter";
import { Pagination } from "@/components/common/Pagination";
import {
  useMyCosQuery,
  useAddMyCos,
  useRemoveMyCos,
  useDislikedProductsQuery,
  useAddDislikedProduct,
  useRemoveDislikedProduct,
  useProductSearch,
} from "@/hooks";
import { PAGE_SIZE } from "@/constants/pagination";

// "owned" — 보유 제품 추가 (myCos)
// "avoid" — 기피 제품 추가/제거 (disliked)
export type ProductSearchModalMode = "owned" | "avoid";

interface ProductSearchModalProps {
  mode: ProductSearchModalMode;
  onClose: () => void;
}

export default function ProductSearchModal({
  mode,
  onClose,
}: ProductSearchModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedBigCategoryId, setSelectedBigCategoryId] = useState<number | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(null);
  const [page, setPage] = useState(1);

  // 카테고리/검색어 변경 시 페이지 초기화
  const handleBigCategorySelect = (id: number | null) => {
    setSelectedBigCategoryId(id);
    setPage(1);
  };
  const handleCategorySelect = (id: number | null) => {
    setSelectedCategoryId(id);
    setPage(1);
  };
  // Enter 확정 시에만 API 쿼리 반영
  const handleSearchConfirm = () => {
    setSearchQuery(inputValue);
    setPage(1);
  };
  // X 버튼으로 지우기
  const handleSearchClear = () => {
    setInputValue("");
    setSearchQuery("");
    setPage(1);
  };

  // 제품 검색 API — 서버 페이지네이션
  const { products, totalCount, hasNext, isLoading } = useProductSearch({
    q: searchQuery.trim() || undefined,
    bigCategoryId: selectedBigCategoryId ?? undefined,
    categoryId: selectedCategoryId ?? undefined,
    page: page - 1, // API는 0-indexed
    size: PAGE_SIZE,
  });

  const totalPages =
    totalCount !== null
      ? Math.ceil(totalCount / PAGE_SIZE) || 1
      : hasNext
        ? page + 1
        : page;

  // ── Owned (myCos) 모드 ──────────────────────────────────────────
  const { data: myCosItems = [] } = useMyCosQuery();
  const { mutate: addMyCos } = useAddMyCos();
  const { mutate: removeMyCos } = useRemoveMyCos();

  const getOwnedEntry = (productId: number) =>
    myCosItems.find((item) => item.productInfo.productId === productId);

  // ── Avoid (disliked) 모드 ────────────────────────────────────────
  const { data: dislikedItems = [] } = useDislikedProductsQuery();
  const { mutate: addDisliked } = useAddDislikedProduct();
  const { mutate: removeDisliked } = useRemoveDislikedProduct();

  const getDislikedEntry = (productId: number) =>
    dislikedItems.find((item) => item.productId === productId);


  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-60 bg-black/50 backdrop-blur-xs"
        onClick={onClose}
      />
      {/* 바텀시트 — 높이를 충분히 확보해 카테고리+그리드+페이지네이션 표시 */}
      <div className="fixed inset-0 z-70 flex items-end justify-center pointer-events-none">
        <div className="bg-white pointer-events-auto rounded-t-modal w-full max-w-107.5 h-[92vh] flex flex-col shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">

          {/* ── 헤더 ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between px-5 pt-5 shrink-0">
            <h3 className="text-[16px] font-bold text-[#575655]">제품 추가</h3>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 cursor-pointer"
            >
              <X size={14} color="#888" />
            </button>
          </div>

          {/* ── 제품 그리드 + 페이지네이션 (스크롤 영역) ─────────── */}
          <div className="flex-1 overflow-y-auto">
            {/* 검색바 — 스크롤 영역 내에 포함하여 같이 스크롤됨 */}
            <div className="relative px-5 py-2">
              <Search
                size={14}
                className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none text-text-stone"
              />
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.nativeEvent.isComposing)
                    handleSearchConfirm();
                }}
                placeholder="제품명 또는 브랜드 검색"
                className="w-full h-10 pl-9 pr-9 rounded-xl border border-border-warm bg-[#FAF8F5] text-sm text-text-primary outline-none"
              />
              {inputValue && (
                <button
                  onClick={handleSearchClear}
                  className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-border-warm border-none cursor-pointer"
                >
                  <X size={14} color="#888" />
                </button>
              )}
            </div>
            {/* 카테고리 필터 — 스크롤 영역 내에 포함하여 같이 스크롤됨 */}
            <CategoryFilter
              selectedBigCategoryId={selectedBigCategoryId}
              selectedCategoryId={selectedCategoryId}
              onBigCategorySelect={handleBigCategorySelect}
              onCategorySelect={handleCategorySelect}
              bigCategoryFontSize="14px"
              pillFontSize="12px"
            />
            <div className="p-4">
              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-16 gap-2 text-text-muted">
                  <Loader2 size={24} className="animate-spin opacity-50" />
                  <span className="text-xs">불러오는 중...</span>
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-text-muted">
                  <Package size={32} className="mb-2 opacity-40" />
                  <p className="text-sm font-semibold">검색 결과가 없습니다</p>
                  <p className="text-xs mt-1">검색어나 카테고리를 바꿔보세요</p>
                </div>
              ) : (
                <div className="product-search-modal-grid grid grid-cols-2 gap-4 auto-rows-fr items-stretch">
                  {products.map((product) => {
                    const productId = product.id as number;

                    if (mode === "owned") {
                      const ownedEntry = getOwnedEntry(productId);
                      const alreadyOwned = !!ownedEntry;
                      return (
                        <div key={productId} className="relative flex flex-col h-full">
                          <ProductCard
                            id={productId}
                            brand={product.brand}
                            name={product.name}
                            imageUrl={product.imageUrl ?? undefined}
                            skinTypes={product.skinTypes}
                            effects={product.effects}
                            layout="grid"
                            showLike={false}
                            showActions={false}
                            isOwned={alreadyOwned}
                          />
                          {/* 추가/제거 토글 버튼 오버레이 */}
                          <button
                            onClick={() => {
                              if (alreadyOwned && ownedEntry) {
                                removeMyCos(ownedEntry.myCosId);
                              } else {
                                addMyCos(productId);
                              }
                            }}
                            className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full border-none cursor-pointer z-10 text-[22px] font-bold transition-colors shadow-sm ${
                              alreadyOwned
                                ? "bg-brand text-white"
                                : "bg-[#F2EFE9] text-[#A69D92]"
                            }`}
                          >
                            {alreadyOwned ? "−" : "+"}
                          </button>
                        </div>
                      );
                    }

                    // mode === "avoid"
                    const dislikedEntry = getDislikedEntry(productId);
                    const isDisliked = !!dislikedEntry;
                    return (
                      <div key={productId} className="relative flex flex-col h-full">
                        <ProductCard
                          id={productId}
                          brand={product.brand}
                          name={product.name}
                          imageUrl={product.imageUrl ?? undefined}
                          skinTypes={product.skinTypes}
                          effects={product.effects}
                          layout="grid"
                          showLike={false}
                          showActions={false}
                          isOwned={isDisliked}
                        />
                        {/* 추가/제거 토글 버튼 오버레이 */}
                        <button
                          onClick={() => {
                            if (isDisliked && dislikedEntry) {
                              removeDisliked(dislikedEntry.dislikedProductId);
                            } else {
                              addDisliked(productId);
                            }
                          }}
                          className={`absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full border-none cursor-pointer z-10 text-[18px] font-bold transition-colors shadow-sm ${
                            isDisliked
                              ? "bg-brand text-white"
                              : "bg-[#F2EFE9] text-[#A69D92]"
                          }`}
                        >
                          {isDisliked ? "−" : "+"}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 페이지네이션 */}
            <Pagination
              page={page}
              totalPages={totalPages}
              onChange={(page) => {
                setPage(page);
              }}
            />
          </div>

        </div>
      </div>
    </>
  );
}
