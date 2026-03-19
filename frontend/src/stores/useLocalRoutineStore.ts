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
  imageUrl?: string;
  price?: number;
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
}

// 루틴 스텝 코드 → 제품 배열 매핑 (스텝당 여러 제품 허용)
export type LocalRoutineMap = Record<string, LocalProduct[]>;

// 저장된 루틴 타입 — ⚠️ API 연동 시 서버 MyRoutine 타입으로 교체
export interface SavedRoutine {
  id: string;
  name: string;
  routine: LocalRoutineMap;
  productCount: number; // 총 제품 수 (카드 표시용)
  savedAt: number; // Unix timestamp (ms)
}

interface LocalRoutineStore {
  routine: LocalRoutineMap;
  // 홈화면 "나의 루틴" 표시 여부 — true면 홈에 노출
  isMainRoutine: boolean;
  // 현재 편집 중인 루틴 이름 — 저장 또는 불러오기 시 갱신, 기본값 "내 루틴"
  currentRoutineName: string;
  // 저장된 루틴 목록 — ⚠️ API 연동 시 서버 조회로 교체
  savedRoutines: SavedRoutine[];

  setRoutine: (routine: LocalRoutineMap) => void;
  // 스텝 배열에 제품 추가 — 같은 스텝에 여러 제품 허용
  addStepProduct: (code: string, product: LocalProduct) => void;
  // 스텝 배열에서 특정 id 제품 제거
  removeStepProduct: (code: string, productId: string) => void;
  // 스텝 내 제품 순서 변경 (드래그 정렬)
  reorderStepProducts: (code: string, newProducts: LocalProduct[]) => void;
  clearRoutine: () => void;
  toggleMainRoutine: () => void;
  // 현재 루틴을 이름으로 저장 — 같은 이름이면 덮어쓰기
  saveRoutine: (name: string) => void;
  // 저장된 루틴 불러오기 — 현재 루틴과 이름 모두 교체
  loadSavedRoutine: (id: string) => void;
  // 저장된 루틴 삭제
  deleteSavedRoutine: (id: string) => void;
}

export const useLocalRoutineStore = create<LocalRoutineStore>()(
  persist(
    (set, get) => ({
      routine: INITIAL_ROUTINE as LocalRoutineMap,
      isMainRoutine: true,
      currentRoutineName: "내 루틴",
      savedRoutines: [],

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

      // 드래그 정렬 후 새로운 순서로 교체
      reorderStepProducts: (code, newProducts) =>
        set((state) => ({
          routine: {
            ...state.routine,
            [code]: newProducts,
          },
        })),

      // 초기화 시 루틴 이름도 기본값으로 복원
      clearRoutine: () =>
        set({
          routine: INITIAL_ROUTINE as LocalRoutineMap,
          currentRoutineName: "내 루틴",
        }),

      toggleMainRoutine: () =>
        set((state) => ({ isMainRoutine: !state.isMainRoutine })),

      saveRoutine: (name) =>
        set((state) => {
          const productCount = Object.values(state.routine).flat().length;
          const newSaved: SavedRoutine = {
            id: `routine-${Date.now()}`,
            name,
            routine: { ...state.routine },
            productCount,
            savedAt: Date.now(),
          };
          // 같은 이름이 이미 있으면 덮어쓰기, 없으면 추가
          const existingIndex = state.savedRoutines.findIndex(
            (r) => r.name === name,
          );
          const updatedSavedRoutines =
            existingIndex >= 0
              ? state.savedRoutines.map((r, i) =>
                  i === existingIndex ? newSaved : r,
                )
              : [...state.savedRoutines, newSaved];
          return {
            savedRoutines: updatedSavedRoutines,
            currentRoutineName: name,
          };
        }),

      loadSavedRoutine: (id) =>
        set((state) => {
          const found = state.savedRoutines.find((r) => r.id === id);
          if (!found) return {};
          return {
            routine: found.routine,
            currentRoutineName: found.name,
          };
        }),

      deleteSavedRoutine: (id) =>
        set((state) => ({
          savedRoutines: state.savedRoutines.filter((r) => r.id !== id),
        })),
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
