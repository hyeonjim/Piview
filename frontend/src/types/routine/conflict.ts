/**
 * types/routine/conflict.ts
 * 성분 충돌 분석 타입 (FE 계산 or BE 응답)
 */

// 충돌 신뢰도
export type ConflictLevel = "certain" | "caution" | "myth";

// 성분 충돌 경고
export interface ConflictAlert {
  ingredientA: string;
  ingredientB: string;
  level: ConflictLevel;
  reason: string;
  productAName: string;
  productBName: string;
}

// 루틴 분석 결과 (BE 응답)
export interface RoutineAnalysis {
  missingSteps: string[];        // 비어있는 루틴 단계
  conflicts: ConflictAlert[];    // 성분 충돌 목록
  overlapWarnings: string[];     // 기능 중복 경고
}
