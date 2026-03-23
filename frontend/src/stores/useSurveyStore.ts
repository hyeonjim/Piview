/**
 * useSurveyStore.ts
 * 피부 진단 설문(survey) 페이지 간 상태 공유 스토어
 * - /skin-test/survey/[id] 각 질문 페이지 이동 시 답변·성별 유지
 * - analysisId: capture API에서 받은 값 — submitSurvey path param으로 사용
 */

import { create } from "zustand";

interface SurveyStore {
  gender: "WOMEN" | "MEN";
  answers: Record<number, string>;
  analysisId: string | null;
  setGender: (gender: "WOMEN" | "MEN") => void;
  setAnswer: (questionId: number, value: string) => void;
  setAnalysisId: (analysisId: string) => void;
  resetSurvey: () => void;
}

export const useSurveyStore = create<SurveyStore>((set) => ({
  gender: "WOMEN",
  answers: {},
  analysisId: null,
  setGender: (gender) => set({ gender }),
  setAnswer: (questionId, value) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: value } })),
  setAnalysisId: (analysisId) => set({ analysisId }),
  resetSurvey: () => set({ gender: "WOMEN", answers: {}, analysisId: null }),
}));
