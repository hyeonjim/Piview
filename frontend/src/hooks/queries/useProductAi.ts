/**
 * hooks/queries/useProductAi.ts
 * 제품 관련 AI 훅 모음
 *
 * useProductAiSummary — GET /products/{productId}/summary (AI 3줄 요약 + 맞춤 메시지)
 * 추후 AI 관련 훅 추가 시 이 파일에 추가
 */

import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";

export function useProductAiSummary(productId: number | null) {
  return useQuery({
    queryKey: queryKeys.productAiSummary(productId ?? 0),
    queryFn: () => productService.getAiSummary(productId!),
    enabled: productId !== null && productId > 0, // 상세 페이지 진입 즉시 자동 호출
    staleTime: Infinity, // 한 번 받으면 재요청 안 함
    retry: false,
  });
}

/**
 * 제품 2개 비교 AI 줄글 분석
 * GET /api/v1/products/compare/ai-summary?productIds=[id1,id2]
 * CompareModal 열릴 때 자동 호출 — 비동기 로딩 권장
 */
export function useAiComparisonSummary(productIds: [number, number] | null) {
  return useQuery({
    queryKey: productIds
      ? queryKeys.productAiComparison(productIds)
      : ["productAiComparison", "disabled"],
    queryFn: () => productService.getAiComparisonSummary(productIds!),
    enabled: productIds !== null && productIds[0] > 0 && productIds[1] > 0,
    staleTime: 1000 * 60 * 10, // 10분 캐시 — 같은 조합 재열람 시 재요청 없음
    retry: false,
  });
}
