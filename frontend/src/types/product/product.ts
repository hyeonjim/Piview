/**
 * types/product.ts
 * 제품 도메인 타입
 */

// ── GET /products/filters API ─────────────────────────────────────

export interface CategoryFilterDto {
  categoryId: number;
  categoryName: string;
}

export interface BigCategoryFilterDto {
  bigCategoryId: number;
  bigCategoryName: string;
  categories: CategoryFilterDto[];
}

export interface BrandFilterDto {
  brandId: number;
  brandName: string;
}

export interface TagFilterDto {
  tagId: number;
  tag: string;
}

export interface ProductFilterMetaResponse {
  bigCategories: BigCategoryFilterDto[];
  brands: BrandFilterDto[];
  tags: TagFilterDto[];
}

// ── GET /products API ─────────────────────────────────────────────

// GET /products 쿼리 파라미터
export interface ProductSearchParams {
  q?: string;
  bigCategoryId?: number;
  categoryId?: number;
  skinType?: string; // "dry" | "oily" | ... — enumConvert.ts로 변환 후 전송
  tagIds?: number[];
  brandIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  page?: number; // 0-indexed, 기본값 0
  size?: number; // 기본값 10
}

// GET /products 응답 아이템
export interface ProductSummaryResponse {
  productId: number;
  name: string | null;
  brandName: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  skinTypes: string[]; // ["dry", "oily"] — 영문 소문자
  tags: string[] | null;
  liked: boolean;
}

// ── GET /products/{productId} API ─────────────────────────────────
// ProductDetailResponse and ProductIngredientDetailResponse moved to detail.ts

// GET /products 응답 전체
export interface ProductPageResponse {
  products: ProductSummaryResponse[];
  hasNext: boolean;
  page: number;
  size: number;
  totalCount: number;
}

// ── POST /api/v1/recommendations/products API ─────────────────────────────

/** 추천 요청 DTO — 모든 필드 optional */
export interface RecommendRequestDto {
  skinType?: string;           // "dry" | "oily" | "combination" | "subuji"
  gender?: string;             // "MEN" | "WOMEN"
  concernId?: number;          // int64 — 피부 고민 ID
  targetRoutineColId?: number; // int64 — 루틴 컬럼 ID
}

/** 추천 응답 DTO — ProductSummaryResponse와 달리 tags 필드 없음 */
export interface RecommendResponseDto {
  productId: number;
  name: string;
  brandName: string;
  categoryName: string;
  imageUrl: string;
  price: number;
  volume: string;
  description: string;
  skinTypes: string[];  // ["dry", "oily"] — 영문 소문자
  concernName: string;
  liked: boolean;
}