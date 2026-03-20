/**
 * stores/useRoutineStore.ts
 * 루틴 관리 통합 스토어
 *
 * ✅ ERD 변경 대응 전략:
 * - MyRoutine 원본 배열 저장 → 컬럼 추가돼도 store 수정 불필요
 * - 충돌/갭 분석 결과는 BE 응답 그대로 저장 (FE 재계산 X)
 */

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type {
  MyRoutine,
  RoutineAnalysis,
  LocalProduct,
  LocalRoutineMap,
  SavedRoutine,
} from "@/types/routine";
import { ROUTINE_STEPS, INITIAL_ROUTINE } from "@/constants/routineSteps";

export type { LocalProduct, LocalRoutineMap, SavedRoutine };

// 스텝 메타 재export — 기존 import 경로 유지
export { ROUTINE_STEPS as ROUTINE_STEP_META };
export type { RoutineStep as RoutineStepMeta } from "@/constants/routineSteps";

// 🏪 스토어 인터페이스

interface RoutineStore {
  // 서버 연동용 상태 (메모리 전용)

  /** 현재 루틴 목록 (ERD: MyRoutine) */
  routines: MyRoutine[];

  /** 루틴 분석 결과 (충돌/갭) */
  analysis: RoutineAnalysis | null;

  /** 분석 진행 중 여부 */
  isAnalyzing: boolean;

  // ⚠️ API 연동 시 삭제 예정 — 로컬 전용 상태 (localStorage persist)

  /** 로컬 루틴 맵 (스텝 코드 → 제품 배열) */
  localRoutine: LocalRoutineMap;

  /** 홈화면 "나의 루틴" 표시 여부 */
  isMainRoutine: boolean;

  /** 현재 편집 중인 루틴 이름 */
  currentRoutineName: string;

  /** 저장된 루틴 목록 */
  savedRoutines: SavedRoutine[];

  // 서버 연동용 액션

  /** 루틴 목록 설정 */
  setRoutines: (routines: MyRoutine[]) => void;

  /** 제품 추가/교체 (step 슬롯에 productId 세팅) */
  updateRoutineProduct: (routineId: number, productId: number | null) => void;

  /** 드래그 순서 변경 */
  reorderRoutines: (reorderedRoutines: MyRoutine[]) => void;

  /** 분석 결과 설정 */
  setAnalysis: (analysisResult: RoutineAnalysis) => void;

  /** 분석 진행 상태 설정 */
  setAnalyzing: (isAnalyzingFlag: boolean) => void;

  /** 분석 결과 초기화 */
  clearAnalysis: () => void;

  // ⚠️ API 연동 시 삭제 예정 — 로컬 전용 액션

  /** 로컬 루틴 전체 설정 */
  setLocalRoutine: (routine: LocalRoutineMap) => void;

  /** 스텝에 제품 추가 */
  addStepProduct: (stepCode: string, product: LocalProduct) => void;

  /** 스텝에서 제품 제거 */
  removeStepProduct: (stepCode: string, productId: string) => void;

  /** 스텝 내 제품 순서 변경 */
  reorderStepProducts: (stepCode: string, newProducts: LocalProduct[]) => void;

  /** 로컬 루틴 초기화 */
  clearLocalRoutine: () => void;

  /** 메인 루틴 토글 */
  toggleMainRoutine: () => void;

  /** 현재 루틴 저장 */
  saveRoutine: (routineName: string) => void;

  /** 저장된 루틴 불러오기 */
  loadSavedRoutine: (routineId: string) => void;

  /** 저장된 루틴 삭제 */
  deleteSavedRoutine: (routineId: string) => void;
}

// 🏗️ 스토어 생성

export const useRoutineStore = create<RoutineStore>()(
  persist(
    (set) => ({
      // 초기 상태

      // 서버 연동용
      routines: [],
      analysis: null,
      isAnalyzing: false,

      // 로컬 전용 (⚠️ API 연동 시 삭제)
      localRoutine: INITIAL_ROUTINE as LocalRoutineMap,
      isMainRoutine: true,
      currentRoutineName: "내 루틴",
      savedRoutines: [],

      // 서버 연동용 액션

      setRoutines: (routines) => set({ routines }),

      updateRoutineProduct: (routineId, productId) =>
        set((state) => ({
          routines: state.routines.map((routine) =>
            routine.id === routineId ? { ...routine, productId } : routine,
          ),
          analysis: null, // 제품 변경 시 분석 초기화
        })),

      reorderRoutines: (reorderedRoutines) =>
        set({ routines: reorderedRoutines }),

      setAnalysis: (analysisResult) =>
        set({ analysis: analysisResult, isAnalyzing: false }),

      setAnalyzing: (isAnalyzingFlag) => set({ isAnalyzing: isAnalyzingFlag }),

      clearAnalysis: () => set({ analysis: null }),

      // ⚠️ API 연동 시 삭제 예정 — 로컬 전용 액션

      setLocalRoutine: (routine) => set({ localRoutine: routine }),

      addStepProduct: (stepCode, product) =>
        set((state) => ({
          localRoutine: {
            ...state.localRoutine,
            [stepCode]: [...(state.localRoutine[stepCode] ?? []), product],
          },
        })),

      removeStepProduct: (stepCode, productId) =>
        set((state) => ({
          localRoutine: {
            ...state.localRoutine,
            [stepCode]: (state.localRoutine[stepCode] ?? []).filter(
              (product) => product.id !== productId,
            ),
          },
        })),

      reorderStepProducts: (stepCode, newProducts) =>
        set((state) => ({
          localRoutine: {
            ...state.localRoutine,
            [stepCode]: newProducts,
          },
        })),

      clearLocalRoutine: () =>
        set({
          localRoutine: INITIAL_ROUTINE as LocalRoutineMap,
          currentRoutineName: "내 루틴",
        }),

      toggleMainRoutine: () =>
        set((state) => {
          const newIsMainRoutine = !state.isMainRoutine;
          const updatedSavedRoutines = state.savedRoutines.map(
            (savedRoutine) =>
              savedRoutine.name === state.currentRoutineName
                ? { ...savedRoutine, isMain: newIsMainRoutine }
                : savedRoutine,
          );
          return {
            isMainRoutine: newIsMainRoutine,
            savedRoutines: updatedSavedRoutines,
          };
        }),

      saveRoutine: (routineName) =>
        set((state) => {
          const productCount = Object.values(state.localRoutine).flat().length;
          const newSavedRoutine: SavedRoutine = {
            id: `routine-${Date.now()}`,
            name: routineName,
            routine: { ...state.localRoutine },
            productCount,
            savedAt: Date.now(),
            isMain: state.isMainRoutine,
          };

          // 같은 이름이 있으면 덮어쓰기, 없으면 추가
          const existingIndex = state.savedRoutines.findIndex(
            (routine) => routine.name === routineName,
          );

          const updatedSavedRoutines =
            existingIndex >= 0
              ? state.savedRoutines.map((routine, index) =>
                  index === existingIndex ? newSavedRoutine : routine,
                )
              : [...state.savedRoutines, newSavedRoutine];

          return {
            savedRoutines: updatedSavedRoutines,
            currentRoutineName: routineName,
          };
        }),

      loadSavedRoutine: (routineId) =>
        set((state) => {
          const foundRoutine = state.savedRoutines.find(
            (routine) => routine.id === routineId,
          );
          if (!foundRoutine) return {};
          return {
            localRoutine: foundRoutine.routine,
            currentRoutineName: foundRoutine.name,
            isMainRoutine: foundRoutine.isMain,
          };
        }),

      deleteSavedRoutine: (routineId) =>
        set((state) => ({
          savedRoutines: state.savedRoutines.filter(
            (routine) => routine.id !== routineId,
          ),
        })),
    }),
    {
      name: "piview-routine",
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,

      // ⚠️ API 연동 시 삭제 예정 — 로컬 전용 persist 복원 로직
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<RoutineStore>;

        // localRoutine 정규화 (null → 빈 배열)
        if (!persisted.localRoutine) return { ...currentState, ...persisted };

        const normalizedLocalRoutine = Object.fromEntries(
          Object.entries(persisted.localRoutine).map(([stepCode, products]) => [
            stepCode,
            Array.isArray(products) ? products.filter(Boolean) : [],
          ]),
        );

        return {
          ...currentState,
          ...persisted,
          localRoutine: normalizedLocalRoutine,
        };
      },

      // 서버 연동 상태는 persist하지 않음 (메모리 전용)
      partialize: (state) => ({
        localRoutine: state.localRoutine,
        isMainRoutine: state.isMainRoutine,
        currentRoutineName: state.currentRoutineName,
        savedRoutines: state.savedRoutines,
      }),
    },
  ),
);

// 🎯 셀렉터

export const selectConflicts = (state: RoutineStore) =>
  state.analysis?.conflicts ?? [];

export const selectMissingSteps = (state: RoutineStore) =>
  state.analysis?.missingSteps ?? [];

export const selectRoutineCount = (state: RoutineStore) =>
  state.routines.filter((routine) => routine.productId !== null).length;

// ⚠️ API 연동 시 삭제 예정 — 로컬 루틴 셀렉터
export const selectLocalRoutine = (state: RoutineStore) => state.localRoutine;

export const selectIsMainRoutine = (state: RoutineStore) => state.isMainRoutine;

export const selectCurrentRoutineName = (state: RoutineStore) =>
  state.currentRoutineName;

export const selectSavedRoutines = (state: RoutineStore) => state.savedRoutines;
