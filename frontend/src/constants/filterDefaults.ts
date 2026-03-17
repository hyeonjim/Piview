/**
 * filterDefaults.ts
 * 검색/추천 페이지 공용 필터 기본값
 *
 * 사용처:
 *   - src/app/(main)/search/page.tsx
 *   - src/app/(main)/recommend/page.tsx
 */
import { FilterState } from "@/components/common/FilterModal";

export const DEFAULT_FILTER: FilterState = {
  filterSkin: null,
  filterFns: new Set(),
  filterChosung: null,
  filterBrands: new Set(),
  priceRange: [0, 1_000_000],
};

export const PRICE_MAX = 1_000_000;
