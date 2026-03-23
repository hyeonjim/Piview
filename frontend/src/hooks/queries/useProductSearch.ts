/**
 * hooks/useProductSearch.ts
 * 제품 검색 TanStack Query 훅
 *
 * — GET /products 파라미터 변경 시 자동 재조회
 * — 필터/카테고리/검색어 바뀔 때마다 새 캐시 키로 관리
 * — placeholderData로 이전 결과 유지 (필터 변경 시 깜빡임 방지)
 */

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";
import { mapProductSummaryList } from "@/utils/productMapper";
import { useLikeStore } from "@/stores";
import type { ProductSearchParams } from "@/types/product";

export function useProductSearch(params: ProductSearchParams) {
  const syncFromProducts = useLikeStore((s) => s.syncFromProducts);

  const query = useQuery({
    queryKey: queryKeys.products(params),
    queryFn: ({ signal }) => productService.search(params, signal),
    placeholderData: (previousData) => previousData,
  });

  // API 응답의 liked 필드로 LikeStore 부분 동기화
  // — 찜 페이지 방문 여부와 무관하게 검색/추천에서도 하트 상태 정확히 표시
  useEffect(() => {
    if (query.data?.products) {
      syncFromProducts(
        query.data.products.map((p) => ({ id: p.productId, liked: p.liked })),
      );
    }
  }, [query.data, syncFromProducts]);

  return {
    ...query,
    products: query.data ? mapProductSummaryList(query.data.products) : [],
    hasNext: query.data?.hasNext ?? false,
    currentPage: query.data?.page ?? 0,
    totalCount: query.data?.totalCount ?? null,
  };
}
