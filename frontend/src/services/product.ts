/**
 * services/product.ts
 * 제품 API
 *
 * GET /products              — 검색/필터 조회
 * GET /products/{productId}  — 상세 조회
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  ProductSearchParams,
  ProductPageResponse,
  ProductDetailResponse,
  ProductSummaryResponse,
  ProductFilterMetaResponse,
  ProductCompareRequest,
  ProductCompareResponse,
  RecommendRequestDto,
  RecommendResponseDto,
  ProductAiSummaryResponse,
  AiComparisonResponse,
} from "@/types/product";

export const productService = {
  // GET /products
  search: (
    params: ProductSearchParams,
    signal?: AbortSignal,
  ): Promise<ProductPageResponse> =>
    client
      .get<ApiResponse<ProductPageResponse>>("/products", { params, signal })
      .then((res) => res.data.data),

  // GET /products/{productId}
  getDetail: (productId: number): Promise<ProductDetailResponse> =>
    client
      .get<ApiResponse<ProductDetailResponse>>(`/products/${productId}`)
      .then((res) => {
        const data = res.data.data;
        // 정제수(Water/Aqua) — ewgScore/ewgGrade 무관하게 항상 1(안전)로 정규화
        // 모든 소비처에서 동일하게 안전 성분으로 취급
        if (data.ingredients) {
          data.ingredients = data.ingredients.map((ingredient) => {
            const isWater =
              ingredient.nameEn
                ?.toLowerCase()
                .replace(/[\s/;,()\-]/g, "")
                .match(/water|aqua/) != null ||
              ingredient.nameKo?.replace(/\s/g, "").includes("정제수");
            if (isWater) {
              return {
                ...ingredient,
                ewgScore: 1,
                ewgGrade: "low" as const,
              };
            }
            return ingredient;
          });
        }
        return data;
      }),

  // POST /products/{productId}/likes/toggle
  toggleLike: (productId: number): Promise<boolean> =>
    client
      .post<ApiResponse<boolean>>(`/products/${productId}/likes/toggle`)
      .then((res) => res.data.data),

  // GET /products/likes
  getLiked: (): Promise<ProductSummaryResponse[]> =>
    client
      .get<ApiResponse<ProductSummaryResponse[]>>("/products/likes")
      .then((res) => res.data.data),

  // GET /products/filters
  getFilters: (): Promise<ProductFilterMetaResponse> =>
    client
      .get<ApiResponse<ProductFilterMetaResponse>>("/products/filters")
      .then((res) => res.data.data),

  // POST /products/compare
  compareProducts: (
    productIds: [number, number],
  ): Promise<ProductCompareResponse> =>
    client
      .post<ApiResponse<ProductCompareResponse>>("/products/compare", {
        productIds,
      } as ProductCompareRequest)
      .then((res) => res.data.data),

  // POST /recommendations/products
  getRecommendations: (
    request: RecommendRequestDto,
  ): Promise<Record<string, RecommendResponseDto[]>> =>
    client
      .post<ApiResponse<Record<string, RecommendResponseDto[]>>>(
        "/recommendations/products",
        request,
      )
      .then((res) => res.data.data),

  // GET /api/v1/dynamic/recommendations — 행동 데이터 기반 맞춤 추천
  getDynamicRecommendations: (params: {
    bigCategoryId?: number;
    categoryId?: number;
  }): Promise<ProductPageResponse> =>
    client
      .get<ApiResponse<ProductPageResponse>>("/dynamic/recommendations", { params })
      .then((res) => res.data.data),

  // GET /products/{productId}/summary — AI 3줄 요약 + 맞춤 추천 메시지
  getAiSummary: (productId: number): Promise<ProductAiSummaryResponse> =>
    client
      .get<ApiResponse<ProductAiSummaryResponse>>(`/products/${productId}/summary`)
      .then((res) => res.data.data),

  // GET /products/compare/ai-summary?productIds=[id1,id2] — 비교 AI 줄글 분석
  getAiComparisonSummary: (productIds: [number, number]): Promise<AiComparisonResponse> =>
    client
      .get<ApiResponse<AiComparisonResponse>>("/products/compare/ai-summary", {
        params: { productIds },
      })
      .then((res) => res.data.data),
};
