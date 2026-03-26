/**
 * lib/queryKeys.ts
 * TanStack Query 키 중앙 관리
 * — 키가 여러 파일에 흩어지면 invalidateQueries 놓치는 버그 생김
 */

import type { ProductSearchParams, RecommendRequestDto } from "@/types/product";

export const queryKeys = {
  // 사용자 정보 — GET /users/me
  user: ["user"] as const,

  // 보유제품 목록 — GET /my-cos
  myCos: ["myCos"] as const,

  // 제품 검색 — GET /products (파라미터 다르면 별도 캐시)
  products: (params: ProductSearchParams) => ["products", params] as const,

  // ── 루틴 ────────────────────────────────────────────────────────

  // 임시 루틴(Draft) — GET /api/v1/routines/draft
  routineDraft: ["routineDraft"] as const,

  // 루틴 전체 목록 — GET /api/v1/routines
  routineList: ["routineList"] as const,

  // 메인 루틴 — GET /api/v1/routines/main
  routineMain: ["routineMain"] as const,

  // 루틴 상세 — GET /api/v1/routines/{routineId}
  routineDetail: (routineId: number) => ["routineDetail", routineId] as const,

  // 제품 상세 — GET /products/{productId}
  productDetail: (productId: number) => ["productDetail", productId] as const,

  // 찜한 제품 목록 — GET /products/likes
  likedProducts: ["likedProducts"] as const,

  // 기피 제품 목록 — GET /api/v1/users/me/disliked/products
  dislikedProducts: ["dislikedProducts"] as const,

  // 필터 메타 — GET /products/filters (전역 캐시, 한 번만 호출)
  productFilters: ["productFilters"] as const,

  // 제품 비교 — POST /products/compare
  productCompare: (productIds: [number, number]) =>
    ["productCompare", ...productIds] as const,

  // 제품 AI 요약 — GET /products/{productId}/summary
  productAiSummary: (productId: number) =>
    ["productAiSummary", productId] as const,

  // 비교 AI 분석 — GET /products/compare/ai-summary
  productAiComparison: (productIds: [number, number]) =>
    ["productAiComparison", ...productIds] as const,

  // 동적 추천 — GET /dynamic/recommendations
  dynamicRecommendations: (params: { bigCategoryId?: number; categoryId?: number | number[] }) =>
    ["dynamicRecommendations", params] as const,

  // 피부 분석 상태 — GET /skin/analysis/{analysisId}
  analysisStatus: (analysisId: string) =>
    ["analysisStatus", analysisId] as const,

  // 제품 추천 — POST /recommendations/products
  recommendations: (request: RecommendRequestDto) =>
    ["recommendations", request] as const,
} as const;
