/**
 * hooks/queries/useUserQuery.ts
 * 사용자 정보 TanStack Query 훅
 *
 * useUserQuery — GET /users/me 조회 + Zustand store 동기화
 */

import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { useUserStore } from "@/stores";
import { queryKeys } from "@/lib/queryKeys";

// ── GET /users/me ─────────────────────────────────────────────────

export function useUserQuery() {
  const setUser = useUserStore((s) => s.setUser);

  const query = useQuery({
    queryKey: queryKeys.user,
    queryFn: authService.getMe,
  });

  // TanStack Query v5는 onSuccess 미지원 — useEffect로 Zustand store에 동기화
  useEffect(() => {
    if (query.data) {
      setUser(query.data);
    }
  }, [query.data, setUser]);

  return query;
}
