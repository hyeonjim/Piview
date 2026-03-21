"use client";

import { useState } from "react";
import { Heart } from "lucide-react";

import { useMyCosQuery, useAddMyCos, useRemoveMyCos } from "@/hooks";
import { useRoutineStore } from "@/stores";
import { useLike, useLikedProducts, useCompare } from "@/hooks";
import ProductCard from "@/components/common/ProductCard";
import CompareModal, {
  type CompareProduct,
} from "@/components/common/CompareModal";
import { Pagination } from "@/components/common/Pagination";
import { ROUTINE_STEPS } from "@/constants/routineSteps";
import { PAGE_SIZE } from "@/constants/pagination";

export default function LikesPage() {
  const [page, setPage] = useState(1);
  const { data: likedProducts = [], isLoading } = useLikedProducts();

  // 페이지네이션 — 프론트에서 slice
  const totalPages = Math.ceil(likedProducts.length / PAGE_SIZE) || 1;
  const pagedProducts = likedProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const routineMap = useRoutineStore((state) => state.localRoutine);
  const addStepProduct = useRoutineStore((state) => state.addStepProduct);
  const isInRoutine = (productId: string) =>
    Object.values(routineMap)
      .flat()
      .filter(Boolean)
      .some((p) => p.id === productId);

  // 보유 상태 — API 연동
  const { data: myCosData = [] } = useMyCosQuery();
  const { mutate: addMyCos } = useAddMyCos();
  const { mutate: removeMyCos } = useRemoveMyCos();
  const isOwned = (id: string) =>
    myCosData.some((item) => String(item.productId ?? item.id) === id);
  const handleToggleOwned = (productId: string) => {
    const owned = myCosData.find(
      (item) => String(item.productId ?? item.id) === productId,
    );
    if (owned) removeMyCos(owned.id);
    else addMyCos(Number(productId));
  };

  const {
    compareItems,
    showCompare,
    toggleCompare,
    openCompare,
    closeCompare,
    canCompare,
  } = useCompare<CompareProduct>();

  const handleAddRoutine = (productId: string) => {
    if (isInRoutine(productId)) return;
    const product = likedProducts.find(
      (p) => String(p.productId) === productId,
    );
    if (!product) return;
    const matchedStep = ROUTINE_STEPS.find((step) =>
      step.categories.includes(product.categoryName ?? ""),
    );
    addStepProduct(matchedStep?.code ?? "PR", {
      id: productId,
      brand: product.brandName ?? "",
      name: product.name ?? "",
      category: product.categoryName ?? "",
      emoji: "🧴",
      skinTypes: product.skinTypes,
      effects: product.tags ?? [],
      matchScore: 0,
      price: undefined,
      ewgSafe: 0,
      ewgCaution: 0,
      ewgDanger: 0,
    });
  };

  const handleToggleCompare = (product: CompareProduct) => {
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
          compareItems={compareItems as [CompareProduct, CompareProduct]}
          onClose={closeCompare}
        />
      )}

      {/* 헤더 */}
      <div className="bg-[var(--color-bg-base)] px-5 pt-[15px] pb-4">
        <h1 className="mt-[3px] text-[22px] font-bold text-[var(--color-text-primary)] tracking-[-0.4px]">
          찜한 제품
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
            <p className="text-[14px] text-[var(--color-text-muted)]">불러오는 중...</p>
          </div>
        ) : likedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] px-5 py-12 mt-2">
            <Heart size={32} className="text-[var(--color-text-disabled)] mb-3" />
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
              const productId = String(product.productId);
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
                  inRoutine={isInRoutine(productId)}
                  onAddRoutine={() => handleAddRoutine(productId)}
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
