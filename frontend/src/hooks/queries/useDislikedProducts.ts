/**
 * hooks/queries/useDislikedProducts.ts
 * 기피 제품 TanStack Query 훅
 *
 * useDislikedProductsQuery — GET  /users/me/disliked/products 목록 조회
 * useAddDislikedProduct    — POST /users/me/disliked/products 추가 (409 중복 처리 포함)
 * useRemoveDislikedProduct — DELETE /users/me/disliked/products/{id} 삭제 (낙관적 업데이트)
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { dislikedService } from "@/services/disliked";
import { queryKeys } from "@/lib/queryKeys";
import type { DislikedProduct } from "@/types/product/detail";

// ── GET /users/me/disliked/products ──────────────────────────────

export function useDislikedProductsQuery() {
  return useQuery({
    queryKey: queryKeys.dislikedProducts,
    queryFn: dislikedService.getList,
  });
}

// ── POST /users/me/disliked/products ─────────────────────────────

export function useAddDislikedProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => dislikedService.add(productId),

    onSuccess: () => {
      // 추가 성공 → 목록 캐시 무효화해서 재조회
      queryClient.invalidateQueries({ queryKey: queryKeys.dislikedProducts });
    },

    onError: (error) => {
      // 409: 이미 기피 등록된 제품 — 조용히 무시
      if (isAxiosError(error) && error.response?.status === 409) return;
      throw error;
    },
  });
}

// ── DELETE /users/me/disliked/products/{dislikedProductId} ───────

export function useRemoveDislikedProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dislikedProductId: number) =>
      dislikedService.remove(dislikedProductId),

    // 낙관적 업데이트 — 서버 응답 전에 목록에서 먼저 제거
    onMutate: async (dislikedProductId) => {
      await queryClient.cancelQueries({
        queryKey: queryKeys.dislikedProducts,
      });

      const previousList = queryClient.getQueryData<DislikedProduct[]>(
        queryKeys.dislikedProducts,
      );

      queryClient.setQueryData<DislikedProduct[]>(
        queryKeys.dislikedProducts,
        (currentList = []) =>
          currentList.filter((item) => item.dislikedProductId !== dislikedProductId),
      );

      return { previousList };
    },

    onError: (_error, _dislikedProductId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.dislikedProducts, context.previousList);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.dislikedProducts });
    },
  });
}
