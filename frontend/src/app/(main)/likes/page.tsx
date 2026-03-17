"use client";

import { Heart } from "lucide-react";
import { useLike } from "@/hooks/useLike";
import { useCompare } from "@/hooks/useCompare";
import { useOwnedStore } from "@/stores/useOwnedStore";
import { useLocalRoutineStore } from "@/stores/useLocalRoutineStore";
import { useToast } from "@/hooks";
import ProductCard from "@/components/common/ProductCard";
import CompareModal, {
  type CompareProduct,
} from "@/components/common/CompareModal";
import { Toast } from "@/components/common/Toast";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/searchProducts";
import { ROUTINE_STEPS } from "@/constants/routineSteps";

export default function LikesPage() {
  const { likeList: likedIds } = useLike();
  // ⚠️ API 연동 시 서버 fetch로 교체
  const likedProducts = MOCK_SEARCH_PRODUCTS.filter((p) => likedIds[p.id]);

  // 루틴 상태 — 전역 store (상세 페이지와 동기화)
  const routineMap = useLocalRoutineStore((state) => state.routine);
  const addStepProduct = useLocalRoutineStore((state) => state.addStepProduct);
  const isInRoutine = (productId: string) =>
    Object.values(routineMap)
      .flat()
      .filter(Boolean)
      .some((p) => p.id === productId);

  // 보유 상태 — 전역 store로 검색/추천 페이지와 공유
  const { toggleOwned, ownedProducts } = useOwnedStore();
  const isOwned = (id: string) => ownedProducts.some((p) => p.id === id);

  const { toastMessage } = useToast();

  const {
    compareItems,
    showCompare,
    toggleCompare,
    clearCompare,
    openCompare,
    closeCompare,
    canCompare,
  } = useCompare<CompareProduct>();

  const handleAddRoutine = (productId: string) => {
    if (isInRoutine(productId)) return;
    const product = likedProducts.find((p) => p.id === productId);
    if (!product) return;
    const matchedStep = ROUTINE_STEPS.find((step) =>
      step.categories.includes(product.category),
    );
    addStepProduct(matchedStep?.code ?? "PR", {
      id: product.id,
      brand: product.brand,
      name: product.name,
      category: product.category,
      emoji: product.emoji,
      skinTypes: product.skinTypes,
      effects: product.effects,
      matchScore: product.matchScore,
      price: product.price,
      ewgSafe: product.ewgSafe,
      ewgCaution: product.ewgCaution,
      ewgDanger: product.ewgDanger,
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
      <Toast msg={toastMessage} />

      {showCompare && canCompare && (
        <CompareModal
          compareItems={compareItems as [CompareProduct, CompareProduct]}
          onClose={closeCompare}
        />
      )}

      {/* 헤더 */}
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
        {likedProducts.length === 0 ? (
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
            }}
          >
            {likedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                brand={product.brand}
                name={product.name}
                category={product.category}
                emoji={product.emoji}
                skinTypes={product.skinTypes}
                effects={product.effects}
                layout="grid"
                showActions={true}
                inRoutine={isInRoutine(product.id)}
                onAddRoutine={() => handleAddRoutine(product.id)}
                isOwned={isOwned(product.id)}
                onToggleOwned={() => toggleOwned(product)}
                isInCompare={compareItems.some(
                  (item) => item.id === product.id,
                )}
                onToggleCompare={() =>
                  handleToggleCompare({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    emoji: product.emoji,
                    price: product.price,
                    skinTypes: product.skinTypes,
                    effects: product.effects,
                    ewgSafe: product.ewgSafe,
                    ewgCaution: product.ewgCaution,
                    ewgDanger: product.ewgDanger,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
