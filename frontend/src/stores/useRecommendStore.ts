/**
 * stores/useRecommendStore.ts
 * 추천 페이지 전역 상태 — 상세 페이지 이동 후 복귀 시 상태 유지
 *
 * 검색/필터 제거 후 카테고리 선택 + 페이지네이션만 관리
 */

import { create } from "zustand";

interface RecommendStore {
  selectedBigCategoryId: number | null;
  selectedCategoryId: number | null;
  page: number;
  maxKnownPage: number;

  setSelectedBigCategoryId: (id: number | null) => void;
  setSelectedCategoryId: (id: number | null) => void;
  setPage: (page: number) => void;
  resetPage: () => void;
}

export const useRecommendStore = create<RecommendStore>((set) => ({
  selectedBigCategoryId: null,
  selectedCategoryId: null,
  page: 1,
  maxKnownPage: 1,

  setSelectedBigCategoryId: (id) =>
    set({ selectedBigCategoryId: id, selectedCategoryId: null, page: 1, maxKnownPage: 1 }),

  setSelectedCategoryId: (id) =>
    set({ selectedCategoryId: id, page: 1, maxKnownPage: 1 }),

  setPage: (page) =>
    set((state) => ({ page, maxKnownPage: Math.max(state.maxKnownPage, page) })),

  resetPage: () => set({ page: 1, maxKnownPage: 1 }),
}));
