/**
 * hooks/useMyCos.ts
 * 보유제품 TanStack Query 훅
 *
 * useMyCosQuery    — GET  /my-cos 목록 조회
 * useAddMyCos      — POST /my-cos 추가 (409 중복 처리 포함)
 * useRemoveMyCos   — DELETE /my-cos/{id} 삭제 (낙관적 업데이트)
 *
 * ⚠️ 연동 전까지 페이지에서 import해도 아무 영향 없음
 *    페이지에서 useOwnedStore 대신 이 훅으로 교체하는 시점에 실제 연동됨
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import { myCosService } from "@/services/myCos";
import { queryKeys } from "@/lib/queryKeys";
import type { MyCosItem, MyCosCreateRequest } from "@/types/product";

// ── GET /my-cos ──────────────────────────────────────────────────

export function useMyCosQuery() {
  return useQuery({
    queryKey: queryKeys.myCos,
    queryFn: myCosService.getList,
    // 빈 배열은 정상 응답 — staleTime은 queryClient 기본값(5분) 따름
  });
}

// ── POST /my-cos ─────────────────────────────────────────────────

export function useAddMyCos() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: MyCosCreateRequest) => myCosService.add(body),

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
      const previousList = queryClient.getQueryData<MyCosItem[]>(queryKeys.myCos);

      // 캐시에서 즉시 제거
      queryClient.setQueryData<MyCosItem[]>(queryKeys.myCos, (old = []) =>
        old.filter((item) => item.id !== myCosId),
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
