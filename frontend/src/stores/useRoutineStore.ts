// src/stores/useRoutineStore.ts
//
// ✅ ERD 변경 대응 전략:
// - MyRoutine 원본 배열 저장 → 컬럼 추가돼도 store 수정 불필요
// - 충돌/갭 분석 결과는 BE 응답 그대로 저장 (FE 재계산 X)

import { create } from "zustand";
import type { MyRoutine, RoutineAnalysis } from "@/types/routine";

interface RoutineStore {
  // ── 상태 ──────────────────────────────────────
  routines: MyRoutine[];           // 현재 루틴 목록 (ERD: MyRoutine)
  analysis: RoutineAnalysis | null; // 루틴 분석 결과 (충돌/갭)
  isAnalyzing: boolean;

  // ── 액션 ──────────────────────────────────────
  setRoutines: (routines: MyRoutine[]) => void;

  // 제품 추가/교체 (step 슬롯에 productId 세팅)
  updateRoutineProduct: (routineId: number, productId: number | null) => void;

  // 드래그 순서 변경
  reorderRoutines: (reordered: MyRoutine[]) => void;

  // 분석 결과
  setAnalysis: (result: RoutineAnalysis) => void;
  setAnalyzing: (flag: boolean) => void;
  clearAnalysis: () => void;
}

export const useRoutineStore = create<RoutineStore>((set) => ({
  routines: [],
  analysis: null,
  isAnalyzing: false,

  setRoutines: (routines) => set({ routines }),

  updateRoutineProduct: (routineId, productId) =>
    set((state) => ({
      routines: state.routines.map((r) =>
        r.id === routineId ? { ...r, productId } : r
      ),
      analysis: null, // 제품 바뀌면 분석 초기화
    })),

  reorderRoutines: (reordered) => set({ routines: reordered }),

  setAnalysis: (result) => set({ analysis: result, isAnalyzing: false }),
  setAnalyzing: (flag) => set({ isAnalyzing: flag }),
  clearAnalysis: () => set({ analysis: null }),
}));

// ── selector ──
export const selectConflicts   = (s: RoutineStore) => s.analysis?.conflicts    ?? [];
export const selectMissingSteps = (s: RoutineStore) => s.analysis?.missingSteps ?? [];
export const selectRoutineCount = (s: RoutineStore) =>
  s.routines.filter((r) => r.productId !== null).length;
