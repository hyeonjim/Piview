"use client";

import { useState } from "react";
import { Heart, Star, Trash2 } from "lucide-react";
import Link from "next/link";
import { MOCK_PRODUCTS } from "@/constants/_mock/products";
import { CATEGORY_COLORS, SKIN_TYPE_TAG_COLORS, SKIN_FUNCTION_COLORS } from "@/constants/categoryColors";

// 피그마 WishlistPage: loveBg / loveLight / love 색상
const LOVE       = "#E57373";
const LOVE_BG    = "#FFF0F0";
const LOVE_LIGHT = "#FFEAEA";

// 더미 기능 태그 (백엔드 연동 전 mock)
const MOCK_EFFECTS: Record<string, string[]> = {
  "1": ["수분", "영양"],
  "2": ["여드름", "피지", "진정"],
  "3": ["수분", "안티에이징", "진정"],
  "4": ["수분", "진정"],
  "5": ["미백", "색소침착", "안티에이징"],
  "6": ["여드름", "피지"],
};

export default function LikesPage() {
  // TODO: 백엔드 연동 시 → 사용자 찜 목록 API로 교체
  const [wishlisted, setWishlisted] = useState<Set<string>>(
    new Set(["1", "3", "5"])
  );

  const toggleWishlist = (id: string) => {
    setWishlisted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const wishlistedProducts = MOCK_PRODUCTS.filter((p) => wishlisted.has(p.id));

  return (
    <div className="flex flex-col min-h-full bg-white pb-28" style={{ scrollbarWidth: "none" }}>

      {/* 헤더 — 피그마: linear-gradient(135deg, loveBg, white) */}
      <div
        className="px-6 pt-5 pb-3"
        style={{ background: `linear-gradient(135deg, ${LOVE_BG} 0%, #FFFFFF 100%)` }}
      >
        <div className="flex items-center gap-2">
          <Heart size={18} color={LOVE} fill={LOVE} />
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "#1A1A1A", margin: 0 }}>
            찜 목록
          </h1>
        </div>
        <p style={{ fontSize: "12px", color: "#757575", marginTop: "4px" }}>
          {wishlistedProducts.length}개의 제품을 찜했어요
        </p>
      </div>

      {/* 빈 상태 */}
      {wishlistedProducts.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center px-6" style={{ minHeight: "300px" }}>
          <div
            className="flex items-center justify-center"
            style={{ width: "72px", height: "72px", borderRadius: "50%", background: `linear-gradient(135deg, ${LOVE_BG}, ${LOVE_LIGHT})` }}
          >
            <Heart size={30} color={LOVE} />
          </div>
          <p style={{ fontSize: "15px", fontWeight: 500, color: "#1A1A1A", marginTop: "16px" }}>
            아직 찜한 제품이 없어요
          </p>
          <p style={{ fontSize: "13px", color: "#757575", marginTop: "6px", textAlign: "center", lineHeight: 1.5 }}>
            제품의 하트 버튼을 눌러<br />관심 제품을 저장해보세요
          </p>
        </div>
      ) : (
        <div className="px-6 flex flex-col gap-2.5 mt-1">
          {wishlistedProducts.map((product) => {
            const catColor = CATEGORY_COLORS[product.category];
            const skinTypeColor = SKIN_TYPE_TAG_COLORS[product.skinType] ?? { bg: "#F0EDE8", text: "#7A7060" };
            const effects = MOCK_EFFECTS[product.id] ?? [];

            return (
              <div
                key={product.id}
                className="p-3.5 transition-all duration-200 hover:shadow-sm"
                style={{
                  borderRadius: "14px",
                  backgroundColor: catColor ? catColor.bg : "#FAFAFA",
                  border: `1.5px solid ${catColor ? catColor.border : "#F0F0F0"}`,
                }}
              >
                {/* 카드 본문 */}
                <Link href={`/product/${product.id}`} className="flex items-start gap-3 no-underline">
                  {/* 제품 이미지 */}
                  <div
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      width: "100px", height: "100px", borderRadius: "14px",
                      backgroundColor: "white", fontSize: "40px",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      border: `1px solid ${catColor ? catColor.border : "#F0F0F0"}`,
                    }}
                  >
                    {product.emoji}
                  </div>

                  {/* 정보 */}
                  <div className="flex-1 min-w-0">
                    {/* 브랜드 + 카테고리 뱃지 */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <p style={{ fontSize: "10px", color: "#9E9E9E", fontWeight: 500, margin: 0 }}>
                        {product.brand}
                      </p>
                      {catColor && (
                        <span style={{
                          fontSize: "10px", padding: "2px 6px", borderRadius: "6px",
                          backgroundColor: catColor.chip, color: catColor.accent, fontWeight: 500,
                        }}>
                          {product.category}
                        </span>
                      )}
                    </div>

                    {/* 제품명 */}
                    <p className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A", margin: "1px 0 0" }}>
                      {product.name}
                    </p>

                    {/* 피부타입 태그 */}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <span style={{
                        fontSize: "9px", padding: "1px 4px", borderRadius: "3px",
                        backgroundColor: skinTypeColor.bg, color: skinTypeColor.text,
                        fontWeight: 600, letterSpacing: "0.2px", lineHeight: 1.4, whiteSpace: "nowrap",
                      }}>
                        {product.skinType}
                      </span>
                    </div>

                    {/* 기능 태그 */}
                    {effects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {effects.slice(0, 4).map((fn) => {
                          const fnColor = SKIN_FUNCTION_COLORS[fn];
                          return (
                            <span key={fn} style={{
                              fontSize: "9px", padding: "1px 4px", borderRadius: "3px",
                              backgroundColor: fnColor?.chip ?? "#F8F6F0",
                              color: fnColor?.accent ?? "#8A7B64",
                              fontWeight: 500,
                            }}>
                              {fn}
                            </span>
                          );
                        })}
                      </div>
                    )}

                    {/* 평점 */}
                    <div className="flex items-center gap-1 mt-1.5">
                      <Star size={10} color="#F5A623" fill="#F5A623" />
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#1A1A1A" }}>
                        {product.rating}
                      </span>
                      <span style={{ fontSize: "10px", color: "#9E9E9E" }}>
                        ({product.reviews.toLocaleString()})
                      </span>
                      <span style={{ fontSize: "11px", fontWeight: 600, color: "#4A6B52", marginLeft: "4px" }}>
                        {product.price}원
                      </span>
                    </div>
                  </div>
                </Link>

                {/* 찜 해제 버튼 */}
                <div className="flex gap-2 mt-2.5">
                  <button
                    onClick={() => toggleWishlist(product.id)}
                    className="flex items-center justify-center gap-1 transition-all duration-200 active:scale-[0.97] cursor-pointer"
                    style={{
                      height: "30px", padding: "0 12px", borderRadius: "8px", border: "none",
                      backgroundColor: LOVE_LIGHT, color: LOVE,
                      fontSize: "11px", fontWeight: 500,
                    }}
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
