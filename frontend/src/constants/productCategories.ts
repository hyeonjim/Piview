/**
 * productCategories.ts
 * 제품 대분류→소분류 계층 구조 & 브랜드 목록
 *
 * 사용처:
 *   - src/app/(main)/search/page.tsx
 *   - src/app/(main)/recommend/page.tsx
 *   - src/components/common/FilterModal.tsx
 */

/** 대분류 → 소분류 매핑 */
export const MAIN_CATEGORIES: Record<string, string[]> = {
  스킨케어: [
    "스킨/토너",
    "로션/에멀젼",
    "에센스/앰플/세럼",
    "크림",
    "페이스오일",
    "미스트",
    "패드",
  ],
  클렌징: [
    "클렌징폼",
    "클렌징젤",
    "클렌징밤",
    "클렌징오일",
    "클렌징워터",
    "클렌징로션",
  ],
  선케어: ["선크림", "선스틱"],
  맨즈: [
    "스킨/토너",
    "로션/에멀젼",
    "올인원",
    "쉐이빙",
    "에센스/세럼",
    "크림",
    "선크림",
  ],
};

/** 검색/추천 페이지 브랜드 목록 (API 연동 전 mock) */
export const BRANDS: string[] = [
  "타가",
  "생앤선",
  "미샤",
  "피터스",
  "반도",
  "라운드랩",
  "아누아",
  "코스알엑스",
  "이니스프리",
  "피지오겔",
  "아벤느",
  "세타필",
  "라로슈포제",
  "넘버즈인",
];
