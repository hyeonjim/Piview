/**
 * types/filter.ts
 * 검색/추천 페이지 필터 상태 타입
 */

export interface FilterState {
  filterSkin: string | null; // 피부타입 — API skinType 파라미터
  tagIds: Set<number>; // 피부고민 태그 ID (구: filterFns)
  brandIds: Set<number>; // 브랜드 ID (구: filterBrands)
  bigCategoryId: number | null; // 대분류 ID
  categoryId: number | null; // 소분류 ID
  priceRange: [number, number];
}

export const PRICE_MAX = 1_000_000;

export const FILTER_INITIAL_STATE: FilterState = {
  filterSkin: null,
  tagIds: new Set(),
  brandIds: new Set(),
  bigCategoryId: null,
  categoryId: null,
  priceRange: [0, PRICE_MAX],
};

export type SortOption =
  | "recommend"
  | "popular"
  | "newest"
  | "priceAsc"
  | "priceDesc";
