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
import { useEffect } from "react";
import type { ProductSearchParams } from "@/types/product";

export function useDynamicRecommendations(params: ProductSearchParams) {
  const syncFromProducts = useLikeStore((s) => s.syncFromProducts);

  const query = useQuery({
    queryKey: queryKeys.dynamicRecommendations(params),
    queryFn: () => productService.getDynamicRecommendations(params),
    staleTime: 1000 * 60 * 5, // 5분 — 행동 데이터 반영 주기 고려
    placeholderData: (prev) => prev,
  });

  // liked 상태 store 동기화
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
    totalCount: query.data?.totalCount ?? null,
  };
}
