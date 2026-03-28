/**
 * utils/productMapper.ts
 * API 응답 → ProductCard props 변환
 *
 * 스웨거 필드명과 컴포넌트 필드명이 다르기 때문에
 * 한 곳에서 매핑을 관리해 여러 페이지에서 재사용
 *
 * ProductSummaryResponse (API) → ProductCard props 형태
 */

import type { ProductSummaryResponse, RecommendResponseDto } from "@/types/product";
import { fromSkinTypeEnum } from "./enumConvert";

// ── 안티에이징 태그 제외 카테고리 ────────────────────────────────
// 아래 카테고리(소분류명 또는 대분류명)에서는 안티에이징 태그를 표시하지 않음
// - 스킨케어 기초: 스킨/토너, 로션/에멀젼, 미스트, 토너패드
// - 선케어 계열: 선케어(대분류), 선크림, 선스틱
// - 맨즈 전용: 올인원
// - 기타: 쉐이빙, 클렌징 계열(startsWith로 처리)
export const ANTI_AGING_EXCLUDED_CATEGORIES = new Set([
  "스킨/토너",
  "로션/에멀젼",
  "미스트",
  "토너패드",
  "선케어",   // 대분류명 기준
  "선크림",   // 선케어 + 맨즈 소분류
  "선스틱",   // 선케어 소분류
  "올인원",   // 맨즈 소분류
  "쉐이빙",
]);

/** 해당 카테고리에서 안티에이징 태그를 숨겨야 하는지 여부 */
export function shouldExcludeAntiAging(category?: string): boolean {
  if (!category) return false;
  return (
    ANTI_AGING_EXCLUDED_CATEGORIES.has(category) ||
    category.startsWith("클렌징")
  );
}

/** 해당 카테고리에서 진정 태그를 숨겨야 하는지 여부 (클렌징 계열) */
function shouldExcludeCalming(category?: string): boolean {
  if (!category) return false;
  return category.startsWith("클렌징");
}

/** 해당 카테고리에서 색소침착 태그를 숨겨야 하는지 여부 (선크림, 선스틱) */
function shouldExcludePigmentation(category?: string): boolean {
  if (!category) return false;
  return category === "선크림" || category === "선스틱";
}

/** effects 배열에서 카테고리에 맞게 제외 태그를 필터링 */
export function filterEffectsByCategory(
  effects: string[],
  category?: string,
): string[] {
  return effects.filter((e) => {
    if (e === "안티에이징" && shouldExcludeAntiAging(category)) return false;
    if (e === "진정" && shouldExcludeCalming(category)) return false;
    if (e === "색소침착" && shouldExcludePigmentation(category)) return false;
    return true;
  });
}

// ── 타입 정의 ──────────────────────────────────────────────────────

export interface MappedProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  skinTypes: string[]; // 한글 변환 완료 ["건성", "지성"]
  effects: string[];   // 카테고리별 제외 필터링 완료
  liked: boolean;      // API 응답 기준 찜 상태
  // EWG: 목록 API 응답에 없음 — undefined로 두면 ProductCard가 EWG 표시 안 함
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
}

// ── 매핑 함수 ──────────────────────────────────────────────────────

/** ProductSummaryResponse → MappedProduct */
export function mapProductSummary(
  product: ProductSummaryResponse,
): MappedProduct {
  const category = product.categoryName ?? "";
  return {
    id: product.productId,
    name: product.name ?? "",
    brand: product.brandName ?? "",
    category,
    imageUrl: product.imageUrl ?? null, // null이면 ProductCard에서 emoji fallback 처리
    // "dry" | "oily" → "건성" | "지성" 한글 변환
    skinTypes: (product.skinTypes ?? []).map(fromSkinTypeEnum),
    // 카테고리에 맞는 제외 태그 필터링 적용
    effects: filterEffectsByCategory(product.tags ?? [], category),
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
 *  추천 API 응답의 tags를 effects(피부기능태그)로 매핑
 */
export function mapRecommendResponse(product: RecommendResponseDto): MappedProduct {
  const category = product.categoryName ?? "";
  return {
    id: product.productId,
    name: product.name ?? "",
    brand: product.brandName ?? "",
    category,
    imageUrl: product.imageUrl ?? null,
    // "dry" | "oily" → "건성" | "지성" 한글 변환
    skinTypes: (product.skinTypes ?? []).map(fromSkinTypeEnum),
    effects: filterEffectsByCategory(product.tags ?? [], category),
    liked: product.liked ?? false,
  };
}
