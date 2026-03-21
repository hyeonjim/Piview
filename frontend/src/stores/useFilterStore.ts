/**
 * stores/useFilterStore.ts
 * 검색/필터 전역 상태
 * ⚠️ 현재 search/recommend 페이지는 로컬 useState로 필터 관리 중
 *    API 연동 시 이 store로 전환 결정 필요
 */

import { create } from "zustand";
import type { FilterState, SortOption } from "@/types/common";
import { FILTER_INITIAL_STATE } from "@/types/common";

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
  resetFilter: () => set({ filter: FILTER_INITIAL_STATE }),
  setSortOption: (option) => set({ sortOption: option }),
}));

// 활성 필터 개수 (FilterButton 뱃지 표시용)
export const selectActiveFilterCount = (s: FilterStore): number => {
  const { filter } = s;
  return (
    (filter.filterSkin ? 1 : 0) +
    (filter.tagIds.size > 0 ? 1 : 0) +
    (filter.brandIds.size > 0 ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < 1_000_000 ? 1 : 0)
  );
};
