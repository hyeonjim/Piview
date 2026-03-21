/**
 * hooks/useProductSearch.ts
 * 제품 검색 TanStack Query 훅
 *
 * — GET /products 파라미터 변경 시 자동 재조회
 * — 필터/카테고리/검색어 바뀔 때마다 새 캐시 키로 관리
 * — placeholderData로 이전 결과 유지 (필터 변경 시 깜빡임 방지)
 *
 * ⚠️ 연동 전까지 페이지에서 import해도 아무 영향 없음
 *    search/page.tsx에서 MOCK_SEARCH_PRODUCTS 제거하고 이 훅으로 교체하는 시점에 실제 연동됨
 */

import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";
import { mapProductSummaryList } from "@/utils/productMapper";
import type { ProductSearchParams } from "@/types/product";

export function useProductSearch(params: ProductSearchParams) {
  const query = useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => productService.search(params),
    // 파라미터 바뀌는 동안 이전 데이터 유지 — 깜빡임 방지
    placeholderData: (previousData) => previousData,
  });

  return {
    ...query,
    products: query.data ? mapProductSummaryList(query.data.products) : [],
    hasNext: query.data?.hasNext ?? false,
    currentPage: query.data?.page ?? 0,
    totalCount: query.data?.totalCount ?? null,
  };
}
