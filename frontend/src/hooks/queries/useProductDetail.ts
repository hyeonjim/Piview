/**
 * hooks/queries/useProductDetail.ts
 * 제품 상세 조회 훅 — GET /products/{productId}
 *
 * 사용법 (product/[id]/page.tsx):
 *   const { data: product, isLoading, isError } = useProductDetail(Number(id));
 */

import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";

export function useProductDetail(productId: number | null) {
  return useQuery({
    queryKey: queryKeys.productDetail(productId ?? 0),
    queryFn: () => productService.getDetail(productId!),
    enabled: !!productId && !isNaN(productId),
  });
}
