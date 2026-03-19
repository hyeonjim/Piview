/**
 * types/product.ts
 * 제품 도메인 타입
 */

// ── GET /products API ─────────────────────────────────────────────

// GET /products 쿼리 파라미터
export interface ProductSearchParams {
  q?: string;
  bigCategoryId?: number;
  categoryId?: number;
  skinType?: string;     // "dry" | "oily" | ... — enumConvert.ts로 변환 후 전송
  tagIds?: number[];
  brandIds?: number[];
  minPrice?: number;
  maxPrice?: number;
  page?: number;         // 0-indexed, 기본값 0
  size?: number;         // 기본값 10
}

// GET /products 응답 아이템
// ⚠️ tags 현재 미구현 — null로 내려올 수 있음
export interface ProductSummaryResponse {
  productId: number;
  name: string | null;
  brandName: string | null;
  categoryName: string | null;
  imageUrl: string | null;
  skinTypes: string[];   // ["dry", "oily"] — 영문 소문자
  tags: string[] | null;
}

// GET /products 응답 전체
export interface ProductPageResponse {
  products: ProductSummaryResponse[];
  hasNext: boolean;
  page: number;
  size: number;
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
