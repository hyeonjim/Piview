/**
 * hooks/queries/useRoutineQueries.ts
 * 루틴 관련 TanStack Query 훅 모음
 *
 * ■ 조회 훅 (useQuery)
 *   - useDraftQuery          임시 루틴 조회 (Redis Draft)
 *   - useRoutineListQuery    루틴 전체 목록 조회
 *   - useMainRoutineQuery    메인 루틴 조회
 *   - useRoutineDetailQuery  루틴 상세 조회
 *
 * ■ 변경 훅 (useMutation)
 *   - useAddDraftItemMutation          임시 루틴 단일 제품 추가
 *   - useSyncDraftMutation             임시 루틴 전체 덮어쓰기 (드래그 순서 변경 등)
 *   - useClearDraftMutation            임시 루틴 비우기
 *   - useRemoveProductFromDraftMutation 임시 루틴에서 제품 삭제
 *   - useCreateRoutineMutation         (최종) 루틴 생성 및 저장
 *   - useSetMainRoutineMutation        메인 루틴 선택
 *   - useDeleteRoutineMutation         루틴 삭제
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { routineService } from "@/services/routine";
import type {
  DraftItemDto,
  RoutineListResponse,
  RoutineResponse,
  CreateRoutineRequest,
  EditRoutineLoadResponse,
  UpdateRoutineRequest,
  RoutineAnalysisResponse,
} from "@/types/routine";

// ── 조회 훅 ───────────────────────────────────────────────────────

/**
 * 임시 루틴(Draft) 조회
 * GET /api/v1/routines/draft
 * Redis에 저장된 편집 중인 루틴을 불러옴
 */
export function useDraftQuery() {
  return useQuery<DraftItemDto[]>({
    queryKey: queryKeys.routineDraft,
    queryFn: () =>
      routineService.getDraft().then((response) => response.data.data ?? []),
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
    queryFn: () =>
      routineService
        .getUserRoutines()
        .then((response) => response.data.data ?? []),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

/**
 * 메인 루틴 조회
 * GET /api/v1/routines/main
 * 홈 화면에서 노출할 루틴 1개 조회
 */
export function useMainRoutineQuery() {
  return useQuery<RoutineResponse | null>({
    queryKey: queryKeys.routineMain,
    queryFn: () =>
      routineService
        .getMainRoutine()
        .then((response) => response.data.data ?? null),
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
    queryFn: () =>
      routineService
        .getRoutineDetails(routineId!)
        .then((response) => response.data.data),
    staleTime: 1000 * 60 * 5, // 5분
  });
}

// ── 변경 훅 ───────────────────────────────────────────────────────

/**
 * 임시 루틴(Draft) 단일 제품 추가
 * POST /api/v1/routines/draft
 * 제품 선택 시 호출 — 단건 추가용
 */
export function useAddDraftItemMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      columnId,
      productId,
    }: {
      columnId: number;
      productId: number;
    }) => routineService.addDraft(columnId, productId),

    onSuccess: () => {
      // 드래프트 캐시 무효화 — 서버에서 최신 상태 재조회
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDraft });
    },
  });
}

/**
 * 임시 루틴(Draft) 복수 제품 일괄 추가
 * POST /api/v1/routines/draft × N — 병렬 요청 후 invalidate 1회
 * 맞춤형 추천 결과를 여러 단계에 한번에 추가할 때 사용 (race condition 방지)
 */
export function useAddMultipleDraftItemsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { columnId: number; productId: number }[]) => {
      // 순차 실행 — 병렬 시 Redis read-modify-write race condition으로 일부 제품이 덮어써짐
      const results = [];
      for (const item of items) {
        results.push(await routineService.addDraft(item.columnId, item.productId));
      }
      return results;
    },

    onSuccess: () => {
      // 모든 요청 완료 후 단 한 번만 invalidate — 중간 refetch로 인한 race condition 방지
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDraft });
    },
  });
}

/**
 * 임시 루틴(Draft) 전체 동기화 (덮어쓰기)
 * PUT /api/v1/routines/draft
 * 드래그 순서 변경 후 전체 배열을 서버에 저장할 때 사용
 */
export function useSyncDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (items: DraftItemDto[]) => routineService.syncDraft(items),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDraft });
    },
  });
}

/**
 * 임시 루틴(Draft) 전체 비우기 (초기화)
 * DELETE /api/v1/routines/draft
 */
export function useClearDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => routineService.clearDraft(),

    onSuccess: () => {
      // 드래프트 캐시를 빈 배열로 즉시 초기화
      queryClient.setQueryData<DraftItemDto[]>(queryKeys.routineDraft, []);
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
    mutationFn: (productId: number) =>
      routineService.removeProductFromDraft(productId),

    // 낙관적 업데이트 — 삭제된 제품을 캐시에서 즉시 제거
    onMutate: async (productId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routineDraft });

      const previousDraft = queryClient.getQueryData<DraftItemDto[]>(
        queryKeys.routineDraft,
      );

      queryClient.setQueryData<DraftItemDto[]>(
        queryKeys.routineDraft,
        (old = []) =>
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
    mutationFn: (request) =>
      routineService
        .createRoutine(request)
        .then((response) => response.data.data),

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
    mutationFn: (routineId: number) =>
      routineService.setMainRoutine(routineId),

    // 낙관적 업데이트 — 목록 캐시에서 메인 상태를 즉시 변경
    onMutate: async (routineId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routineList });

      const previousList = queryClient.getQueryData<RoutineListResponse[]>(
        queryKeys.routineList,
      );

      queryClient.setQueryData<RoutineListResponse[]>(
        queryKeys.routineList,
        (old = []) =>
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
 * 루틴 재수정 완료 (최종 덮어쓰기)
 * PUT /api/v1/routines/{routineId}
 * Redis draft 내용 + title로 기존 루틴을 완전 덮어씀
 */
export function useUpdateRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation<
    RoutineResponse,
    Error,
    { routineId: number; request: UpdateRoutineRequest }
  >({
    mutationFn: ({ routineId, request }) =>
      routineService
        .updateRoutine(routineId, request)
        .then((response) => response.data.data),

    onSuccess: (_data, variables) => {
      // 루틴 목록, 상세, 메인 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.routineList });
      queryClient.invalidateQueries({
        queryKey: queryKeys.routineDetail(variables.routineId),
      });
      queryClient.invalidateQueries({ queryKey: queryKeys.routineMain });
    },
  });
}

/**
 * 루틴 수정 모드 진입 (Redis로 복사)
 * POST /api/v1/routines/{routineId}/edit-start
 * 저장된 루틴을 Redis draft로 복사해 편집 모드로 전환
 */
export function useLoadRoutineToDraftMutation() {
  const queryClient = useQueryClient();

  return useMutation<EditRoutineLoadResponse, Error, number>({
    mutationFn: (routineId) =>
      routineService
        .loadRoutineToDraft(routineId)
        .then((response) => response.data.data),

    onSuccess: () => {
      // draft가 새로운 루틴 데이터로 교체되었으므로 캐시 무효화
      queryClient.invalidateQueries({ queryKey: queryKeys.routineDraft });
    },
  });
}

/**
 * 루틴 AI 분석
 * POST /api/v1/routines/analysis
 * 화면에 보이는 productIds를 넘겨서 수동 호출 — 버튼 클릭 시 mutate(productIds)
 */
export function useRoutineAnalysisMutation() {
  return useMutation<RoutineAnalysisResponse, Error, number[]>({
    mutationFn: (productIds: number[]) => routineService.getRoutineAnalysis(productIds),
    retry: false,
  });
}

/**
 * 루틴 삭제
 * DELETE /api/v1/routines/{routineId}
 */
export function useDeleteRoutineMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (routineId: number) =>
      routineService.deleteRoutine(routineId),

    // 낙관적 업데이트 — 목록에서 즉시 제거
    onMutate: async (routineId) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.routineList });

      const previousList = queryClient.getQueryData<RoutineListResponse[]>(
        queryKeys.routineList,
      );

      queryClient.setQueryData<RoutineListResponse[]>(
        queryKeys.routineList,
        (old = []) =>
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
