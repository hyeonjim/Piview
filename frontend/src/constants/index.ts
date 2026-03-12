/**
 * constants/index.ts
 * 모든 상수의 단일 진입점
 *
 * 사용법:
 *   import { ROUTINE_STEPS, SKIN_TYPES, CATEGORY_COLORS } from "@/constants";
 *   import { MOCK_PRODUCTS } from "@/constants/_mock/products";  ← mock은 직접 경로 사용
 *
 * _mock 폴더는 여기서 re-export하지 않음.
 * → "이 import가 mock인가 아닌가"를 경로만 봐도 알 수 있도록 분리 유지.
 */

export * from "./categories";
export * from "./categoryColors";
export * from "./colors";
export * from "./skinTypes";
export * from "./skinTypeInfo";
export * from "./routineSteps";
export * from "./routineEvaluation";
export * from "./quiz";
export * from "./skinTestOptions";
export * from "./insights";
export * from "./ewg";
export * from "./userSettings";
export * from "./productCategories";
export * from "./filterDefaults";
export * from "./allergens";
