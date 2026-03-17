/**
 * types/filter.ts
 * FilterModal + useFilterStore 공유 타입
 */

import type { SkinType } from "@/types/user";

export interface FilterState {
  skinTypes: SkinType[];
  concerns: string[];            // SkinProblems 기반 (여드름, 주름 등)
  categories: string[];          // BigCategory 기반
  ewgGrades: ("safe" | "caution" | "danger")[];
  priceRange: [number, number] | null;
}

export const FILTER_INITIAL_STATE: FilterState = {
  skinTypes: [],
  concerns: [],
  categories: [],
  ewgGrades: [],
  priceRange: null,
};

export type SortOption =
  | "recommend"
  | "popular"
  | "newest"
  | "priceAsc"
  | "priceDesc";
