"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import ProductCard from "@/components/common/ProductCard";
import { MOCK_PRODUCTS } from "@/constants/_mock/products";

// TODO: API 연동 시 → @/constants/_mock/likesEffects.ts 로 이동 예정
const MOCK_EFFECTS: Record<string, string[]> = {
  "1": ["수분", "영양"],
  "2": ["여드름", "피지", "진정"],
  "3": ["수분", "안티에이징", "진정"],
  "4": ["수분", "진정"],
  "5": ["미백", "색소침착", "안티에이징"],
  "6": ["여드름", "피지"],
};

export default function LikesPage() {
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set(["1", "3", "5"]));
  const { toastMsg } = useToast();

  const toggleWishlist = (id: string) => {
    setWishlisted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const wishlistedProducts = MOCK_PRODUCTS.filter((p) => wishlisted.has(p.id));

  return (
    <div className="flex flex-col min-h-full bg-white pb-28">
      <Toast msg={toastMsg} />

      {/* 헤더 */}
      <div
        className="px-6 pt-5 pb-3"
        style={{ background: "linear-gradient(135deg, #FFF0F0 0%, #FFFFFF 100%)" }}
      >
        <div className="flex items-center gap-2">
          <Heart size={18} color="#E57373" fill="#E57373" />
          <h1 className="text-xl font-semibold text-text-primary m-0">찜 목록</h1>
        </div>
        <p className="text-xs text-text-hint mt-1">{wishlistedProducts.length}개의 제품을 찜했어요</p>
      </div>

      {/* 빈 상태 */}
      {wishlistedProducts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6 min-h-[300px]">
          <div className="flex items-center justify-center w-[72px] h-[72px] rounded-full bg-gradient-to-br from-[#FFF0F0] to-[#FFCDD2]">
            <Heart size={30} color="#E57373" />
          </div>
          <p className="text-[15px] font-medium text-text-primary mt-4">아직 찜한 제품이 없어요</p>
          <p className="text-xs text-text-hint mt-1.5 text-center leading-[1.5]">
            제품의 하트 버튼을 눌러<br />관심 제품을 저장해보세요
          </p>
        </div>
      ) : (
        <div className="px-6 grid grid-cols-2 gap-3 mt-1">
          {wishlistedProducts.map((product) => {
            const effects = MOCK_EFFECTS[product.id] ?? [];

            return (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                brand={product.brand}
                emoji={product.emoji}
                category={product.category}
                skinTypes={[product.skinType]}
                effects={effects}
                layout="vertical"
                liked={true}
                onLike={() => toggleWishlist(product.id)}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
