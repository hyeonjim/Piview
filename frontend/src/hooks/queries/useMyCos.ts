/**
 * hooks/useMyCos.ts
 * 보유제품 TanStack Query 훅
 *
 * useMyCosQuery    — GET  /my-cos 목록 조회
 * useAddMyCos      — POST /my-cos/{productId} 추가 (409 중복 처리 포함)
 * useRemoveMyCos   — DELETE /my-cos/{id} 삭제 (낙관적 업데이트)
 */

import { useQuery, useQueries, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { myCosService } from "@/services/myCos";
import { productService } from "@/services/product";
import { queryKeys } from "@/lib/queryKeys";
import type { MyCosItem } from "@/types/product";

// ── GET /my-cos ──────────────────────────────────────────────────

export function useMyCosQuery() {
  return useQuery({
    queryKey: queryKeys.myCos,
    queryFn: myCosService.getList,
    // 빈 배열은 정상 응답 — staleTime은 queryClient 기본값(5분) 따름
  });
}

// ── GET /my-cos + 각 제품 상세 병렬 조회 (tags 보완) ──────────────
// /my-cos 목록의 productInfo.tags가 비어있는 경우 상세 API로 보완

export function useMyCosWithTags() {
  const myCosQuery = useMyCosQuery();
  const myCosItems = myCosQuery.data ?? [];

  // myCos 목록이 로드된 후 각 productId로 상세를 병렬 조회
  const detailQueries = useQueries({
    queries: myCosItems.map((item) => ({
      queryKey: queryKeys.productDetail(item.productInfo.productId),
      queryFn: () => productService.getDetail(item.productInfo.productId),
      // 이미 캐시된 상세가 있으면 재사용 — staleTime 5분
      staleTime: 5 * 60 * 1000,
    })),
  });

  // myCosItems에 상세의 tags를 병합
  const data = myCosItems.map((item, index) => {
    const detail = detailQueries[index]?.data;
    return {
      ...item,
      productInfo: {
        ...item.productInfo,
        // 상세 API tags가 있으면 우선 사용, 없으면 목록 API tags 유지
        tags: (detail?.tags?.length ? detail.tags : item.productInfo.tags) ?? [],
      },
    };
  });

  const isDetailsLoading = detailQueries.some((q) => q.isLoading);

  return { ...myCosQuery, data, isDetailsLoading };
}

// ── POST /my-cos ─────────────────────────────────────────────────

export function useAddMyCos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (productId: number) => myCosService.add(productId),

    onSuccess: () => {
      // 추가 성공 → 목록 캐시 무효화해서 재조회
      queryClient.invalidateQueries({ queryKey: queryKeys.myCos });
    },

    onError: (error) => {
      // 409: 이미 보유 중인 제품 — 조용히 무시 (UI에서 이미 보유 상태로 표시됨)
      if (isAxiosError(error) && error.response?.status === 409) return;
      // 그 외 에러는 상위로 전파 — 페이지에서 toast 등으로 처리
      throw error;
    },
  });
}

// ── DELETE /my-cos/{myCosId} ─────────────────────────────────────

export function useRemoveMyCos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (myCosId: number) => myCosService.remove(myCosId),

    // 낙관적 업데이트 — 서버 응답 전에 목록에서 먼저 제거
    onMutate: async (myCosId) => {
      // 진행 중인 refetch 취소 (덮어씌워지는 것 방지)
      await queryClient.cancelQueries({ queryKey: queryKeys.myCos });

      // 현재 캐시 스냅샷 저장 (에러 시 롤백용)
      const previousList = queryClient.getQueryData<MyCosItem[]>(
        queryKeys.myCos,
      );

      // 캐시에서 즉시 제거
      queryClient.setQueryData<MyCosItem[]>(queryKeys.myCos, (old = []) =>
        old.filter((item) => item.myCosId !== myCosId),
      );

      return { previousList };
    },

    onError: (_error, _myCosId, context) => {
      // 실패 시 스냅샷으로 롤백
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.myCos, context.previousList);
      }
    },

    onSettled: () => {
      // 성공/실패 무관하게 서버 상태로 동기화
      queryClient.invalidateQueries({ queryKey: queryKeys.myCos });
    },
  });
}
