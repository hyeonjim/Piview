/**
 * useSurveyStore.ts
 * 피부 진단 설문(survey) 페이지 간 상태 공유 스토어
 * - /skin-test/survey/[id] 각 질문 페이지 이동 시 답변·성별 유지
 */

import { create } from "zustand";

interface SurveyStore {
  gender: "female" | "male";
  answers: Record<number, string>;
  setGender: (gender: "female" | "male") => void;
  setAnswer: (questionId: number, value: string) => void;
  resetSurvey: () => void;
}

export const useSurveyStore = create<SurveyStore>((set) => ({
  gender: "female",
  answers: {},
  setGender: (gender) => set({ gender }),
  setAnswer: (questionId, value) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: value } })),
  resetSurvey: () => set({ gender: "female", answers: {} }),
}));
