/**
 * hooks/useWishlist.ts
 *
 * 찜(좋아요) 상태 관리.
 * - 로컬 Set으로 optimistic UI 제공
 * - 실제 API 연동 시 toggleWishlist 내부에서 호출
 *
 * 사용법:
 *   const { wishlist, toggleWishlist, isWished } = useWishlist(initialIds);
 */

import { useState, useCallback } from "react";

export function useWishlist(initialIds: (string | number)[] = []) {
  const [wishlist, setWishlist] = useState<Set<string | number>>(
    new Set(initialIds)
  );

  const toggleWishlist = useCallback((id: string | number) => {
    setWishlist((prev) => {
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

  const isWished = useCallback(
    (id: string | number) => wishlist.has(id),
    [wishlist]
  );

  return { wishlist, toggleWishlist, isWished };
}
