/**
 * hooks/queries/useRoutineQueries.ts
 * 루틴 관련 TanStack Query 훅 모음
 *
 * ■ 조회 훅 (useQuery)
 *   - useDraftQuery          임시 루틴 조회
 *   - useRoutineListQuery    루틴 전체 목록 조회
 *   - useMainRoutineQuery    메인 루틴 조회
 *   - useRoutineDetailQuery  루틴 상세 조회
 *
 * ■ 변경 훅 (useMutation)
 *   - useClearDraftMutation           임시 루틴 비우기
 *   - useRemoveProductFromDraftMutation 임시 루틴에서 제품 삭제
 *   - useCreateRoutineMutation        (최종) 루틴 생성 및 저장
 *   - useSetMainRoutineMutation       메인 루틴 선택
 *   - useUpdateRoutineOrderMutation   루틴 내 제품 순서 수정
 *   - useDeleteRoutineMutation        루틴 삭제
 *
 * ⚠️ BE 연동 전: queryFn에서 목업 데이터를 반환
 *    BE 연동 시:  주석 처리된 routineService 호출로 교체
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import type {
  DraftItemDto,
  RoutineListResponse,
  RoutineResponse,
  CreateRoutineRequest,
  RoutineOrderUpdateRequest,
} from "@/types/routine";
import {
  MOCK_DRAFT_ITEMS,
  MOCK_ROUTINE_LIST,
  MOCK_MAIN_ROUTINE,
  MOCK_ROUTINE_DETAIL_MAP,
} from "@/constants/_mock/routine";

// ── 조회 훅 ───────────────────────────────────────────────────────

/**
 * 임시 루틴(Draft) 조회
 * GET /api/v1/routines/draft
 * 이전에 담다가 나간 화장품 목록을 복원할 때 사용
 */
export function useDraftQuery() {
  return useQuery<DraftItemDto[]>({
    queryKey: queryKeys.routineDraft,
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.getDraft()로 교체
    queryFn: () => Promise.resolve(MOCK_DRAFT_ITEMS),
    // queryFn: () => routineService.getDraft().then((response) => response.data),
    staleTime: 1000 * 60, // 1분 — 드래프트는 자주 변경되므로 짧게 설정
  });
}

/**
 * 루틴 전체 목록 조회
 * GET /api/v1/routines
 */
export function useRoutineListQuery() {
  return useQuery<RoutineListResponse[]>({
    queryKey: queryKeys.routineList,
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.getUserRoutines()로 교체
    queryFn: () => Promise.resolve(MOCK_ROUTINE_LIST),
    // queryFn: () => routineService.getUserRoutines().then((response) => response.data),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 메인 루틴 조회
 * GET /api/v1/routines/main
 * 홈 화면에서 노출할 루틴 1개 조회
 */
export function useMainRoutineQuery() {
  return useQuery<RoutineResponse>({
    queryKey: queryKeys.routineMain,
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.getMainRoutine()으로 교체
    queryFn: () => Promise.resolve(MOCK_MAIN_ROUTINE),
    // queryFn: () => routineService.getMainRoutine().then((response) => response.data),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 루틴 상세 조회
 * GET /api/v1/routines/{routineId}
 * @param routineId - 조회할 루틴 ID (undefined이면 쿼리 비활성화)
 */
export function useRoutineDetailQuery(routineId: number | undefined) {
  return useQuery<RoutineResponse>({
    queryKey: queryKeys.routineDetail(routineId ?? 0),
    enabled: routineId !== undefined,
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.getRoutineDetails()로 교체
    queryFn: () =>
      Promise.resolve(
        MOCK_ROUTINE_DETAIL_MAP[routineId!] ?? MOCK_MAIN_ROUTINE,
      ),
    // queryFn: () => routineService.getRoutineDetails(routineId!).then((response) => response.data),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

// ── 변경 훅 ───────────────────────────────────────────────────────

/**
 * 임시 루틴(Draft) 전체 비우기 (초기화)
 * DELETE /api/v1/routines/draft
 */
export function useClearDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.clearDraft()로 교체
    mutationFn: () => Promise.resolve(),
    // mutationFn: () => routineService.clearDraft(),

    onSuccess: () => {
      // 드래프트 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDraft });
    },
  });
}

/**
 * 임시 루틴(Draft)에서 특정 제품 삭제
 * DELETE /api/v1/routines/draft/{productId}
 */
export function useRemoveProductFromDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.removeProductFromDraft()로 교체
    mutationFn: (_productId: number) => Promise.resolve(),
    // mutationFn: (productId: number) => routineService.removeProductFromDraft(productId),

    // 낙관적 업데이트 — 삭제된 제품을 캐시에서 즉시 제거
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routineDraft });

      const previousDraft = queryClient.getQueryData<DraftItemDto[]>(
        queryKeys.routineDraft,
      );

      queryClient.setQueryData<DraftItemDto[]>(queryKeys.routineDraft, (old = []) =>
        old.filter((item) => item.product.productId !== productId),
      );

      return { previousDraft };
    },

    onError: (_error, _productId, context) => {
      // 실패 시 스냅샷으로 롤백
      if (context?.previousDraft) {
        queryClient.setQueryData(queryKeys.routineDraft, context.previousDraft);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDraft });
    },
  });
}

/**
 * (최종) 루틴 생성 및 저장
 * POST /api/v1/routines
 * Redis의 draft 데이터를 읽어와 새로운 루틴을 생성하고 routineId를 반환
 */
export function useCreateRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation<number, Error, CreateRoutineRequest>({
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.createRoutine()으로 교체
    mutationFn: (_request: CreateRoutineRequest) =>
      Promise.resolve(Date.now()), // 목업: 임시 ID 반환
    // mutationFn: (request) => routineService.createRoutine(request).then((response) => response.data),

    onSuccess: () => {
      // 루틴 목록 무효화 — 새로 생성된 루틴이 목록에 반영됨
      queryClient.invalidateQueries({ queryKey: queryKeys.routineList });
    },
  });
}

/**
 * 메인 루틴 선택
 * PATCH /api/v1/routines/{routineId}/main
 * 선택한 루틴을 메인으로 지정 (기존 메인은 자동 해제)
 */
export function useSetMainRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.setMainRoutine()으로 교체
    mutationFn: (_routineId: number) => Promise.resolve(),
    // mutationFn: (routineId: number) => routineService.setMainRoutine(routineId),

    // 낙관적 업데이트 — 목록 캐시에서 메인 상태를 즉시 변경
    onMutate: async (routineId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routineList });

      const previousList = queryClient.getQueryData<RoutineListResponse[]>(
        queryKeys.routineList,
      );

      queryClient.setQueryData<RoutineListResponse[]>(queryKeys.routineList, (old = []) =>
        old.map((routine) => ({
          ...routine,
          isMain: routine.routineId === routineId,
        })),
      );

      return { previousList };
    },

    onError: (_error, _routineId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.routineList, context.previousList);
      }
    },

    onSettled: () => {
      // 목록 & 메인 루틴 캐시 동기화
      queryClient.invalidateQueries({ queryKey: queryKeys.routineList });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineMain });
    },
  });
}

/**
 * 루틴 내 제품 순서 수정
 * PATCH /api/v1/routines/{routineId}/order
 */
export function useUpdateRoutineOrderMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.updateRoutineOrder()로 교체
    mutationFn: (_variables: { routineId: number; request: RoutineOrderUpdateRequest }) =>
      Promise.resolve(),
    // mutationFn: ({ routineId, request }) => routineService.updateRoutineOrder(routineId, request),

    onSuccess: (_data, variables) => {
      // 해당 루틴 상세 캐시 무효화
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineDetail(variables.routineId),
      });
    },
  });
}

/**
 * 루틴 삭제
 * DELETE /api/v1/routines/{routineId}
 */
export function useDeleteRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    // ⚠️ API 연동 시 아래 목업 반환을 삭제하고 routineService.deleteRoutine()으로 교체
    mutationFn: (_routineId: number) => Promise.resolve(),
    // mutationFn: (routineId: number) => routineService.deleteRoutine(routineId),

    // 낙관적 업데이트 — 목록에서 즉시 제거
    onMutate: async (routineId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routineList });

      const previousList = queryClient.getQueryData<RoutineListResponse[]>(
        queryKeys.routineList,
      );

      queryClient.setQueryData<RoutineListResponse[]>(queryKeys.routineList, (old = []) =>
        old.filter((routine) => routine.routineId !== routineId),
      );

      return { previousList };
    },

    onError: (_error, _routineId, context) => {
      if (context?.previousList) {
        queryClient.setQueryData(queryKeys.routineList, context.previousList);
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routineList });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineMain });
    },
  });
}
