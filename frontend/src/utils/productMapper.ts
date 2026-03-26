/**
 * utils/productMapper.ts
 * API 응답 → ProductCard props 변환
 *
 * 스웨거 필드명과 컴포넌트 필드명이 다르기 때문에
 * 한 곳에서 매핑을 관리해 여러 페이지에서 재사용
 *
 * ProductSummaryResponse (API) → ProductCard props 형태
 */

import type {
  ProductSummaryResponse,
  RecommendResponseDto,
} from "@/types/product";
import { fromSkinTypeEnum } from "./enumConvert";

export interface MappedProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  skinTypes: string[]; // 한글 변환 완료 ["건성", "지성"]
  effects: string[]; // tags → effects 매핑
  liked: boolean; // API 응답 기준 찜 상태
  // EWG: 목록 API 응답에 없음 — undefined로 두면 ProductCard가 EWG 표시 안 함
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
}

/** ProductSummaryResponse → MappedProduct */
export function mapProductSummary(
  product: ProductSummaryResponse,
): MappedProduct {
  return {
    id: product.productId,
    name: product.name ?? "",
    brand: product.brandName ?? "",
    category: product.categoryName ?? "",
    imageUrl: product.imageUrl ?? null, // null이면 ProductCard에서 emoji fallback 처리
    // "dry" | "oily" → "건성" | "지성" 한글 변환
    skinTypes: (product.skinTypes ?? []).map(fromSkinTypeEnum),
    effects: product.tags ?? [],
    liked: product.liked ?? false,
  };
}

/** ProductSummaryResponse[] → MappedProduct[] */
export function mapProductSummaryList(
  products: ProductSummaryResponse[],
): MappedProduct[] {
  return products.map(mapProductSummary);
}

/** RecommendResponseDto → MappedProduct
 *  추천 API 응답의 concernName을 effects(피부기능태그)로 매핑
 */
export function mapRecommendResponse(
  product: RecommendResponseDto,
): MappedProduct {
  return {
    id: product.productId,
    name: product.name ?? "",
    brand: product.brandName ?? "",
    category: product.categoryName ?? "",
    imageUrl: product.imageUrl ?? null,
    // "dry" | "oily" → "건성" | "지성" 한글 변환
    skinTypes: (product.skinTypes ?? []).map(fromSkinTypeEnum),
    // tags 배열 우선 사용, 없으면 concernName 폴백
    effects: product.tags?.length
      ? product.tags
      : product.concernName
        ? [product.concernName]
        : [],
    liked: product.liked ?? false,
  };
}

// ── 안티에이징 태그 제외 여부 판단 ───────────────────────────────
// 특정 카테고리는 안티에이징 태그가 맞지 않아 제외
const ANTI_AGING_EXCLUDED_CATEGORIES = new Set([
  "스킨/토너",
  "로션/에멀젼",
  "미스트",
  "토너패드",
  "선케어",
  "쉐이빙",
]);

/**
 * 해당 카테고리에서 안티에이징 태그를 제외해야 하면 true 반환
 * product/[id]/page.tsx 에서 tags 필터링에 사용
 */
export function shouldExcludeAntiAging(categoryName?: string): boolean {
  if (!categoryName) return false;
  return (
    ANTI_AGING_EXCLUDED_CATEGORIES.has(categoryName) ||
    categoryName.startsWith("클렌징")
  );
}
