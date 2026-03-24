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
    enabled: false, // 버튼 클릭 시 refetch()로 수동 호출
    staleTime: Infinity, // 한 번 받으면 재요청 안 함
    retry: false,
  });
}
