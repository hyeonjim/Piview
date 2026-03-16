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
import { persist, createJSONStorage } from "zustand/middleware";
import { ROUTINE_STEPS, INITIAL_ROUTINE } from "@/constants/routineSteps";

// 스텝 메타 재export — home/page.tsx 등 기존 import 경로 유지
export { ROUTINE_STEPS as ROUTINE_STEP_META };
export type { RoutineStep as RoutineStepMeta } from "@/constants/routineSteps";

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

interface LocalRoutineStore {
  routine: LocalRoutineMap;
  setRoutine: (routine: LocalRoutineMap) => void;
  setStepProduct: (code: string, product: LocalProduct | null) => void;
  clearRoutine: () => void;
}

export const useLocalRoutineStore = create<LocalRoutineStore>()(
  persist(
    (set) => ({
      routine: INITIAL_ROUTINE as LocalRoutineMap,

      setRoutine: (routine) => set({ routine }),

      setStepProduct: (code, product) =>
        set((state) => ({ routine: { ...state.routine, [code]: product } })),

      clearRoutine: () => set({ routine: INITIAL_ROUTINE as LocalRoutineMap }),
    }),
    {
      name: "piview-routine",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    }
  )
);
