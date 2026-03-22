/**
 * types/product/myCos.ts
 * 내 제품 관리 + UI 타입
 */

// ── 기존 타입 (유지) ──────────────────────────────────────────────

// GET /my-cos 응답 아이템
// 실제 응답 예시: { id, brand, productName, category, imageUrl, topSkinType, top2SkinType }
export interface MyCosItem {
  id: number; // myCosId (보관함 레코드 PK)
  productId?: number; // 상품 ID — 백엔드 응답에 포함 시 사용
  brand: string;
  productName: string;
  category: string;
  imageUrl: string | null;
  topSkinType: string | null;
  top2SkinType: string | null;
}

// POST /my-cos/{productId} 응답 — 생성된 myCosId (Long)
export type MyCosCreateResponse = number;

// ── 새로 추가: MyCosProduct (MyCosItem 대체용) ─────────────────────

/**
 * MyCos 제품 타입 (GET /my-cos)
 * swagger: MyCosResponseDto 기반
 * MyCosItem과 호환되지만 더 명확한 타입
 */
export interface MyCosProduct {
  id: number; // myCosId
  productId: number;
  brand: string;
  productName: string;
  category: string;
  imageUrl: string | null;
  topSkinType: string | null;
  top2SkinType: string | null;
}

// ── 새로 추가: ProductViewModel (UI 안전 타입) ────────────────────

/**
 * UI 안전 제품 타입 (null 방어 처리됨)
 * 컴포넌트에서 안전하게 사용하기 위한 타입
 * OwnedProduct 대체용
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

// ── OwnedProduct (deprecated) ─────────────────────────────────────

/**
 * @deprecated UI용은 ProductViewModel, API 데이터용은 MyCosProduct 사용
 * 다음 스프린트에서 제거 예정
 */
export interface OwnedProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  emoji?: string;
  skinTypes?: string[];
}
