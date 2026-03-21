/**
 * hooks/queries/useLike.ts
 * 찜(좋아요) 훅
 *
 * useLikedProducts  — GET  /products/likes 찜 목록 조회 + store 동기화
 * useToggleLike     — POST /products/{productId}/likes/toggle
 *
 * useLike           — 기존 호환 래퍼 (낙관적 상태 + API 동시 업데이트)
 */

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { productService } from "@/services/product";
import { useLikeStore } from "@/stores";
import { queryKeys } from "@/lib/queryKeys";

// ── GET /products/likes ───────────────────────────────────────────

export function useLikedProducts() {
  const initFromServer = useLikeStore((s) => s.initFromServer);

  const query = useQuery({
    queryKey: queryKeys.likedProducts,
    queryFn: productService.getLiked,
  });

  // 서버 데이터 로드되면 store 동기화 — ProductCard 하트 상태를 서버 기준으로 초기화
  useEffect(() => {
    if (query.data) {
      initFromServer(query.data.map((p) => p.productId));
    }
  }, [query.data, initFromServer]);

  return query;
}

// ── POST /products/{productId}/likes/toggle ───────────────────────

export function useToggleLike() {
  const queryClient = useQueryClient();
  const storeToggle = useLikeStore((s) => s.toggleLike);

  return useMutation({
    mutationFn: (productId: number) => productService.toggleLike(productId),

    // 낙관적 업데이트 — API 응답 전에 store 먼저 반영
    onMutate: (productId) => {
      storeToggle(productId);
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.likedProducts });
    },

    onError: (_err, productId) => {
      // 실패 시 롤백
      storeToggle(productId);
    },
  });
}

// ── 기존 호환 래퍼 ────────────────────────────────────────────────

export function useLike() {
  const { likedIds, isLiked } = useLikeStore();
  const { mutate: toggleLikeApi } = useToggleLike();

  return {
    likeList: likedIds,
    toggleLike: (id: string | number) => toggleLikeApi(Number(id)),
    isLiked,
  };
}
