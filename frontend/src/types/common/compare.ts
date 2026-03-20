/**
 * types/compare.ts
 * 제품 비교 모달용 타입
 * — CompareModal.tsx에 있던 CompareProduct 정의를 여기로 이동
 */

export interface CompareProduct {
  id: string | number;
  name: string;
  brand: string;
  imageUrl?: string;
  emoji?: string;
  price?: number;
  skinTypes?: string[];
  effects?: string[];
  effectScores?: Record<string, number>;
  ewgSafe?: number;
  ewgCaution?: number;
  ewgDanger?: number;
}
