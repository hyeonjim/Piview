/**
 * types/routine.ts
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
