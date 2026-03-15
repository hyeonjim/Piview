"use client";

import { Heart } from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import ProductCard from "@/components/common/ProductCard";
import EmptyState from "@/components/common/EmptyState";
import { useLike } from "@/hooks/useLike";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/searchProducts";

// 초기 찜 목록 — ⚠️ API 연동 시 유저 찜 목록 API로 교체
const INITIAL_WISHED = ["s1", "s3", "s5"];

export default function LikesPage() {
  // useLike 훅으로 찜 상태 관리 — API 연동 시 훅 내부만 수정
  const { toggleLike, isLiked } = useLike(INITIAL_WISHED);
  const { toastMsg } = useToast();

  // ⚠️ API 연동 시 → likesService.getWishedProducts() 로 교체
  const wishlistedProducts = MOCK_SEARCH_PRODUCTS.filter((p) => isLiked(p.id));

  return (
    <div className="flex flex-col min-h-full bg-white pb-28">
      <Toast msg={toastMsg} />

      {/* 헤더 */}
      <div
        className="px-6 pt-5 pb-3"
        style={{
          background: "linear-gradient(135deg, #FFF0F0 0%, #FFFFFF 100%)",
        }}
      >
        <div className="flex items-center gap-2">
          <Heart size={18} color="#E57373" fill="#E57373" />
          <h1 className="text-xl font-semibold text-text-primary m-0">
            찜 목록
          </h1>
        </div>
        <p className="text-xs text-text-hint mt-1">
          {wishlistedProducts.length}개의 제품을 찜했어요
        </p>
      </div>

      {/* 빈 상태 */}
      {wishlistedProducts.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyState
            icon={Heart}
            title="아직 찜한 제품이 없어요"
            description={"제품의 하트 버튼을 눌러\n관심 제품을 저장해보세요"}
          />
        </div>
      ) : (
        <div className="px-6 grid grid-cols-2 gap-3 mt-1">
          {wishlistedProducts.map((product) => (
            <ProductCard
              key={product.id}
              id={product.id}
              name={product.name}
              brand={product.brand}
              emoji={product.emoji}
              category={product.category}
              skinTypes={product.skinTypes}
              effects={product.effects}
              liked={isLiked(product.id)}
              onLike={() => toggleLike(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
