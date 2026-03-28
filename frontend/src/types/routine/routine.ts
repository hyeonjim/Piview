import type { ProductSummaryResponse } from "../product/product";

export type RoutineStepKey =
  | "cleanser" | "shaving" | "toner"
  | "serum" | "lotion" | "cream" | "sunscreen";

/**
 * GET /api/v1/routines/draft 응답 아이템
 * 스웨거: DraftItemDto
 */
export interface DraftItemDto {
  columnId: number;
  stepOrder: number;
  product: ProductSummaryResponse;
}

/**
 * GET /api/v1/routines 목록 응답
 * 스웨거: RoutineListResponse
 */
export interface RoutineListResponse {
  routineId: number;
  title: string;
  isMain: boolean;
  productCount: number;
}

/**
 * 루틴 상세 내 제품 아이템
 * 스웨거: RoutineProductDto
 */
export interface RoutineProductDto {
  routineDetailId: number;
  stepOrder: number;
  product: ProductSummaryResponse;
}

/**
 * 루틴 상세 내 스텝 그룹 (columnId 기준)
 * 스웨거: RoutineStepGroupDto
 */
export interface RoutineStepGroupDto {
  columnId: number;
  columnName: string;
  products: RoutineProductDto[];
}

/**
 * GET /api/v1/routines/{routineId}, GET /api/v1/routines/main 응답
 * 스웨거: RoutineResponse
 */
export interface RoutineResponse {
  routineId: number;
  title: string;
  isMain: boolean;
  steps: RoutineStepGroupDto[];
}

/**
 * POST /api/v1/routines 요청 body
 * 스웨거: CreateRoutineRequest
 */
export interface CreateRoutineRequest {
  userId?: number;
  title: string;
}

/**
 * POST /api/v1/routines/{routineId}/edit-start 응답
 * 스웨거: EditRoutineLoadResponse
 * 기존 루틴을 Redis draft로 복사한 결과
 */
export interface EditRoutineLoadResponse {
  routineId: number;
  title: string;
  draftItems: DraftItemDto[];
}

/**
 * PUT /api/v1/routines/{routineId} 요청 body
 * 스웨거: UpdateRoutineRequest
 * Redis draft 내용 + title로 기존 루틴을 완전 덮어씀
 */
export interface UpdateRoutineRequest {
  title: string;
}

/**
 * GET /api/v1/routines/analysis 응답
 * 메인 루틴 AI 분석 결과 — 성분 충돌, 이상치, 루틴 순서 팁 등 5줄 이내
 */
export interface RoutineAnalysisResponse {
  analysisText: string;
}

