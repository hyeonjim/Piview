/**
 * services/routine.ts
 * 루틴 관련 API 서비스
 */

import client from "./client";
import type {
  DraftItem,
  DraftItemDto,
  RoutineListResponse,
  RoutineResponse,
  CreateRoutineRequest,
  RoutineOrderUpdateRequest,
} from "@/types/routine";

export const routineService = {
  /**
   * 임시 루틴(draft)에 제품 추가
   * POST /api/v1/routines/draft
   * @param columnId - 루틴 단계 ID (CL=1, PR=2, SR=3, LT=4, CR=5, SC=6)
   * @param productId - 추가할 화장품 ID
   * @deprecated syncDraft(PUT)로 통합 예정 — 현재 단일 추가 시에만 사용
   */
  addDraft: (columnId: number, productId: number) =>
    client.post("/routines/draft", { columnId, productId }),

  /**
   * 임시 루틴(draft) 전체 동기화
   * PUT /api/v1/routines/draft
   *
   * - 화면에 보이는 루틴 전체 배열을 그대로 전송
   * - 백엔드는 Redis(routine:draft:{userId})에 덮어쓰기
   * - 제품 추가 / 제거 / 드래그 순서 변경 시 매번 호출
   *
   * @param items - 현재 루틴의 전체 제품 목록 (순서 포함)
   */
  syncDraft: (items: DraftItem[]) => client.put("/routines/draft", items),

  /**
   * 임시 루틴(draft) 조회
   * GET /api/v1/routines/draft
   * 이전에 담다가 나갔던 화장품 목록이 있다면 화면에 그대로 복원
   */
  getDraft: () => client.get<DraftItemDto[]>("/routines/draft"),

  /**
   * 임시 루틴(draft) 전체 비우기 (초기화)
   * DELETE /api/v1/routines/draft
   * Redis 공간을 깔끔하게 비워줌
   */
  clearDraft: () => client.delete("/routines/draft"),

  /**
   * 임시 루틴(draft)에서 특정 제품 삭제
   * DELETE /api/v1/routines/draft/{productId}
   * Redis 공간에서 특정 제품만 삭제
   * @param productId - 삭제할 제품 ID
   */
  removeProductFromDraft: (productId: number) =>
    client.delete(`/routines/draft/${productId}`),

  // ── 루틴 (최종 저장본) ───────────────────────────────────────────

  /**
   * (최종) 루틴 생성 및 저장
   * POST /api/v1/routines
   * Redis에 있는 draft 데이터를 읽어와서 새로운 루틴을 생성
   * @returns 생성된 routineId (number)
   */
  createRoutine: (request: CreateRoutineRequest) =>
    client.post<number>("/routines", request),

  /**
   * 루틴 전체 목록 조회
   * GET /api/v1/routines
   * 사용자가 저장한 전체 루틴 목록을 불러옴
   */
  getUserRoutines: () => client.get<RoutineListResponse[]>("/routines"),

  /**
   * 메인 루틴 조회
   * GET /api/v1/routines/main
   * 현재 메인 화면에 노출할 루틴 1개 조회
   */
  getMainRoutine: () => client.get<RoutineResponse>("/routines/main"),

  /**
   * 루틴 상세 조회
   * GET /api/v1/routines/{routineId}
   * 사용자가 선택한 루틴의 상세 정보를 조회
   * @param routineId - 조회할 루틴 ID
   */
  getRoutineDetails: (routineId: number) =>
    client.get<RoutineResponse>(`/routines/${routineId}`),

  /**
   * 메인 루틴 선택
   * PATCH /api/v1/routines/{routineId}/main
   * 목록에서 선택한 루틴을 메인 루틴으로 지정 (기존 메인은 자동 해제)
   * @param routineId - 메인으로 설정할 루틴 ID
   */
  setMainRoutine: (routineId: number) =>
    client.patch(`/routines/${routineId}/main`),

  /**
   * 루틴 내 제품 순서 수정
   * PATCH /api/v1/routines/{routineId}/order
   * 루틴 이름/순서 구성을 수정
   * @param routineId - 순서를 변경할 루틴 ID
   * @param request   - 변경할 순서 목록
   */
  updateRoutineOrder: (routineId: number, request: RoutineOrderUpdateRequest) =>
    client.patch(`/routines/${routineId}/order`, request),

  /**
   * 루틴 삭제
   * DELETE /api/v1/routines/{routineId}
   * 저장한 루틴을 삭제
   * @param routineId - 삭제할 루틴 ID
   */
  deleteRoutine: (routineId: number) => client.delete(`/routines/${routineId}`),
};
