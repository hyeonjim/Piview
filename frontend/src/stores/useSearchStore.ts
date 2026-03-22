/**
 * stores/useSearchStore.ts
 * 검색 페이지 전역 상태 — 상세 페이지 이동 후 복귀 시 상태 유지
 *
 * 검색어, 카테고리, 필터, 페이지 모두 이 store에서 관리
 */

import { create } from "zustand";
import type { FilterState } from "@/types/common";
import { FILTER_INITIAL_STATE } from "@/types/common";

interface SearchStore {
  searchQuery: string;
  selectedBigCategoryId: number | null;
  selectedCategoryId: number | null;
  filter: FilterState;
  page: number;
  maxKnownPage: number;

  setSearchQuery: (query: string) => void;
  setSelectedBigCategoryId: (id: number | null) => void;
  setSelectedCategoryId: (id: number | null) => void;
  setFilter: (filter: FilterState) => void;
  updateFilter: (partial: Partial<FilterState>) => void;
  resetFilter: () => void;
  setPage: (page: number) => void;
  resetPage: () => void;
}

export const useSearchStore = create<SearchStore>((set, get) => ({
  searchQuery: "",
  selectedBigCategoryId: null,
  selectedCategoryId: null,
  filter: FILTER_INITIAL_STATE,
  page: 1,
  maxKnownPage: 1,

  setSearchQuery: (query) =>
    set({ searchQuery: query, page: 1, maxKnownPage: 1 }),

  setSelectedBigCategoryId: (id) =>
    set({ selectedBigCategoryId: id, selectedCategoryId: null, page: 1, maxKnownPage: 1 }),

  setSelectedCategoryId: (id) =>
    set({ selectedCategoryId: id, page: 1, maxKnownPage: 1 }),

  setFilter: (filter) =>
    set({ filter, page: 1, maxKnownPage: 1 }),

  updateFilter: (partial) =>
    set({ filter: { ...get().filter, ...partial }, page: 1, maxKnownPage: 1 }),

  resetFilter: () =>
    set({ filter: FILTER_INITIAL_STATE, page: 1, maxKnownPage: 1 }),

  setPage: (page) =>
    set((state) => ({ page, maxKnownPage: Math.max(state.maxKnownPage, page) })),

  resetPage: () => set({ page: 1, maxKnownPage: 1 }),
}));
