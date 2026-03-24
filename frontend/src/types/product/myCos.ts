/**
 * types/product/myCos.ts
 * 내 제품 관리 + UI 타입
 */

// GET /my-cos 응답 — swagger: MyCosResponseDto
// { myCosId, productInfo: ProductSummaryResponse }
export interface MyCosItem {
  myCosId: number; // 보관함 레코드 PK (삭제 시 사용)
  productInfo: {
    productId: number;
    name: string;
    brandName: string;
    categoryId: number;
    categoryName: string;
    imageUrl: string | null;
    skinTypes: string[]; // 피부 타입 배열
    liked: boolean;
    tags: string[];
  };
}

// POST /my-cos/{productId} 응답 — 생성된 myCosId (Long)
export type MyCosCreateResponse = number;

// ── UI 안전 제품 타입 (null 방어 처리됨) ─────────────────────────

/**
 * UI 안전 제품 타입 (null 방어 처리됨)
 * 컴포넌트에서 안전하게 사용하기 위한 타입
 */
export interface ProductViewModel {
  id: number; // 범용 ID (productId, myCosId 등)
  name: string; // null 아님 - 매퍼에서 기본값 제공
  brand: string;
  category?: string; // 선택 필드 (비교 모달에서는 불필요)
  imageUrl: string | null; // null이면 이모지 대체
  skinTypes: string[];
  effects: string[]; // tags에서 변환
  emoji?: string;
  // 선택적 표시 데이터
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
  price?: number;
}
