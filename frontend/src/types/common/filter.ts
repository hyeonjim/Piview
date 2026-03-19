/**
 * types/filter.ts
 * 검색/추천 페이지 필터 상태 타입 — 단일 정의
 *
 * FilterModal.tsx에 있던 FilterState를 여기로 이동
 * — FilterModal.tsx는 이 파일에서 re-export
 */

export interface FilterState {
  filterSkin: string | null;
  filterFns: Set<string>;
  filterChosung: string | null;
  filterBrands: Set<string>;
  priceRange: [number, number];
}

export const PRICE_MAX = 1_000_000;

export const FILTER_INITIAL_STATE: FilterState = {
  filterSkin: null,
  filterFns: new Set(),
  filterChosung: null,
  filterBrands: new Set(),
  priceRange: [0, PRICE_MAX],
};

export type SortOption =
  | "recommend"
  | "popular"
  | "newest"
  | "priceAsc"
  | "priceDesc";
