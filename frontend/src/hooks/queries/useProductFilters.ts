/**
 * hooks/queries/useProductFilters.ts
 * 필터 메타 조회 — GET /products/filters
 *
 * staleTime: Infinity — 필터 메타는 자주 바뀌지 않으므로 앱 세션 동안 캐시 유지
 * 여러 페이지에서 import해도 API는 한 번만 호출됨
 */

import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";

export function useProductFilters() {
  return useQuery({
    queryKey: queryKeys.productFilters,
    queryFn: productService.getFilters,
    staleTime: Infinity,
  });
}
