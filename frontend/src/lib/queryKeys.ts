/**
 * lib/queryKeys.ts
 * TanStack Query 키 중앙 관리
 * — 키가 여러 파일에 흩어지면 invalidateQueries 놓치는 버그 생김
 */

import type { ProductSearchParams } from "@/types/product";

export const queryKeys = {
  // 보유제품 목록 — GET /my-cos
  myCos: ["myCos"] as const,

  // 제품 검색 — GET /products (파라미터 다르면 별도 캐시)
  products: (params: ProductSearchParams) => ["products", params] as const,
} as const;
