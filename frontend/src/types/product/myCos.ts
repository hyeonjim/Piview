/**
 * types/myCos.ts
 * 보유제품 (MyCos) 관련 타입
 * — 실제 API 응답 예시 JSON 기준으로 작성
 */

// GET /my-cos 응답 아이템
// 실제 응답 예시: { id, brand, productName, category, imageUrl, topSkinType, top2SkinType }
export interface MyCosItem {
  id: number;            // myCosId (보관함 레코드 PK)
  brand: string;
  productName: string;
  category: string;
  imageUrl: string | null;
  topSkinType: string | null;   // "dry" | "oily" | "combination" | "subuji" 등
  top2SkinType: string | null;
}

// POST /my-cos 요청 body
export interface MyCosCreateRequest {
  productId: number;
}

// POST /my-cos 응답 — 생성된 myCosId (Long)
export type MyCosCreateResponse = number;
