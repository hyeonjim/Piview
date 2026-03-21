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
    <div className="flex-1" style={{ backgroundColor: "#F5F2EC" }}>
      {showCompare && canCompare && (
        <CompareModal
          compareItems={compareItems as [CompareProduct, CompareProduct]}
          onClose={closeCompare}
        />
      )}

      <div style={{ backgroundColor: "#F5F2EC", padding: "15px 20px 16px" }}>
        <h1
          style={{
            margin: "3px 0 0",
            fontSize: "22px",
            fontWeight: 700,
            color: "#2A2118",
            letterSpacing: "-0.4px",
          }}
        >
          찜한 제품
        </h1>
        {likedProducts.length > 0 && (
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#BFB6AA" }}>
            {likedProducts.length}개 저장됨
          </p>
        )}
      </div>

      <div style={{ padding: "16px 16px 24px" }}>
        {isLoading ? (
          <div
            className="flex items-center justify-center"
            style={{ padding: "48px 20px" }}
          >
            <p style={{ fontSize: "14px", color: "#A69D92" }}>불러오는 중...</p>
          </div>
        ) : likedProducts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #E2DDD8",
              padding: "48px 20px",
              marginTop: "8px",
            }}
          >
            <Heart
              size={32}
              style={{ color: "#D9D5D0", marginBottom: "12px" }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "14px",
                fontWeight: 600,
                color: "#A69D92",
              }}
            >
              찜한 제품이 없어요
            </p>
            <p
              style={{
                margin: "6px 0 0",
                fontSize: "12px",
                color: "#BFB6AA",
                textAlign: "center",
              }}
            >
              마음에 드는 제품을 찜해보세요
            </p>
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "24px",
              alignItems: "start",
            }}
          >
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
