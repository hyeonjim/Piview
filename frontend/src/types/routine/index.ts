/**
 * types/routine/index.ts
 *
 * ⚠️ 중요변경: ERD의 MyRoutine과 기존 타입이 불일치
 * - ERD MyRoutine = 루틴 "폴더" (routine_id, user_id, is_main, title만 있음)
 * - ERD Untitled = 실제 단계 (product_id, routine_col_id, step_order)
 * - 기존 타입은 이 둘을 하나의 필드로 합쳐서 잘못 표현하고 있었음
 */

import type { Product } from "@/types/product";

// ERD: RoutineColumn → 루틴 단계 마스터 (CL, PR, SR 등)
export interface RoutineColumn {
  id: number;              // ERD: routine_col_id
  routineColName: string;  // ERD: routine_col_name (기존 routineUnitEvent → 수정)
}

// ERD: MyRoutine → 루틴 "폴더/컨테이너"
// 제품 정보 없음 → 루틴 이름표 역할만 함
export interface MyRoutine {
  id: string;              // ERD: routine_id(VARCHAR PK) → UUID 형태
  userId: number;
  isMain: boolean;         // ERD: is_main → 메인 루틴 여부
  title: string;           // "아침 루틴", "저녁 루틴" 등
  details?: RoutineDetail[]; // API 응답 시 함께 포함될 수 있음
}

// ERD: Untitled → RoutineDetail → 루틴 안의 각 단계
// ⚠️ 백엔드 팀에 테이블명 RoutineDetail로 확정 요청 필요
export interface RoutineDetail {
  id: number;                   // ERD: routine_detail_id
  productId: number;
  product?: Product;
  routineColumnId: number;      // ERD: routine_col_id (FK → RoutineColumn)
  routineColumn?: RoutineColumn;
  routineId: string;            // ERD: routine_id (FK → MyRoutine)
  stepOrder: number;            // ERD: step_order → 드래그 순서
}

/**
 * PUT /api/v1/routines/draft 요청 body 아이템 1건
 *
 * - 화면의 루틴 전체 목록을 flat 배열로 변환해 전송
 * - 백엔드는 Redis에 통째로 덮어쓰기 (diff 없음)
 */
export interface DraftItem {
  columnId: number;  // 루틴 단계 ID (ERD: RoutineColumn.routine_col_id)
  productId: number; // 화장품 고유 ID (Long)
  stepOrder: number; // 루틴 전체 내 순서 (1부터 시작, 연속값)
}

// 루틴 스텝 키 타입 (RoutineColumn.routineColName 값)
export type RoutineStepKey =
  | "cleanser"
  | "toner"
  | "serum"
  | "lotion"
  | "cream"
  | "sunscreen"
  | "shaving"; // 남성 전용
