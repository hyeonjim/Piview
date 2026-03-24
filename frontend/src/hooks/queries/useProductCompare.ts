/**
 * hooks/queries/useProductCompare.ts
 * 제품 2개 비교 데이터 조회
 * POST /api/v1/products/compare
 */

import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";
import type { ProductCompareResponse } from "@/types/product";

/**
 * 제품 2개 비교 데이터 조회
 * @param productIds 비교할 제품 ID 2개 — null이면 쿼리 비활성화
 */
export function useProductCompare(productIds: [number, number] | null) {
  return useQuery<ProductCompareResponse>({
    queryKey: productIds ? queryKeys.productCompare(productIds) : ["productCompare", "disabled"],
    queryFn: () => productService.compareProducts(productIds!),
    enabled: productIds !== null && productIds[0] > 0 && productIds[1] > 0,
    staleTime: 1000 * 60 * 5, // 5분 캐시
  });
}
