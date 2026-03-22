/**
 * utils/productMapper.ts
 * API 응답 → ProductCard props 변환
 *
 * 스웨거 필드명과 mock/컴포넌트 필드명이 다르기 때문에
 * 한 곳에서 매핑을 관리해 여러 페이지에서 재사용
 *
 * ProductSummaryResponse (API) → ProductCard props 형태
 */

import type { ProductSummaryResponse } from "@/types/product";
import { fromSkinTypeEnum } from "./enumConvert";

export interface MappedProduct {
  id: number;
  name: string;
  brand: string;
  category: string;
  imageUrl: string | null;
  skinTypes: string[]; // 한글 변환 완료 ["건성", "지성"]
  effects: string[]; // tags (미구현 시 빈 배열)
  // EWG: 목록 API 응답에 없음 — undefined로 두면 ProductCard가 EWG 표시 안 함
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
}

// 이미지 없을 때 기본 placeholder — data URI라 파일 불필요
const FALLBACK_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 200 200'%3E%3Crect width='200' height='200' fill='%23F5F2EC'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='48' fill='%23C4BEB7'%3E%F0%9F%A7%B4%3C/text%3E%3C/svg%3E";

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
    // tags 미구현 — null이면 빈 배열
    effects: product.tags ?? [],
  };
}

/** ProductSummaryResponse[] → MappedProduct[] */
export function mapProductSummaryList(
  products: ProductSummaryResponse[],
): MappedProduct[] {
  return products.map(mapProductSummary);
}
