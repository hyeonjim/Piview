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
} from "@/types/product";

export const productService = {
  // GET /products
  search: (params: ProductSearchParams): Promise<ProductPageResponse> =>
    client
      .get<ApiResponse<ProductPageResponse>>("/products", { params })
      .then((res) => res.data.data),

  // GET /products/{productId}
  getDetail: (productId: number): Promise<ProductDetailResponse> =>
    client
      .get<ApiResponse<ProductDetailResponse>>(`/products/${productId}`)
      .then((res) => res.data.data),

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
};
