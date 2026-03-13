/**
 * stores/useLocalRoutineStore.ts
 *
 * 퍼블리싱 단계용 로컬 루틴 store.
 * 백엔드 연동 전까지 홈·마이페이지가 이 store를 공유해 루틴 상태를 동기화한다.
 *
 * ⚠️ API 교체 대상
 *    백엔드 연동 시 → useRoutineStore(src/stores/useRoutineStore.ts)로 통합하고 이 파일 삭제
 */

import { create } from "zustand";

// 마이페이지 루틴에서 쓰는 제품 타입 (mock)
export interface LocalProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  emoji: string;
  skinTypes: string[];
  effects: string[];
  matchScore: number;
}

// 루틴 스텝 코드 → 제품 매핑
export type LocalRoutineMap = Record<string, LocalProduct | null>;

// 스텝 메타 (홈 화면 표시용)
export interface RoutineStepMeta {
  code: string;
  label: string;
  icon: string; // emoji
}

// 스텝 순서 정의 (마이페이지와 동기화)
export const ROUTINE_STEP_META: RoutineStepMeta[] = [
  { code: "CL", label: "클렌저",               icon: "🫧" },
  { code: "PR", label: "스킨/토너",             icon: "💧" },
  { code: "SR", label: "세럼/에센스",           icon: "✨" },
  { code: "LT", label: "로션/에멀전",           icon: "🧴" },
  { code: "CR", label: "크림/오일",             icon: "🤍" },
  { code: "SC", label: "선크림",                icon: "☀️" },
];

interface LocalRoutineStore {
  routine: LocalRoutineMap;
  setRoutine: (routine: LocalRoutineMap) => void;
  setStepProduct: (code: string, product: LocalProduct | null) => void;
  clearRoutine: () => void;
}

const INITIAL_ROUTINE: LocalRoutineMap = Object.fromEntries(
  ROUTINE_STEP_META.map((s) => [s.code, null])
);

export const useLocalRoutineStore = create<LocalRoutineStore>((set) => ({
  routine: INITIAL_ROUTINE,

  setRoutine: (routine) => set({ routine }),

  setStepProduct: (code, product) =>
    set((state) => ({ routine: { ...state.routine, [code]: product } })),

  clearRoutine: () => set({ routine: INITIAL_ROUTINE }),
}));
