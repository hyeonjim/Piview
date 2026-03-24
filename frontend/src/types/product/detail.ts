/**
 * types/product/detail.ts
 * 제품 상세 페이지 및 기타 특수 API 타입
 */

// ── 성분 상세 정보 ───────────────────────────────────────────────

/**
 * 성분 상세 정보
 * swagger: ProductIngredientDetailResponse
 */
export interface ProductIngredientDetailResponse {
  position: number;
  nameKo: string | null;
  nameEn: string | null;
  ewgGrade: "low" | "medium" | "high" | "unknown" | null;
  ewgScore: number | null; // 실제 EWG 점수 (1~10) — 신규 API 필드
  functions: string | null;
  isAllergen: boolean;
}

// ── 제품 상세 페이지 ──────────────────────────────────────────────

/**
 * 제품 상세 페이지 정보
 * swagger: ProductDetailResponse
 * GET /api/v1/products/{productId}
 */
export interface ProductDetailResponse {
  productId: number;
  imageUrl: string | null;
  brandName: string | null;
  productName: string | null;
  categoryName?: string | null;
  description: string | null;
  skinTypes: string[];
  tags: string[];
  price: number | null;
  volume: string | null;
  lowCount: number;
  mediumCount: number;
  highCount: number;
  unknownCount: number;
  cautionIngredients: string[];
  allergenIngredients: string[];
  ingredients: ProductIngredientDetailResponse[];
  skinTypeScores: Record<string, number>;
  liked: boolean;
}

// ── 안 맞는 제품 API ──────────────────────────────────────────────

/**
 * 안 맞는 제품 정보
 * swagger: DislikedProductSummaryResponse
 * GET /api/v1/users/me/disliked/products
 */
export interface DislikedProduct {
  dislikedProductId: number;
  productId: number;
  productName: string;
  brandName: string;
  categoryName: string;
  imageUrl: string | null;
  volume: string | null;
  price: number | null;
  topSkinType: string | null;
  top2SkinType: string | null;
}

/**
 * 안 맞는 제품 등록 요청
 * swagger: DislikedProductCreateRequest
 * POST /api/v1/disliked/products
 */
export interface DislikedProductCreateRequest {
  productId: number;
}

/**
 * 안 맞는 제품 등록 응답
 * swagger: DislikedProductCreateResponse
 * POST /api/v1/disliked/products
 */
export interface DislikedProductCreateResponse {
  dislikedProductId: number;
}

// ── OCR 인식 API ──────────────────────────────────────────────────

/**
 * OCR 제품 인식 결과
 * POST /api/v1/ocr/recognize
 */
export interface OcrRecognitionResponse {
  productId: number | null;
  brandName: string | null;
  productName: string | null;
  matchAccuracy: number; // 0~100
  success: boolean;
}

// ── 제품 비교 API ─────────────────────────────────────────────────

/**
 * EWG 위험도 분류 집계
 * swagger: EwgRisk
 */
export interface EwgRisk {
  low: number;
  medium: number;
  high: number;
}

/**
 * 알레르기 유발 성분 정보
 * swagger: Allergy
 */
export interface AllergyInfo {
  count: number;
  ingredients: string[];
}

/**
 * 비교 대상 제품 데이터
 * swagger: ComparedProduct
 * POST /api/v1/products/compare 응답 내 제품 단건
 */
export interface ComparedProductData {
  productId: number;
  name: string | null;
  imageUrl: string | null;
  price: number | null;
  brand: string | null;
  skinTypes: string[]; // 영문 소문자 — 렌더링 시 fromSkinTypeEnum 변환 필요
  skinConcerns: string[];
  ewgRisk: EwgRisk;
  allergy: AllergyInfo;
}

/**
 * 제품 비교 요청
 * swagger: ProductCompareRequest
 * POST /api/v1/products/compare
 */
export interface ProductCompareRequest {
  productIds: [number, number];
}

/**
 * 제품 비교 응답
 * swagger: ProductCompareResponse
 * POST /api/v1/products/compare
 */
export interface ProductCompareResponse {
  products: ComparedProductData[];
}

// ── AI 요약 및 추천 API ───────────────────────────────────────────

/**
 * GET /api/v1/products/{productId}/summary
 * 스웨거: ProductLine12SummaryResponse
 */
export interface ProductAiSummaryResponse {
  productId: number;
  productName: string;
  line1AiSummary: string;       // AI 3줄 요약 1번째
  line2PersonalizedMsg: string; // 맞춤형 추천 메시지
  line3AiSummary: string;       // AI 3줄 요약 3번째
}
