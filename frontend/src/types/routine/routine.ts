/**
 * types/routine/routine.ts
 * 루틴 도메인 타입 — 스웨거 기준
 */

// ── 루틴 스텝 키 ─────────────────────────────────────────────────
export type RoutineStepKey =
  | "cleanser" | "shaving" | "toner"
  | "serum" | "lotion" | "cream" | "sunscreen";

// ── useRoutineStore 상태 ──────────────────────────────────────────
// ⚠️ 루틴 API 연동 시 실제 응답 기준으로 수정 필요
export interface MyRoutine {
  id: number;
  userId: number;
  routineColumnId: number;
  productId: number | null;
  order: number;
}

// ── PUT /routines/draft 요청 body ─────────────────────────────────
export interface DraftItem {
  columnId: number;
  productId: number;
  stepOrder: number;
}

// ── 성분 충돌 분석 (useRoutineStore.analysis) ─────────────────────
// ⚠️ 루틴 분석 API 연동 시 실제 응답 기준으로 수정 필요
export type ConflictLevel = "certain" | "caution" | "myth";

export interface ConflictAlert {
  ingredientA: string;
  ingredientB: string;
  level: ConflictLevel;
  reason: string;
  productAName: string;
  productBName: string;
}

export interface RoutineAnalysis {
  missingSteps: string[];
  conflicts: ConflictAlert[];
  overlapWarnings: string[];
}

// ── 스웨거 응답 스키마 기반 타입 ──────────────────────────────────

/**
 * GET /api/v1/products, GET /api/v1/routines/draft 등 공통 제품 요약
 * 스웨거: ProductSummaryResponse
 */
export interface ProductSummaryResponse {
  productId: number;
  name: string;
  brandName: string;
  categoryName: string;
  imageUrl: string;
  skinTypes: string[];
  tags: string[];
}

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
 * ⚠️ API 연동 시 userId는 서버가 토큰에서 추출하는 구조면 제거 가능
 */
export interface CreateRoutineRequest {
  userId?: number;
  title: string;
}

/**
 * PATCH /api/v1/routines/{routineId}/order 요청 아이템
 * 스웨거: RoutineDetailOrderDto
 */
export interface RoutineDetailOrderDto {
  routineDetailId: number;
  stepOrder: number;
}

/**
 * PATCH /api/v1/routines/{routineId}/order 요청 body
 * 스웨거: RoutineOrderUpdateRequest
 */
export interface RoutineOrderUpdateRequest {
  updatedOrders: RoutineDetailOrderDto[];
}

// ═══════════════════════════════════════════════════════════════
// ⚠️ API 연동 시 삭제 예정 — 로컬 전용 타입 (퍼블리싱 단계)
// ═══════════════════════════════════════════════════════════════

/**
 * 로컬 전용 제품 타입 (mock)
 * ⚠️ API 연동 시 ProductSummaryResponse로 교체 후 삭제
 */
export interface LocalProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  emoji: string;
  skinTypes: string[];
  effects: string[];
  matchScore: number;
  imageUrl?: string;
  price?: number;
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
}

/**
 * 로컬 루틴 맵 (스텝 코드 → 제품 배열)
 * ⚠️ API 연동 시 RoutineStepGroupDto로 교체 후 삭제
 */
export type LocalRoutineMap = Record<string, LocalProduct[]>;

/**
 * 저장된 루틴 타입 (localStorage 전용)
 * ⚠️ API 연동 시 RoutineListResponse로 교체 후 삭제
 */
export interface SavedRoutine {
  id: string;
  name: string;
  routine: LocalRoutineMap;
  productCount: number;
  savedAt: number;
  isMain: boolean;
}
