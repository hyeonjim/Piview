/**
 * components/features/search/ProductListItem.tsx
 *
 * 검색/추천 페이지의 제품 행 카드.
 * 기존 ProductCard (common) 는 세로형/가로형 레이아웃용이고,
 * 이 컴포넌트는 태그·액션버튼이 포함된 상세 리스트 카드.
 */

"use client";

import { Plus, Package, GitCompareArrows, Heart } from "lucide-react";
import Link from "next/link";
import { CATEGORY_COLORS, SKIN_FUNCTION_COLORS, SKIN_TYPE_TAG_COLORS } from "@/constants/categoryColors";
import { formatPrice } from "@/utils/format";

export interface ProductListItemData {
  id: string | number;
  brand: string;
  name: string;
  category: string;
  skinType1?: string;
  skinType2?: string;
  concerns: Record<string, boolean>;
  price: number;
  volume: string;
  rating: number;
  reviews: number;
  emoji: string;
  imageUrl?: string;
  matchScore: number;
}

interface Props {
  product: ProductListItemData;
  isWished: boolean;
  isInRoutine?: boolean;
  inCompare?: boolean;
  onAddToRoutine?: () => void;
  onToggleWishlist?: () => void;
  onToggleCompare?: () => void;
}

export function ProductListItem({
  product: p,
  isWished,
  isInRoutine = false,
  inCompare = false,
  onAddToRoutine,
  onToggleWishlist,
  onToggleCompare,
}: Props) {
  const catColor = CATEGORY_COLORS[p.category];
  const activeConcerns = Object.entries(p.concerns).filter(([, v]) => v).map(([k]) => k);

  return (
    <div
      className="p-3.5 transition-all duration-200"
      style={{
        borderRadius: "14px",
        backgroundColor: catColor ? catColor.bg : "#FAFAFA",
        border: `1.5px solid ${catColor ? catColor.border : "#F0F0F0"}`,
      }}
    >
      <Link href={`/product/${p.id}`} className="flex items-start gap-3" style={{ textDecoration: "none" }}>
        {/* 이미지 */}
        <div
          className="shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            width: "80px", height: "80px", borderRadius: "12px",
            backgroundColor: "white", fontSize: "32px",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: `1px solid ${catColor ? catColor.border : "#F0F0F0"}`,
          }}
        >
          {p.imageUrl ? (
            <img src={p.imageUrl} alt={p.name} style={{ width: "80px", height: "80px", objectFit: "cover" }} />
          ) : (
            p.emoji
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span style={{ fontSize: "10px", color: "#9E9E9E", fontWeight: 500 }}>{p.brand}</span>
            {catColor && (
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px",
                backgroundColor: catColor.chip, color: catColor.accent, fontWeight: 500 }}>
                {p.category}
              </span>
            )}
            {isInRoutine && (
              <span style={{ fontSize: "10px", padding: "2px 6px", borderRadius: "6px",
                backgroundColor: "#F0F2E8", color: "var(--color-brand)", fontWeight: 600 }}>
                루틴중
              </span>
            )}
          </div>

          <p className="truncate" style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A" }}>{p.name}</p>

          {/* 태그 */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {[p.skinType1, p.skinType2].filter(Boolean).map((st) => {
              const c = SKIN_TYPE_TAG_COLORS[st!] ?? { bg: "#F0EDE8", text: "#7A7060" };
              return (
                <span key={st} style={{ fontSize: "9px", padding: "1px 4px", borderRadius: "3px",
                  backgroundColor: c.bg, color: c.text, fontWeight: 600 }}>
                  {st}
                </span>
              );
            })}
            {activeConcerns.slice(0, 3).map((fn) => {
              const fc = SKIN_FUNCTION_COLORS[fn];
              return (
                <span key={fn} style={{ fontSize: "9px", padding: "1px 4px", borderRadius: "3px",
                  backgroundColor: fc?.chip ?? "#F8F6F0", color: fc?.accent ?? "#8A7B64", fontWeight: 500 }}>
                  {fn}
                </span>
              );
            })}
          </div>

          {/* 가격 / 평점 */}
          <div className="flex items-center gap-2 mt-2">
            <span style={{ fontSize: "12px", fontWeight: 700, color: "#1A1A1A" }}>{formatPrice(p.price)}</span>
            <span style={{ fontSize: "11px", color: "#9E9E9E" }}>
              ⭐ {p.rating} ({p.reviews.toLocaleString()})
            </span>
          </div>
        </div>
      </Link>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={onAddToRoutine}
          className="flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          style={{ height: "30px", padding: "0 12px", borderRadius: "8px", border: "none",
            backgroundColor: isInRoutine ? "#E8F0E0" : "#F0F2E8",
            color: "var(--color-brand)", fontSize: "11px", fontWeight: 500 }}
        >
          <Plus size={12} /> {isInRoutine ? "루틴중" : "루틴추가"}
        </button>
        <button
          onClick={onToggleWishlist}
          className="flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          style={{ height: "30px", padding: "0 12px", borderRadius: "8px", border: "none",
            backgroundColor: isWished ? "#FFF0F0" : "#F5F5F5",
            color: isWished ? "#E57373" : "#9E9E9E", fontSize: "11px", fontWeight: 500 }}
        >
          <Heart size={12} fill={isWished ? "#E57373" : "none"} /> {isWished ? "찜됨" : "찜"}
        </button>
        <button
          onClick={onToggleCompare}
          className="flex items-center gap-1 cursor-pointer transition-all active:scale-95 ml-auto"
          style={{ height: "30px", padding: "0 10px", borderRadius: "8px", border: "none",
            backgroundColor: inCompare ? "#E8F5E9" : "#F5F5F5",
            color: inCompare ? "#4CAF50" : "#9E9E9E", fontSize: "11px", fontWeight: 500 }}
        >
          <GitCompareArrows size={12} />
        </button>
      </div>
    </div>
  );
}
