/**
 * hooks/useProductSearch.ts
 * 제품 검색 TanStack Query 훅
 *
 * — GET /products 파라미터 변경 시 자동 재조회
 * — 필터/카테고리/검색어 바뀔 때마다 새 캐시 키로 관리
 * — placeholderData로 이전 결과 유지 (필터 변경 시 깜빡임 방지)
 */

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo } from "react";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";
import { mapProductSummaryList } from "@/utils/productMapper";
import { useLikeStore } from "@/stores";
import { useProductFilters } from "./useProductFilters";
import type { ProductSearchParams } from "@/types/product";

export function useProductSearch(params: ProductSearchParams) {
  const syncFromProducts = useLikeStore((s) => s.syncFromProducts);

  // 전체 탭 조회 시 categoryName 폴백용 — staleTime:Infinity라 한 번만 호출됨
  const { data: filterMeta } = useProductFilters();
  const categoryIdMap = useMemo(() => {
    const map = new Map<number, string>();
    filterMeta?.bigCategories.forEach((big) =>
      big.categories.forEach((cat) => map.set(cat.categoryId, cat.categoryName)),
    );
    return map;
  }, [filterMeta]);

  const query = useQuery({
    queryKey: queryKeys.products(params),
    queryFn: ({ signal }) => productService.search(params, signal),
    placeholderData: (previousData) => previousData,
  });

  useEffect(() => {
    if (query.data?.products) {
      syncFromProducts(
        query.data.products.map((p) => ({ id: p.productId, liked: p.liked })),
      );
    }
  }, [query.data, syncFromProducts]);

  return {
    ...query,
    products: query.data
      ? mapProductSummaryList(query.data.products, categoryIdMap)
      : [],
    hasNext: query.data?.hasNext ?? false,
    currentPage: query.data?.page ?? 0,
    totalCount: query.data?.totalCount ?? null,
  };
}
