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
  // ⚠️ API 연동 시 서버 값으로 교체
  price?: number;
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
}

// 루틴 스텝 코드 → 제품 배열 매핑 (스텝당 여러 제품 허용)
export type LocalRoutineMap = Record<string, LocalProduct[]>;

interface LocalRoutineStore {
  routine: LocalRoutineMap;
  // 홈화면 "나의 루틴" 표시 여부 — true면 홈에 노출
  isMainRoutine: boolean;
  setRoutine: (routine: LocalRoutineMap) => void;
  // 스텝 배열에 제품 추가 — 같은 스텝에 여러 제품 허용
  addStepProduct: (code: string, product: LocalProduct) => void;
  // 스텝 배열에서 특정 id 제품 제거
  removeStepProduct: (code: string, productId: string) => void;
  clearRoutine: () => void;
  toggleMainRoutine: () => void;
}

export const useLocalRoutineStore = create<LocalRoutineStore>()(
  persist(
    (set) => ({
      routine: INITIAL_ROUTINE as LocalRoutineMap,
      isMainRoutine: true,

      setRoutine: (routine) => set({ routine }),

      addStepProduct: (code, product) =>
        set((state) => ({
          routine: {
            ...state.routine,
            [code]: [...(state.routine[code] ?? []), product],
          },
        })),

      removeStepProduct: (code, productId) =>
        set((state) => ({
          routine: {
            ...state.routine,
            [code]: (state.routine[code] ?? []).filter(
              (product) => product.id !== productId,
            ),
          },
        })),

      clearRoutine: () => set({ routine: INITIAL_ROUTINE as LocalRoutineMap }),

      toggleMainRoutine: () =>
        set((state) => ({ isMainRoutine: !state.isMainRoutine })),
    }),
    {
      name: "piview-routine",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
      // persist 복원 시 null로 저장된 스텝을 빈 배열로 정규화
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<LocalRoutineStore>;
        if (!persisted.routine) return { ...currentState, ...persisted };
        const normalizedRoutine = Object.fromEntries(
          Object.entries(persisted.routine).map(([code, products]) => [
            code,
            Array.isArray(products) ? products.filter(Boolean) : [],
          ]),
        );
        return { ...currentState, ...persisted, routine: normalizedRoutine };
      },
    },
  ),
);
