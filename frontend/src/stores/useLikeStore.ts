/**
 * stores/useLikeStore.ts
 * 찜(좋아요) 전역 상태 — 페이지 간 상태 공유
 *
 * Set 대신 Record 사용 — Zustand는 Set 내부 변경을 감지하지 못해 리렌더가 트리거되지 않음
 */

import { create } from "zustand";

interface LikeStore {
  /** 찜한 제품 ID 맵 */
  likedIds: Record<string, boolean>;
  /** 서버 데이터로 초기화 — useLikedProducts 로드 후 1회 호출 */
  initFromServer: (productIds: number[]) => void;
  /** 찜 토글 — 없으면 추가, 있으면 제거 */
  toggleLike: (id: string | number) => void;
  /** 특정 제품이 찜 상태인지 확인 */
  isLiked: (id: string | number) => boolean;
}

export const useLikeStore = create<LikeStore>((set, get) => ({
  likedIds: {},

  initFromServer: (productIds) => {
    const likedIds: Record<string, boolean> = {};
    productIds.forEach((id) => {
      likedIds[String(id)] = true;
    });
    set({ likedIds });
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
}));
