/**
 * _mock/product.ts
 * 제품 상세 페이지 더미 데이터
 *
 * ⚠️  API 교체 대상
 *     교체 시: 이 파일의 import를 삭제하고
 *              useEffect + api.get(`/products/${id}`) 로 대체
 *
 * 사용처:
 *   - src/app/product/[id]/page.tsx → MOCK_PRODUCT, MOCK_PURPOSE_SCORES, MOCK_SKIN_TYPE_SCORES
 */

export interface ProductDetail {
  id:          number;
  name:        string;
  brand:       string;
  price:       number;
  count:       string;
  rating:      number;
  reviewCount: number;
  skinTypes:   string[];
  effects:     string[];
  matchScore:  number;
  ewg: {
    total:       number;
    safe:        number;
    caution:     number;
    danger:      number;
    unknown:     number;
    safePercent: number;
  };
}

export interface PurposeScore {
  label: string;
  score: number;
}

export interface SkinTypeScore {
  label:     string;
  score:     number;
  isMyType?: boolean;
}

/** 제품 상세 더미 데이터 */
export const MOCK_PRODUCT: ProductDetail = {
  id:          1,
  name:        "119 스마트 시카 패드",
  brand:       "클라랩",
  price:       28000,
  count:       "60ea",
  rating:      0,
  reviewCount: 0,
  skinTypes:   ["지성", "복합성"],
  effects:     ["여드름", "안티에이징", "진정"],
  matchScore:  0,
  ewg: {
    total:       63,
    safe:        51,
    caution:     3,
    danger:      0,
    unknown:     9,
    safePercent: 94,
  },
};

/** 기능별 점수 더미 (보습/미백/진정 등) */
export const MOCK_PURPOSE_SCORES: PurposeScore[] = [
  { label: "보습",    score: 0 },
  { label: "미백",    score: 0 },
  { label: "진정",    score: 0 },
  { label: "각질케어", score: 0 },
  { label: "항산화",  score: 0 },
  { label: "모공관리", score: 0 },
];

/** 피부타입별 점수 더미 */
export const MOCK_SKIN_TYPE_SCORES: SkinTypeScore[] = [
  { label: "건성",  score: 0, isMyType: true },
  { label: "지성",  score: 0 },
  { label: "복합성",score: 0 },
  { label: "수부지", score: 0 },
];
