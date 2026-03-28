/**
 * services/routine.ts
 * 루틴 관련 API 서비스
 *
 * 모든 응답은 Spring Boot 공통 래퍼 ApiResponse<T> 형식:
 *   { status: number, message: string, data: T }
 */

import client from "./client";
import type { ApiResponse } from "@/types/common";
import type {
  DraftItemDto,
  RoutineListResponse,
  RoutineResponse,
  CreateRoutineRequest,
  EditRoutineLoadResponse,
  UpdateRoutineRequest,
  RoutineAnalysisResponse,
} from "@/types/routine";

export const routineService = {
  /**
   * 임시 루틴(draft)에 제품 추가 (단건)
   * POST /api/v1/routines/draft
   * @param columnId - 루틴 단계 ID (CL=1, SH=7, PR=2, SR=3, LT=4, CR=5, SC=6)
   * @param productId - 추가할 화장품 ID
   */
  addDraft: (columnId: number, productId: number) =>
    client.post<ApiResponse<DraftItemDto[]>>("/routines/draft", { columnId, productId }),

  /**
   * 임시 루틴(draft) 전체 동기화 (덮어쓰기)
   * PUT /api/v1/routines/draft
   * 드래그 순서 변경 후 전체 배열을 Redis에 저장
   * @param items - 현재 루틴의 전체 제품 목록 (순서 포함)
   */
  syncDraft: (items: DraftItemDto[]) =>
    client.put<ApiResponse<DraftItemDto[]>>("/routines/draft", items),

  /**
   * 임시 루틴(draft) 조회
   * GET /api/v1/routines/draft
   * Redis에 저장된 편집 중인 루틴을 불러옴
   */
  getDraft: () =>
    client.get<ApiResponse<DraftItemDto[]>>("/routines/draft"),

  /**
   * 임시 루틴(draft) 전체 비우기 (초기화)
   * DELETE /api/v1/routines/draft
   */
  clearDraft: () =>
    client.delete<ApiResponse<void>>("/routines/draft"),

  /**
   * 임시 루틴(draft)에서 특정 제품 삭제
   * DELETE /api/v1/routines/draft/{productId}
   * @param productId - 삭제할 제품 ID
   */
  removeProductFromDraft: (productId: number) =>
    client.delete<ApiResponse<void>>(`/routines/draft/${productId}`),

  // ── 루틴 (최종 저장본) ───────────────────────────────────────────

  /**
   * (최종) 루틴 생성 및 저장
   * POST /api/v1/routines
   * Redis의 draft 데이터를 읽어와 새로운 루틴을 생성
   * @returns 생성된 routineId (number)
   */
  createRoutine: (request: CreateRoutineRequest) =>
    client.post<ApiResponse<number>>("/routines", request),

  /**
   * 루틴 전체 목록 조회
   * GET /api/v1/routines
   */
  getUserRoutines: () =>
    client.get<ApiResponse<RoutineListResponse[]>>("/routines"),

  /**
   * 메인 루틴 조회
   * GET /api/v1/routines/main
   */
  getMainRoutine: () =>
    client.get<ApiResponse<RoutineResponse>>("/routines/main"),

  /**
   * 루틴 상세 조회
   * GET /api/v1/routines/{routineId}
   * @param routineId - 조회할 루틴 ID
   */
  getRoutineDetails: (routineId: number) =>
    client.get<ApiResponse<RoutineResponse>>(`/routines/${routineId}`),

  /**
   * 메인 루틴 선택
   * PATCH /api/v1/routines/{routineId}/main
   * @param routineId - 메인으로 설정할 루틴 ID
   */
  setMainRoutine: (routineId: number) =>
    client.patch<ApiResponse<void>>(`/routines/${routineId}/main`),

  /**
   * 루틴 삭제
   * DELETE /api/v1/routines/{routineId}
   * @param routineId - 삭제할 루틴 ID
   */
  deleteRoutine: (routineId: number) =>
    client.delete<ApiResponse<void>>(`/routines/${routineId}`),

  /**
   * 루틴 수정 모드 진입 (Redis로 복사)
   * POST /api/v1/routines/{routineId}/edit-start
   * 저장된 루틴을 Redis 임시 장바구니로 복사해 편집 준비
   * @param routineId - 편집할 루틴 ID
   */
  loadRoutineToDraft: (routineId: number) =>
    client.post<ApiResponse<EditRoutineLoadResponse>>(`/routines/${routineId}/edit-start`),

  /**
   * 루틴 재수정 완료 (최종 덮어쓰기)
   * PUT /api/v1/routines/{routineId}
   * Redis draft 내용 + title로 기존 루틴을 완전 덮어씀
   * @param routineId - 수정할 루틴 ID
   * @param request   - 새 루틴 제목
   */
  updateRoutine: (routineId: number, request: UpdateRoutineRequest) =>
    client.put<ApiResponse<RoutineResponse>>(`/routines/${routineId}`, request),

  /**
   * 루틴 AI 분석
   * POST /api/v1/routines/analysis
   * 화면에 보이는 제품 ID 목록을 넘기면 AI가 분석
   */
  getRoutineAnalysis: (productIds: number[]): Promise<RoutineAnalysisResponse> =>
    client
      .post<ApiResponse<RoutineAnalysisResponse>>("/routines/analysis", { productIds })
      .then((res) => res.data.data),
};
