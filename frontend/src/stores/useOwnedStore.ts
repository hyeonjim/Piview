/**
 * stores/useOwnedStore.ts
 * 보유제품 전역 상태 — 검색/추천 페이지 ↔ 마이페이지 공유
 * ⚠️ API 연동 시 toggleOwned 내에서 ownedService.toggle(product) 호출로 교체
 */

import { create } from "zustand";

// 보유 제품 최소 공통 타입 — SearchProduct/RecommendProduct 둘 다 호환
export interface OwnedProduct {
  id: string;
  brand: string;
  name: string;
  category: string;
  emoji?: string;
  imageUrl?: string | null;
  skinTypes?: string[];
}

interface OwnedStore {
  /** 보유 제품 목록 */
  ownedProducts: OwnedProduct[];
  /** 보유 토글 — 없으면 추가, 있으면 제거 */
  toggleOwned: (product: OwnedProduct) => void;
  /** 특정 제품이 보유 상태인지 확인 */
  isOwned: (id: string) => boolean;
  /** 보유 제품 제거 */
  removeOwned: (id: string) => void;
}

export const useOwnedStore = create<OwnedStore>((set, get) => ({
  ownedProducts: [],

  toggleOwned: (product) => {
    set((state) => {
      const exists = state.ownedProducts.some((p) => p.id === product.id);
      return {
        ownedProducts: exists
          ? state.ownedProducts.filter((p) => p.id !== product.id)
          : [...state.ownedProducts, product],
      };
    });
    // ⚠️ API 연동 시 아래로 교체
    // await ownedService.toggle(product.id);
  },

  isOwned: (id) => get().ownedProducts.some((p) => p.id === id),

  removeOwned: (id) =>
    set((state) => ({
      ownedProducts: state.ownedProducts.filter((p) => p.id !== id),
    })),
}));
