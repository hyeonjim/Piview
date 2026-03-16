"use client";

import { Heart } from "lucide-react";
import { useLike } from "@/hooks/useLike";
import ProductCard from "@/components/common/ProductCard";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/searchProducts";

export default function LikesPage() {
  const { likeList: likedIds, toggleLike, isLiked } = useLike();

  // ⚠️ API 연동 시 서버 fetch로 교체
  const likedProducts = MOCK_SEARCH_PRODUCTS.filter((p) => likedIds.has(p.id));

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#FAFAF8" }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #EDEBE8", paddingTop: "56px", padding: "56px 20px 16px" }}>
        <p style={{ margin: 0, fontSize: "10px", color: "#B0A99F", letterSpacing: "0.14em", textTransform: "uppercase", fontFamily: "var(--font-cormorant), serif", fontStyle: "italic" }}>
          My Favorites
        </p>
        <h1 style={{ margin: "3px 0 0", fontSize: "22px", fontWeight: 700, color: "#1C1C1E", letterSpacing: "-0.4px", fontFamily: "var(--font-pretendard), sans-serif" }}>
          찜한 제품
        </h1>
        {likedProducts.length > 0 && (
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#B0A99F", fontFamily: "var(--font-pretendard), sans-serif" }}>
            {likedProducts.length}개 저장됨
          </p>
        )}
      </div>

      <div style={{ padding: "16px 14px 24px" }}>
        {likedProducts.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center"
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: "12px",
              border: "1px solid #EDEBE8",
              padding: "48px 20px",
              marginTop: "8px",
            }}
          >
            <Heart size={32} style={{ color: "#E8E4DF", marginBottom: "12px" }} />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#A8A39D", fontFamily: "var(--font-pretendard), sans-serif" }}>
              찜한 제품이 없어요
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#C4BEB7", textAlign: "center", fontFamily: "var(--font-pretendard), sans-serif" }}>
              마음에 드는 제품을 찜해보세요
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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
                liked={isLiked(product.id)}
                onLike={() => toggleLike(product.id)}
                layout="grid"
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── 스타일 상수 ──────────────────────────────────────────────────────
const HEADER_BG =
  "linear-gradient(135deg, var(--color-bg-like) 0%, #FFFFFF 100%)";
