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
