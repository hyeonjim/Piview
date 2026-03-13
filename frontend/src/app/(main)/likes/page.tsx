"use client";

import { useState } from "react";
import { Heart, Star, Trash2 } from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import Link from "next/link";
import { MOCK_PRODUCTS } from "@/constants/_mock/products";
import { CATEGORY_COLORS, SKIN_TYPE_TAG_COLORS, SKIN_FUNCTION_COLORS } from "@/constants/categoryColors";

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
        <div className="px-6 flex flex-col gap-2.5 mt-1">
          {wishlistedProducts.map((product) => {
            const catColor      = CATEGORY_COLORS[product.category];
            const skinTypeColor = SKIN_TYPE_TAG_COLORS[product.skinType] ?? { bg: "#F0EDE8", text: "#7A7060" };
            const effects       = MOCK_EFFECTS[product.id] ?? [];

            return (
              <div
                key={product.id}
                className="p-3.5 rounded-[14px] border-[1.5px] transition-all duration-200 hover:shadow-sm"
                style={{
                  backgroundColor: catColor ? catColor.bg : "#FAFAFA",
                  borderColor: catColor ? catColor.border : "#F0F0F0",
                }}
              >
                <Link href={`/product/${product.id}`} className="flex items-start gap-3 no-underline">
                  {/* 제품 이미지 */}
                  <div
                    className="shrink-0 flex items-center justify-center w-[100px] h-[100px] rounded-[14px] bg-white text-[40px] shadow-[0_2px_8px_rgba(0,0,0,0.08)] border"
                    style={{ borderColor: catColor ? catColor.border : "#F0F0F0" }}
                  >
                    {product.emoji}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p className="text-xs text-text-muted font-medium m-0">{product.brand}</p>
                      {catColor && (
                        <span
                          className="text-xs px-1.5 py-[2px] rounded-[6px] font-medium"
                          style={{ backgroundColor: catColor.chip, color: catColor.accent }}
                        >
                          {product.category}
                        </span>
                      )}
                    </div>

                    <p className="truncate text-xs font-semibold text-text-primary mt-px m-0">
                      {product.name}
                    </p>

                    {/* 피부타입 태그 */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span
                        className="text-xs px-1 py-[1px] rounded-[3px] font-semibold tracking-[0.2px] leading-[1.4] whitespace-nowrap"
                        style={{ backgroundColor: skinTypeColor.bg, color: skinTypeColor.text }}
                      >
                        {product.skinType}
                      </span>
                    </div>

                    {/* 기능 태그 */}
                    {effects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {effects.slice(0, 4).map((fn) => {
                          const fnColor = SKIN_FUNCTION_COLORS[fn];
                          return (
                            <span
                              key={fn}
                              className="text-xs px-1 py-[1px] rounded-[3px] font-medium"
                              style={{
                                backgroundColor: fnColor?.chip ?? "#F8F6F0",
                                color: fnColor?.accent ?? "#8A7B64",
                              }}
                            >
                              {fn}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* 평점 */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={10} color="#F5A623" fill="#F5A623" />
                      <span className="text-xs font-semibold text-text-primary">{product.rating}</span>
                      <span className="text-xs text-text-muted">({product.reviews.toLocaleString()})</span>
                      <span className="text-xs font-semibold text-[#4A6B52] ml-1">{product.price}원</span>
                    </div>
                  </div>
                </Link>

                {/* 찜 해제 버튼 */}
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="flex items-center justify-center gap-1 h-[30px] px-3 rounded-lg border-none cursor-pointer transition-all duration-200 active:scale-[0.97] text-xs font-medium bg-[#FFCDD2] text-[#E57373]"
                  >
                    <Trash2 size={12} /> 찜 해제
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
