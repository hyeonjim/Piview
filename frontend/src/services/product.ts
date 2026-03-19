/**
 * services/product.ts
 * 제품 API
 *
 * GET /products — 검색/필터 조회 (Slice 기반 페이지네이션)
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type { ProductSearchParams, ProductPageResponse } from "@/types/product";

export const productService = {
  // GET /products
  // ApiResponse<ProductPageResponse> 래퍼로 내려옴
  search: (params: ProductSearchParams): Promise<ProductPageResponse> =>
    client
      .get<ApiResponse<ProductPageResponse>>("/products", { params })
      .then((res) => res.data.data),
};
