// src/types/routine.ts
import type { Product } from "./product";

// 루틴 단계 슬롯 (여성 6단계 / 남성 7단계)
export type RoutineStepKey =
  | "cleanser"      // CL 클렌저
  | "shaving"       // SV 쉐이빙 (남성 전용)
  | "toner"         // TN 스킨/토너/미스트
  | "serum"         // SR 세럼/에센스 (선택)
  | "lotion"        // LT 로션
  | "cream"         // CR 크림/오일
  | "sunscreen";    // SC 선크림

// 루틴 컬럼 (ERD: RoutineColumn)
// 단계별 슬롯 정의 테이블
export interface RoutineColumn {
  id: number;
  routineUnitEvent: string; // "cleanser", "toner" 등
}

// 루틴 (ERD: MyRoutine)
export interface MyRoutine {
  id: number;
  userId: number;
  routineColumnId: number;
  routineColumn?: RoutineColumn;
  productId: number | null;
  product?: Product;
  order: number; // 드래그 순서 변경용
}

// 충돌 신뢰도
export type ConflictLevel = "certain" | "caution" | "myth";

// 성분 충돌 경고 (FE 계산 or BE 응답)
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
  missingSteps: RoutineStepKey[];   // 루틴 갭 (비어있는 단계)
  conflicts: ConflictAlert[];        // 성분 충돌 목록
  overlapWarnings: string[];         // 기능 중복 경고
}
