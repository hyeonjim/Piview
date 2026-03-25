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
import { formatPrice, getCategoryDisplayName } from "@/utils/format";

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
      className="product-list-card"
      data-has-color={!!catColor}
      style={
        catColor
          ? ({
              "--card-bg": catColor.bg,
              "--card-border": catColor.border,
            } as React.CSSProperties)
          : undefined
      }
    >
      <Link href={`/product/${product.id}`} className="flex items-start gap-3">
        {/* 이미지 */}
        <div
          className="product-list-thumb"
          data-has-color={!!catColor}
          style={
            catColor
              ? ({
                  "--card-border": catColor.border,
                } as React.CSSProperties)
              : undefined
          }
        >
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} />
          ) : (
            product.emoji
          )}
        </div>

        {/* 정보 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className="product-list-brand">{product.brand}</span>
            {catColor && (
              <span
                className="product-list-badge product-list-badge-category"
                style={
                  {
                    "--badge-bg": catColor.chip,
                    "--badge-color": catColor.accent,
                  } as React.CSSProperties
                }
              >
                {getCategoryDisplayName(product.category)}
              </span>
            )}
            {isInRoutine && (
              <span className="product-list-badge product-list-badge-routine">
                루틴중
              </span>
            )}
          </div>

          <p className="product-list-name truncate">{product.name}</p>

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
                    className="product-list-tag"
                    style={
                      {
                        "--tag-bg": skinTypeColor.bg,
                        "--tag-color": skinTypeColor.text,
                      } as React.CSSProperties
                    }
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
                  className="product-list-tag"
                  style={
                    {
                      "--tag-bg":
                        concernColor?.chip ??
                        "var(--color-product-tag-default-bg)",
                      "--tag-color":
                        concernColor?.accent ?? "var(--color-text-warm)",
                    } as React.CSSProperties
                  }
                >
                  {concernName}
                </span>
              );
            })}
          </div>

          {/* 가격 / 평점 */}
          <div className="flex items-center gap-2 mt-2">
            <span className="product-list-price">
              {formatPrice(product.price)}
            </span>
            <span className="product-list-volume">
              ⭐ {product.rating} ({product.reviews.toLocaleString()})
            </span>
          </div>
        </div>
      </Link>

      {/* 액션 버튼 */}
      <div className="flex items-center gap-2 mt-2.5">
        <button
          onClick={onAddToRoutine}
          className="product-list-action-btn"
          data-variant="routine"
          data-active={isInRoutine}
        >
          <Plus size={12} /> {isInRoutine ? "루틴중" : "루틴추가"}
        </button>
        <button
          onClick={onToggleLikelist}
          className="product-list-action-btn"
          data-variant="like"
          data-active={isLiked}
        >
          <Heart size={12} fill={isLiked ? "currentColor" : "none"} />{" "}
          {isLiked ? "찜됨" : "찜"}
        </button>
        <button
          onClick={onToggleCompare}
          className="product-list-action-btn ml-auto"
          data-variant="compare"
          data-active={inCompare}
        >
          <GitCompareArrows size={12} />
        </button>
      </div>
    </div>
  );
}
