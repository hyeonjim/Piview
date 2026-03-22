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

export interface ProductIngredientDetailResponse {
  position: number;
  nameKo: string | null;
  nameEn: string | null;
  ewgGrade: "low" | "medium" | "high" | "unknown" | null;
  functions: string | null;
  isAllergen: boolean;
}

export interface ProductDetailResponse {
  productId: number;
  imageUrl: string | null;
  brandName: string | null;
  productName: string | null;
  categoryName?: string | null; // 스웨거 미정의 — 백엔드 확인 필요
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

// GET /products 응답 전체
export interface ProductPageResponse {
  products: ProductSummaryResponse[];
  hasNext: boolean;
  page: number;
  size: number;
  totalCount: number;
}

// ── UI 공용 타입 ──────────────────────────────────────────────────

// 보유제품 store + OwnedTab 공용 최소 타입
// ⚠️ API 연동 시 MyCosItem(types/myCos.ts)으로 교체 예정
export interface OwnedProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  emoji?: string;
  skinTypes?: string[];
}
