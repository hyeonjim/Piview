/**
 * useSurveyStore.ts
 * 피부 진단 설문(survey) 페이지 간 상태 공유 스토어
 * - /skin-test/survey/[id] 각 질문 페이지 이동 시 답변·성별 유지
 *
 * ── fix: gender 타입을 "female"|"male" → "women"|"men"으로 통일
 *        GENDER_QUESTION 선택지 value("women"|"men")와 일치시켜
 *        survey 페이지에서 별도 변환 없이 바로 store에 저장 가능
 */

import { create } from "zustand";

interface SurveyStore {
  gender: "women" | "men";
  answers: Record<number, string>;
  setGender: (gender: "women" | "men") => void;
  setAnswer: (questionId: number, value: string) => void;
  resetSurvey: () => void;
}

export const useSurveyStore = create<SurveyStore>((set) => ({
  gender: "women",
  answers: {},
  setGender: (gender) => set({ gender }),
  setAnswer: (questionId, value) =>
    set((state) => ({ answers: { ...state.answers, [questionId]: value } })),
  resetSurvey: () => set({ gender: "women", answers: {} }),
}));
