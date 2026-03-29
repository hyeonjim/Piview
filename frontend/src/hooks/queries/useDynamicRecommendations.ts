/**
 * hooks/queries/useDynamicRecommendations.ts
 * 행동 데이터(VIEW_PRODUCT, SEARCH, LIKE) 기반 맞춤 추천
 *
 * GET /api/v1/dynamic/recommendations
 * — trackEvent로 쌓인 사용자 행동 데이터를 반영한 개인화 추천
 * — 카테고리 필터 선택 시 해당 카테고리 범위로 좁힘
 */

import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";
import { mapProductSummaryList } from "@/utils/productMapper";
import { useLikeStore } from "@/stores";
import { useEffect, useMemo } from "react";
import { useProductFilters } from "./useProductFilters";
import type { ProductSearchParams } from "@/types/product";

export function useDynamicRecommendations(params: ProductSearchParams) {
  const syncFromProducts = useLikeStore((s) => s.syncFromProducts);

  // 전체 탭 조회 시 categoryName 폴백용
  const { data: filterMeta } = useProductFilters();
  const categoryIdMap = useMemo(() => {
    const map = new Map<number, string>();
    filterMeta?.bigCategories.forEach((big) =>
      big.categories.forEach((cat) => map.set(cat.categoryId, cat.categoryName)),
    );
    return map;
  }, [filterMeta]);

  const query = useQuery({
    queryKey: queryKeys.dynamicRecommendations(params),
    queryFn: () => productService.getDynamicRecommendations(params),
    staleTime: 1000 * 60, // 1분 — 페이지 이동 후 복귀 시 최신 추천 반영
    placeholderData: (prev) => prev,
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
    totalCount: query.data?.totalCount ?? null,
  };
}
