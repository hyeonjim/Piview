/**
 * stores/useFilterStore.ts
 * 검색/필터 전역 상태
 * SearchPage와 FilterModal, FilterButton이 이 스토어를 공유
 */

import { create } from "zustand";
import type { FilterState, SortOption } from "@/types/filter";
import { FILTER_INITIAL_STATE } from "@/types/filter";

interface FilterStore {
  filter: FilterState;
  sortOption: SortOption;
  setFilter: (filter: FilterState) => void;
  resetFilter: () => void;
  setSortOption: (option: SortOption) => void;
}

export const useFilterStore = create<FilterStore>((set) => ({
  filter: FILTER_INITIAL_STATE,
  sortOption: "recommend",

  setFilter: (filter) => set({ filter }),

  // 필터 전체 초기화
  resetFilter: () => set({ filter: FILTER_INITIAL_STATE }),

  setSortOption: (option) => set({ sortOption: option }),
}));

// 활성 필터 개수 (FilterButton 뱃지 표시용)
export const selectActiveFilterCount = (store: FilterStore): number => {
  const { filter } = store;
  return (
    filter.skinTypes.length +
    filter.concerns.length +
    filter.categories.length +
    filter.ewgGrades.length +
    (filter.priceRange ? 1 : 0)
  );
};
