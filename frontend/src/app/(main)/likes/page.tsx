"use client";

import { Heart } from "lucide-react";

import { useMyCosQuery, useAddMyCos, useRemoveMyCos } from "@/hooks";
import { useLike, useLikedProducts, useCompare } from "@/hooks";
import { useLikeStore } from "@/stores";
import ProductCard from "@/components/common/ProductCard";
import CompareModal from "@/components/common/CompareModal";
import type { ProductViewModel } from "@/types/product/myCos";
import { Pagination } from "@/components/common/Pagination";
import { PAGE_SIZE } from "@/constants/pagination";

export default function LikesPage() {
  const { page, setPage } = useLikeStore();
  const { data: likedProducts = [], isLoading } = useLikedProducts();

  // 페이지네이션 — 프론트에서 slice
  const totalPages = Math.ceil(likedProducts.length / PAGE_SIZE) || 1;
  const pagedProducts = likedProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // 보유 상태 — API 연동
  const { data: myCosData = [] } = useMyCosQuery();
  const { mutate: addMyCos } = useAddMyCos();
  const { mutate: removeMyCos } = useRemoveMyCos();

  const isOwned = (productId: number) =>
    myCosData.some((item) => (item.productId ?? item.id) === productId);

  const handleToggleOwned = (productId: number) => {
    const owned = myCosData.find(
      (item) => (item.productId ?? item.id) === productId,
    );
    if (owned) removeMyCos(owned.id);
    else addMyCos(productId);
  };

  // 비교 모달
  const {
    compareItems,
    showCompare,
    toggleCompare,
    openCompare,
    closeCompare,
    canCompare,
  } = useCompare<ProductViewModel>();

  // 비교 토글 핸들러 — 2개 선택 시 모달 자동 오픈
  const handleToggleCompare = (product: ProductViewModel) => {
    const isAlreadySelected = compareItems.some(
      (item) => item.id === product.id,
    );
    toggleCompare(product);
    if (!isAlreadySelected && compareItems.length === 1) openCompare();
  };

  return (
    <div className="flex-1 bg-[var(--color-bg-base)]">
      {showCompare && canCompare && (
        <CompareModal
          compareItems={compareItems as [ProductViewModel, ProductViewModel]}
          onClose={closeCompare}
        />
      )}

      {/* 헤더 */}
      <div className="bg-[var(--color-bg-base)] px-5 pt-[15px] pb-4">
        <h1 className="mt-[3px] text-[22px] font-bold text-[var(--color-text-primary)] tracking-[-0.4px]">
          Liked
        </h1>
        {likedProducts.length > 0 && (
          <p className="mt-0.5 text-[12px] text-[var(--color-text-faint)]">
            {likedProducts.length}개 저장됨
          </p>
        )}
      </div>

      <div className="px-4 pb-6 pt-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-12 px-5">
            <p className="text-[14px] text-[var(--color-text-muted)]">
              불러오는 중...
            </p>
          </div>
        ) : likedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] px-5 py-12 mt-2">
            <Heart
              size={32}
              className="text-[var(--color-text-disabled)] mb-3"
            />
            <p className="m-0 text-[14px] font-semibold text-[var(--color-text-muted)]">
              찜한 제품이 없어요
            </p>
            <p className="mt-1.5 mb-0 text-[12px] text-[var(--color-text-faint)] text-center">
              마음에 드는 제품을 찜해보세요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-6 items-start">
            {pagedProducts.map((product) => {
              const productId = product.productId;
              return (
                <ProductCard
                  key={productId}
                  id={productId}
                  brand={product.brandName ?? ""}
                  name={product.name ?? ""}
                  category={product.categoryName ?? ""}
                  imageUrl={product.imageUrl ?? undefined}
                  skinTypes={product.skinTypes}
                  effects={product.tags ?? []}
                  layout="grid"
                  showActions={true}
                  isOwned={isOwned(productId)}
                  onToggleOwned={() => handleToggleOwned(productId)}
                  isInCompare={compareItems.some(
                    (item) => item.id === productId,
                  )}
                  onToggleCompare={() =>
                    handleToggleCompare({
                      id: productId,
                      name: product.name ?? "",
                      brand: product.brandName ?? "",
                      imageUrl: product.imageUrl,
                      emoji: "🧴",
                      skinTypes: product.skinTypes,
                      effects: product.tags ?? [],
                      ewgSafe: 0,
                      ewgCaution: 0,
                      ewgDanger: 0,
                    })
                  }
                />
              );
            })}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onChange={(p) => {
            setPage(p);
            window.scrollTo(0, 0);
          }}
        />
      )}
    </div>
  );
}
