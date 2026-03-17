/**
 * stores/useLikeStore.ts
 * 찜(좋아요) 전역 상태 — 페이지 간 상태 공유
 * ⚠️ API 연동 시 toggleLike 내에서 likeService.toggle(id) 호출로 교체
 */

import { create } from "zustand";

interface LikeStore {
  /** 찜한 제품 ID 집합 */
  likedIds: Set<string | number>;
  /** 찜 토글 — 없으면 추가, 있으면 제거 */
  toggleLike: (id: string | number) => void;
  /** 특정 제품이 찜 상태인지 확인 */
  isLiked: (id: string | number) => boolean;
}

export const useLikeStore = create<LikeStore>((set, get) => ({
  likedIds: new Set(),

  toggleLike: (id) => {
    set((state) => {
      const next = new Set(state.likedIds);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return { likedIds: next };
    });
    // ⚠️ API 연동 시 아래로 교체
    // await likeService.toggleLike(id);
  },

  isLiked: (id) => get().likedIds.has(id),
}));
