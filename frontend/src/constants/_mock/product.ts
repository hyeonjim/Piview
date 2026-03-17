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
  id: string | number;
  name: string;
  brand: string;
  price: number;
  count: string;
  rating: number;
  reviewCount: number;
  skinTypes: string[];
  effects: string[];
  matchScore: number;
  ewg: {
    total: number;
    safe: number;
    caution: number;
    danger: number;
    unknown: number;
    safePercent: number;
  };
}

export interface PurposeScore {
  label: string;
  score: number;
}
export interface SkinTypeScore {
  label: string;
  score: number;
  isMyType?: boolean;
}

/** 제품 상세 더미 데이터 (기존 — search page 등에서 참조) */
export const MOCK_PRODUCT: ProductDetail = {
  id: 1,
  name: "119 스마트 시카 패드",
  brand: "클라랩",
  price: 28000,
  count: "60ea",
  rating: 0,
  reviewCount: 0,
  skinTypes: ["지성", "복합성"],
  effects: ["여드름", "안티에이징", "진정"],
  matchScore: 0,
  ewg: {
    total: 20,
    safe: 10,
    caution: 6,
    danger: 2,
    unknown: 2,
    safePercent: 50,
  },
};
export const MOCK_PURPOSE_SCORES: PurposeScore[] = [
  { label: "보습", score: 0 },
  { label: "미백", score: 0 },
  { label: "진정", score: 0 },
  { label: "각질케어", score: 0 },
  { label: "항산화", score: 0 },
  { label: "모공관리", score: 0 },
];
export const MOCK_SKIN_TYPE_SCORES: SkinTypeScore[] = [
  { label: "건성", score: 0, isMyType: true },
  { label: "지성", score: 0 },
  { label: "복합성", score: 0 },
  { label: "수부지", score: 0 },
];

// ── 신규: 피그마 ProductDetailPage 기준 상세 타입 ────────────────────────────
export interface IngredientDetail {
  name: string;
  nameEn?: string;
  ewgGrade: number | null;
  funcs?: string[];
}

export interface ProductDetailFull {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  price: number | null;
  volume: string | null;
  matchScore: number;
  imageUrl?: string;
  emoji?: string;
  description?: string;
  tags: string[];
  skinType1?: string;
  skinType2?: string;
  concerns: Record<string, boolean>;
  ingredientsKr: string[];
  cautionIngredients: string[];
  ingredientDetails: IngredientDetail[];
  purposeScores: Record<string, number>;
  skinTypeScores: Record<string, number>;
  ewg: {
    total: number;
    safe: number;
    caution: number;
    danger: number;
    unknown: number;
    safePercent: number;
  };
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
  description:
    "병풀 추출물과 판테놀이 함유된 진정·재생 패드. 지성·복합성 피부의 모공 케어에 적합합니다.",
  tags: ["여드름", "진정", "저자극"],
  skinType1: "지성",
  skinType2: "복합성",
  ewg: {
    total: 20,
    safe: 10,
    caution: 6,
    danger: 2,
    unknown: 2,
    safePercent: 50,
  },
  concerns: {
    아토피: false,
    여드름: true,
    미백: false,
    색소침착: false,
    안티에이징: false,
    피지: true,
    블랙헤드: true,
    수분: false,
    영양: false,
    진정: true,
  },
  ingredientsKr: [
    "정제수",
    "부틸렌글라이콜",
    "글리세린",
    "나이아신아마이드",
    "판테놀",
    "병풀추출물",
    "히알루론산나트륨",
    "알란토인",
    "비에이치티",
    "살리실산",
    "카보머",
    "토코페롤",
    "리날룰",
    "시트로넬올",
    "알파-아이소메틸아이오논",
    "제라니올",
    "EDTA이나트륨",
    "향료",
  ],
  cautionIngredients: [
    "비에이치티",
    "살리실산",
    "리날룰",
    "시트로넬올",
    "알파-아이소메틸아이오논",
    "제라니올",
  ],
  ingredientDetails: [
    {
      name: "정제수",
      nameEn: "Water;Aqua",
      ewgGrade: 1,
      funcs: ["피부컨디셔닝제", "용제"],
    },
    {
      name: "부틸렌글라이콜",
      nameEn: "Butylene Glycol",
      ewgGrade: 1,
      funcs: ["착향제", "피부컨디셔닝제", "용제", "점도감소제"],
    },
    {
      name: "글리세린",
      nameEn: "Glycerin",
      ewgGrade: 1,
      funcs: ["보습제", "피부컨디셔닝제", "용제"],
    },
    {
      name: "나이아신아마이드",
      nameEn: "Niacinamide",
      ewgGrade: 2,
      funcs: ["미백", "피지조절", "항산화", "피부컨디셔닝제"],
    },
    {
      name: "판테놀",
      nameEn: "Panthenol",
      ewgGrade: 1,
      funcs: ["보습제", "진정", "피부컨디셔닝제"],
    },
    {
      name: "병풀추출물",
      nameEn: "Centella Asiatica Extract",
      ewgGrade: 1,
      funcs: ["진정", "재생", "항염"],
    },
    {
      name: "히알루론산나트륨",
      nameEn: "Sodium Hyaluronate",
      ewgGrade: 1,
      funcs: ["보습제", "피부컨디셔닝제"],
    },
    {
      name: "알란토인",
      nameEn: "Allantoin",
      ewgGrade: 1,
      funcs: ["진정", "재생", "상처치유"],
    },
    {
      name: "비에이치티",
      nameEn: "BHT",
      ewgGrade: 3,
      funcs: ["산화방지제", "착향제"],
    },
    {
      name: "살리실산",
      nameEn: "Salicylic Acid",
      ewgGrade: 3,
      funcs: ["각질제거", "항균", "여드름케어"],
    },
    {
      name: "카보머",
      nameEn: "Carbomer",
      ewgGrade: 2,
      funcs: ["점증제", "제형안정제"],
    },
    {
      name: "토코페롤",
      nameEn: "Tocopherol",
      ewgGrade: 1,
      funcs: ["산화방지제", "착향제", "피부컨디셔닝제", "수분증발차단제"],
    },
    { name: "리날룰", nameEn: "Linalool", ewgGrade: 3, funcs: ["착향제"] },
    {
      name: "시트로넬올",
      nameEn: "Citronellol",
      ewgGrade: 4,
      funcs: ["착향제"],
    },
    {
      name: "알파-아이소메틸아이오논",
      nameEn: "Alpha-Isomethyl Ionone",
      ewgGrade: 5,
      funcs: ["착향제", "피부컨디셔닝제(기타)"],
    },
    { name: "제라니올", nameEn: "Geraniol", ewgGrade: 7, funcs: ["착향제"] },
    {
      name: "EDTA이나트륨",
      nameEn: "Disodium EDTA",
      ewgGrade: 3,
      funcs: ["킬레이트제", "방부보조제"],
    },
    { name: "향료", nameEn: "Fragrance", ewgGrade: null, funcs: ["착향제"] },
  ],
  purposeScores: {
    보습: 62,
    진정: 85,
    미백: 55,
    각질케어: 70,
    모공관리: 78,
    항산화: 45,
  },
  skinTypeScores: {
    건성: 55,
    지성: 88,
    복합성: 82,
    수부지: 60,
  },
};

// ── id별 mock 맵 ──────────────────────────────────────────────────────────────
// searchProducts(s1~s12), mypageProducts(c1~c2, t1~t4, s1~s3, cr1~cr2, sc1~sc2) 커버
// ⚠️ API 연동 시 productService.getProduct(id) 로 교체 — 이 맵 전체 삭제

/**
 * id로 mock 제품 상세 조회
 * - searchProducts에서 기본 정보(이름/브랜드/카테고리/피부타입/효과 등) 가져옴
 * - 성분/EWG/점수 등 상세 필드는 MOCK_PRODUCT_DETAIL 기본값으로 채움
 * ⚠️ API 연동 시 이 함수만 productService.getProduct(id) 로 교체
 */
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/searchProducts";
import { STEP_PRODUCTS } from "@/constants/_mock/mypageProducts";

export function getMockProductById(id: string): ProductDetailFull {
  // searchProducts에서 먼저 찾기
  const fromSearch = MOCK_SEARCH_PRODUCTS.find((p) => p.id === id);
  if (fromSearch) {
    return {
      ...MOCK_PRODUCT_DETAIL,
      id: fromSearch.id,
      name: fromSearch.name,
      brand: fromSearch.brand,
      category: fromSearch.category,
      emoji: fromSearch.emoji,
      matchScore: fromSearch.matchScore,
      tags: fromSearch.effects,
      skinType1: fromSearch.skinType1,
      skinType2: fromSearch.skinType2,
      concerns: fromSearch.concerns,
      // ✅ searchProducts에 있는 price/ewg 그대로 유지
      price: fromSearch.price,
      ewg: {
        ...MOCK_PRODUCT_DETAIL.ewg,
        safe: fromSearch.ewgSafe,
        caution: fromSearch.ewgCaution,
        danger: fromSearch.ewgDanger,
        total:
          fromSearch.ewgSafe + fromSearch.ewgCaution + fromSearch.ewgDanger,
        unknown: Math.max(
          0,
          MOCK_PRODUCT_DETAIL.ewg.total -
            fromSearch.ewgSafe -
            fromSearch.ewgCaution -
            fromSearch.ewgDanger,
        ),
        safePercent: Math.round(
          (fromSearch.ewgSafe /
            (fromSearch.ewgSafe +
              fromSearch.ewgCaution +
              fromSearch.ewgDanger || 1)) *
            100,
        ),
      },
    };
  }

  // mypageProducts(루틴 모달)에서 찾기
  const fromMypage = STEP_PRODUCTS.find((p) => p.id === id);
  if (fromMypage) {
    return {
      ...MOCK_PRODUCT_DETAIL,
      id: fromMypage.id,
      name: fromMypage.name,
      brand: fromMypage.brand,
      category: fromMypage.category,
      emoji: fromMypage.emoji,
      matchScore: fromMypage.matchScore,
      tags: fromMypage.effects,
      skinType1: fromMypage.skinTypes[0],
      skinType2: fromMypage.skinTypes[1],
    };
  }

  // 없는 id면 기본값 fallback
  return MOCK_PRODUCT_DETAIL;
}
