/**
 * stores/useLikeStore.ts
 * 찜(좋아요) 전역 상태 — 페이지 간 상태 공유 + 찜 목록 페이지 상태 유지
 *
 * Set 대신 Record 사용 — Zustand는 Set 내부 변경을 감지하지 못해 리렌더가 트리거되지 않음
 */

import { create } from "zustand";

interface LikeStore {
  /** 찜한 제품 ID 맵 */
  likedIds: Record<string, boolean>;
  /** 찜 목록 페이지 번호 — 상세 페이지 이동 후 복귀 시 유지 */
  page: number;

  /** 서버 데이터로 초기화 — useLikedProducts 로드 후 1회 호출 (전체 교체) */
  initFromServer: (productIds: number[]) => void;
  /** 검색/추천 API 응답에서 부분 동기화 — 기존 likedIds는 유지하고 받은 제품만 업데이트 */
  syncFromProducts: (products: { id: number; liked: boolean }[]) => void;
  /** 찜 토글 — 없으면 추가, 있으면 제거 */
  toggleLike: (id: string | number) => void;
  /** 특정 제품이 찜 상태인지 확인 */
  isLiked: (id: string | number) => boolean;
  /** 찜 목록 페이지 변경 */
  setPage: (page: number) => void;
}

export const useLikeStore = create<LikeStore>((set, get) => ({
  likedIds: {},
  page: 1,

  initFromServer: (productIds) => {
    const likedIds: Record<string, boolean> = {};
    productIds.forEach((id) => {
      likedIds[String(id)] = true;
    });
    set({ likedIds });
  },

  syncFromProducts: (products) => {
    set((state) => {
      const next = { ...state.likedIds };
      products.forEach(({ id, liked }) => {
        next[String(id)] = liked;
      });
      return { likedIds: next };
    });
  },

  toggleLike: (id) => {
    const key = String(id);
    set((state) => ({
      likedIds: {
        ...state.likedIds,
        [key]: !state.likedIds[key],
      },
    }));
  },

  isLiked: (id) => !!get().likedIds[String(id)],

  setPage: (page) => set({ page }),
}));
