/**
 * _mock/product.ts
 * 제품 상세 페이지 더미 데이터
 *
 * ⚠️  API 교체 대상
 *     교체 시: 이 파일의 import를 삭제하고
 *              useEffect + productService.getProduct(id) 로 대체
 *
 * 사용처:
 *   - src/app/product/[id]/page.tsx → MOCK_PRODUCT_DETAIL
 */

// ── 기존 타입 (search/page.tsx 등에서 사용) ───────────────────────────────────
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

export interface PurposeScore  { label: string; score: number; }
export interface SkinTypeScore { label: string; score: number; isMyType?: boolean; }

/** 제품 상세 더미 데이터 (기존 — search page 등에서 참조) */
export const MOCK_PRODUCT: ProductDetail = {
  id: 1, name: "119 스마트 시카 패드", brand: "클라랩",
  price: 28000, count: "60ea", rating: 0, reviewCount: 0,
  skinTypes: ["지성", "복합성"], effects: ["여드름", "안티에이징", "진정"],
  matchScore: 0,
  ewg: { total: 63, safe: 51, caution: 3, danger: 0, unknown: 9, safePercent: 94 },
};
export const MOCK_PURPOSE_SCORES: PurposeScore[] = [
  { label: "보습", score: 0 }, { label: "미백", score: 0 },
  { label: "진정", score: 0 }, { label: "각질케어", score: 0 },
  { label: "항산화", score: 0 }, { label: "모공관리", score: 0 },
];
export const MOCK_SKIN_TYPE_SCORES: SkinTypeScore[] = [
  { label: "건성", score: 0, isMyType: true },
  { label: "지성", score: 0 }, { label: "복합성", score: 0 }, { label: "수부지", score: 0 },
];

// ── 신규: 피그마 ProductDetailPage 기준 상세 타입 ────────────────────────────
export interface IngredientDetail {
  name:     string;
  nameEn?:  string;
  ewgGrade: number | null;
  funcs?:   string[];
}

export interface ProductDetailFull {
  id:          number;
  name:        string;
  brand:       string;
  category:    string;
  price:       number | null;
  volume:      string | null;
  matchScore:  number;
  imageUrl?:   string;
  emoji?:      string;
  description?: string;
  tags:        string[];
  skinType1?:  string;
  skinType2?:  string;
  concerns:    Record<string, boolean>;
  ingredientsKr:      string[];
  cautionIngredients: string[];
  ingredientDetails:  IngredientDetail[];
  purposeScores:      Record<string, number>;
  skinTypeScores:     Record<string, number>;
}

/**
 * 피그마 ProductDetailPage 기준 상세 더미
 * ⚠️  API 연동 시 productService.getProduct(id) 결과로 교체
 */
export const MOCK_PRODUCT_DETAIL: ProductDetailFull = {
  id: 1,
  name: "119 스마트 시카 패드",
  brand: "클라랩",
  category: "패드",
  price: 28000,
  volume: "60ea",
  matchScore: 82,
  emoji: "🧴",
  description: "병풀 추출물과 판테놀이 함유된 진정·재생 패드. 지성·복합성 피부의 모공 케어에 적합합니다.",
  tags: ["여드름", "진정", "저자극"],
  skinType1: "지성",
  skinType2: "복합성",
  concerns: {
    아토피: false, 여드름: true, 미백: false, 색소침착: false,
    안티에이징: false, 피지: true, 블랙헤드: true, 수분: false, 영양: false, 진정: true,
  },
  ingredientsKr: [
    "정제수", "부틸렌글라이콜", "글리세린", "나이아신아마이드",
    "판테놀", "병풀추출물", "히알루론산나트륨", "알란토인",
    "살리실산", "카보머", "EDTA이나트륨", "향료",
  ],
  cautionIngredients: ["살리실산", "향료"],
  ingredientDetails: [
    { name: "정제수",       ewgGrade: 1,    funcs: ["용매"] },
    { name: "부틸렌글라이콜", ewgGrade: 1,   funcs: ["보습제", "용매"] },
    { name: "글리세린",     ewgGrade: 1,    funcs: ["보습제", "피부컨디셔닝제"] },
    { name: "나이아신아마이드",ewgGrade: 2,  funcs: ["미백", "피지조절", "항산화"] },
    { name: "판테놀",       ewgGrade: 1,    funcs: ["보습제", "진정"] },
    { name: "병풀추출물",   ewgGrade: 1,    funcs: ["진정", "재생", "항염"] },
    { name: "히알루론산나트륨",ewgGrade: 1,  funcs: ["보습제", "피부컨디셔닝제"] },
    { name: "알란토인",     ewgGrade: 1,    funcs: ["진정", "재생"] },
    { name: "살리실산",     ewgGrade: 3,    funcs: ["각질제거", "항균"] },
    { name: "카보머",       ewgGrade: 2,    funcs: ["점증제"] },
    { name: "EDTA이나트륨", ewgGrade: 3,    funcs: ["킬레이트제"] },
    { name: "향료",         ewgGrade: null, funcs: ["향기"] },
  ],
  purposeScores: {
    보습: 62, 진정: 85, 미백: 55, 각질케어: 70, 모공관리: 78, 항산화: 45,
  },
  skinTypeScores: {
    건성: 55, 지성: 88, 복합성: 82, 수부지: 60, 민감성: 50,
  },
};
