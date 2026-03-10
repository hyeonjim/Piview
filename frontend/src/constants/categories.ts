/**
 * categories.ts
 * 카테고리, 소분류, 피부 고민 필터 목록
 *
 * 사용처:
 *   - src/app/(main)/search/page.tsx     → SEARCH_TABS, SUB_CATS, CONCERNS_FILTER
 *   - src/app/(main)/recommend/page.tsx  → PRODUCT_CATEGORIES
 */

/** 검색 페이지 대분류 탭 */
export const SEARCH_TABS = ["카테고리별", "피부별", "브랜드"] as const;

/** 검색 페이지 소분류 칩 */
export const SUB_CATS = [
  "스킨케어",
  "클렌징",
  "선케어",
  "핸즈",
  "스킨/토너",
  "로션/에멀전",
  "에센스/앰플/세럼",
  "크림",
  "페이스오일",
  "미스트",
  "패드",
] as const;

/** 검색 페이지 피부 고민 필터 칩 */
export const CONCERNS_FILTER = [
  "아토피",
  "여드름",
  "미백",
  "세스칙착",
  "안티에이징",
  "피지",
  "블랙헤드",
  "수분",
  "영양",
  "진정",
] as const;

/** 추천 페이지 카테고리 탭 */
export const PRODUCT_CATEGORIES = [
  "전체",
  "스킨/토너",
  "세럼/에센스",
  "크림",
  "클렌저",
  "선케어",
] as const;
