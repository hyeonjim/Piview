/**
 * hooks/useLike.ts
 *
 * 찜(좋아요) 상태 관리.
 * - 로컬 Set으로 optimistic UI 제공
 * - 실제 API 연동 시 toggleLike 내부에서 호출
 *
 * 사용법:
 *   const { likeList, toggleLike, isLiked } = useLike(initialIds);
 */

import { useState, useCallback } from "react";

export function useLike(initialIds: (string | number)[] = []) {
  const [likeList, setLikeList] = useState<Set<string | number>>(
    new Set(initialIds)
  );

  const toggleLike = useCallback((id: string | number) => {
    setLikeList((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });

    // TODO: API 연동 시 여기서 호출
    // await likeProduct(id) / unlikeProduct(id)
  }, []);

  const isLiked = useCallback(
    (id: string | number) => likeList.has(id),
    [likeList]
  );

  return { likeList, toggleLike, isLiked };
}
