/**
 * hooks/useLike.ts
 * 찜(좋아요) 상태 관리 — Zustand 전역 스토어 래퍼
 *
 * 페이지 간 상태 공유를 위해 useLikeStore를 사용합니다.
 * (기존 로컬 useState 방식에서 전역 스토어 방식으로 전환)
 *
 * 사용법:
 *   const { likeList, toggleLike, isLiked } = useLike();
 */

import { useLikeStore } from "@/stores/useLikeStore";

export function useLike() {
  const { likedIds, toggleLike, isLiked } = useLikeStore();

  return {
    /** 찜한 제품 ID Record */
    likeList: likedIds,
    toggleLike,
    isLiked,
  };
}
