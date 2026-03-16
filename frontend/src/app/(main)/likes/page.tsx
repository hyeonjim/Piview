"use client";

import { Heart } from "lucide-react";
import { useLike } from "@/hooks/useLike";
import ProductCard from "@/components/common/ProductCard";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/searchProducts";

export default function LikesPage() {
  // likeList만 사용 — ProductCard 내부에서 useLikeStore로 찜 상태를 직접 관리함
  const { likeList: likedIds } = useLike();

  // ⚠️ API 연동 시 서버 fetch로 교체
  const likedProducts = MOCK_SEARCH_PRODUCTS.filter((p) => likedIds.has(p.id));

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#F5F2EC" }}>
      {/* 헤더 */}
      <div style={{ backgroundColor: "#F5F2EC", padding: "15px 20px 16px" }}>
        <h1 style={{ margin: "3px 0 0", fontSize: "22px", fontWeight: 700, color: "#2A2118", letterSpacing: "-0.4px", fontFamily: "var(--font-pretendard), sans-serif" }}>
          찜한 제품
        </h1>
        {likedProducts.length > 0 && (
          <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#BFB6AA", fontFamily: "var(--font-pretendard), sans-serif" }}>
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
            <Heart size={32} style={{ color: "#D9D5D0", marginBottom: "12px" }} />
            <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#A69D92", fontFamily: "var(--font-pretendard), sans-serif" }}>
              찜한 제품이 없어요
            </p>
            <p style={{ margin: "6px 0 0", fontSize: "12px", color: "#BFB6AA", textAlign: "center", fontFamily: "var(--font-pretendard), sans-serif" }}>
              마음에 드는 제품을 찜해보세요
            </p>
          </div>
        ) : (
          /* 카드 간격 14px */
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
