// ⚠️ 미연결 컴포넌트 — 백엔드 연동 시 페이지에 연결 예정
/**
 * components/features/search/ProductListItem.tsx
 *
 * 검색/추천 페이지의 제품 행 카드.
 * 기존 ProductCard (common) 는 세로형/가로형 레이아웃용이고,
 * 이 컴포넌트는 태그·액션버튼이 포함된 상세 리스트 카드.
 */

"use client";

import { Plus, GitCompareArrows, Heart } from "lucide-react";
import Link from "next/link";
import {
  CATEGORY_COLORS,
  SKIN_FUNCTION_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";
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

// ── 스타일 상수 ──────────────────────────────────────────────────────
const LIST_ITEM_LINK_STYLE = { textDecoration: "none" };
const THUMB_BASE_STYLE = {
  width: "80px",
  height: "80px",
  borderRadius: "12px",
  backgroundColor: "white",
  fontSize: "32px",
};
const THUMB_IMG_STYLE = {
  width: "80px",
  height: "80px",
  objectFit: "cover" as const,
};
const BRAND_TEXT_STYLE = {
  fontSize: "10px",
  color: "#9E9E9E",
  fontWeight: 600,
};
const NAME_TEXT_STYLE = { fontSize: "13px", fontWeight: 600, color: "#1A1A1A" };
const ROUTINE_BADGE_STYLE = {
  fontSize: "10px",
  padding: "2px 6px",
  borderRadius: "6px",
  backgroundColor: "#F0F2E8",
  color: "var(--color-brand)",
  fontWeight: 600,
};
const PRICE_TEXT_STYLE = {
  fontSize: "12px",
  fontWeight: 700,
  color: "#1A1A1A",
};
const VOLUME_TEXT_STYLE = { fontSize: "11px", color: "#9E9E9E" };
const CAT_BADGE_BASE = {
  fontSize: "10px",
  padding: "2px 6px",
  borderRadius: "6px",
  fontWeight: 600,
};
const TAG_BADGE_BASE = {
  fontSize: "9px",
  padding: "1px 4px",
  borderRadius: "3px",
};
const ACTION_BTN_BASE = {
  height: "30px",
  padding: "0 12px",
  borderRadius: "8px",
  border: "none",
};

interface Props {
  product: ProductListItemData;
  isLiked: boolean;
  isInRoutine?: boolean;
  inCompare?: boolean;
  onAddToRoutine?: () => void;
  onToggleLikelist?: () => void;
  onToggleCompare?: () => void;
}

export function ProductListItem({
  product,
  isLiked,
  isInRoutine = false,
  inCompare = false,
  onAddToRoutine,
  onToggleLikelist,
  onToggleCompare,
}: Props) {
  const catColor = CATEGORY_COLORS[product.category];
  const activeConcerns = Object.entries(product.concerns)
    .filter(([, isActive]) => isActive)
    .map(([concernName]) => concernName);

  return (
    <div
      className="p-3.5 transition-all duration-200"
      style={{
        borderRadius: "14px",
        backgroundColor: catColor ? catColor.bg : "#FAFAFA",
        border: `1.5px solid ${catColor ? catColor.border : "#F0F0F0"}`,
      }}
    >
      <Link
        href={`/product/${product.id}`}
        className="flex items-start gap-3"
        style={LIST_ITEM_LINK_STYLE}
      >
        {/* 이미지 */}
        <div
          className="shrink-0 flex items-center justify-center overflow-hidden"
          style={{
            ...THUMB_BASE_STYLE,
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            border: `1px solid ${catColor ? catColor.border : "#F0F0F0"}`,
          }}
        >
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt={product.name}
              style={THUMB_IMG_STYLE}
            />
          ) : (
            product.emoji
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span style={BRAND_TEXT_STYLE}>{product.brand}</span>
            {catColor && (
              <span
                style={{
                  ...CAT_BADGE_BASE,
                  backgroundColor: catColor.chip,
                  color: catColor.accent,
                }}
              >
                {product.category}
              </span>
            )}
            {isInRoutine && <span style={ROUTINE_BADGE_STYLE}>루틴중</span>}
          </div>

          <p className="truncate" style={NAME_TEXT_STYLE}>
            {product.name}
          </p>

          {/* 태그 */}
          <div className="flex flex-wrap gap-1 mt-1.5">
            {[product.skinType1, product.skinType2]
              .filter(Boolean)
              .map((skinType) => {
                const skinTypeColor = SKIN_TYPE_TAG_COLORS[skinType!] ?? {
                  bg: "var(--color-bg-muted-warm)",
                  text: "#7A7060",
                };
                return (
                  <span
                    key={skinType}
                    style={{
                      ...TAG_BADGE_BASE,
                      backgroundColor: skinTypeColor.bg,
                      color: skinTypeColor.text,
                      fontWeight: 600,
                    }}
                  >
                    {skinType}
                  </span>
                );
              })}
            {activeConcerns.slice(0, 3).map((concernName) => {
              const concernColor = SKIN_FUNCTION_COLORS[concernName];
              return (
                <span
                  key={concernName}
                  style={{
                    ...TAG_BADGE_BASE,
                    backgroundColor: concernColor?.chip ?? "#F8F6F0",
                    color: concernColor?.accent ?? "var(--color-text-warm)",
                    fontWeight: 600,
                  }}
                >
                  {concernName}
                </span>
              );
            })}
          </div>

          {/* 가격 / 평점 */}
          <div className="flex items-center gap-2 mt-2">
            <span style={PRICE_TEXT_STYLE}>{formatPrice(product.price)}</span>
            <span style={VOLUME_TEXT_STYLE}>
              ⭐ {product.rating} ({product.reviews.toLocaleString()})
            </span>
          </div>
        </div>
      </Link>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={onAddToRoutine}
          className="flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          style={{
            height: "30px",
            padding: "0 12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: isInRoutine ? "#E8F0E0" : "#F0F2E8",
            color: "var(--color-brand)",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          <Plus size={12} /> {isInRoutine ? "루틴중" : "루틴추가"}
        </button>
        <button
          onClick={onToggleLikelist}
          className="flex items-center gap-1 cursor-pointer transition-all active:scale-95"
          style={{
            height: "30px",
            padding: "0 12px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: isLiked ? "var(--color-bg-like)" : "#F5F5F5",
            color: isLiked ? "#E57373" : "#9E9E9E",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          <Heart size={12} fill={isLiked ? "#E57373" : "none"} />{" "}
          {isLiked ? "찜됨" : "찜"}
        </button>
        <button
          onClick={onToggleCompare}
          className="flex items-center gap-1 cursor-pointer transition-all active:scale-95 ml-auto"
          style={{
            height: "30px",
            padding: "0 10px",
            borderRadius: "8px",
            border: "none",
            backgroundColor: inCompare ? "#E8F5E9" : "#F5F5F5",
            color: inCompare ? "#4CAF50" : "#9E9E9E",
            fontSize: "11px",
            fontWeight: 600,
          }}
        >
          <GitCompareArrows size={12} />
        </button>
      </div>
    </div>
  );
}
