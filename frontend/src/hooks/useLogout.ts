/**
 * hooks/useLogout.ts
 * 로그아웃 공통 훅 — settings/page.tsx 에서 사용
 *
 * 처리 순서:
 * 1. 백엔드 /auth/logout 호출 (refreshToken 쿠키 만료)
 * 2. TanStack Query 캐시 전체 초기화 (이전 유저 데이터 잔존 방지)
 * 3. 각 Zustand store 초기화
 * 4. /splash 로 이동
 */

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { useUserStore } from "@/stores/useUserStore";
import { useSearchStore } from "@/stores/useSearchStore";
import { useRecommendStore } from "@/stores/useRecommendStore";
import { useLikeStore } from "@/stores/useLikeStore";
import { useRoutineStore } from "@/stores/useRoutineStore";

export function useLogout() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const logout = async () => {
    try {
      await authService.logout();
    } finally {
      // TanStack Query 캐시 전체 초기화 — staleTime 내 이전 유저 데이터 노출 방지
      queryClient.clear();

      // Zustand store 초기화
      useUserStore.getState().clearUser();
      useSearchStore.getState().setSearchQuery("");
      useSearchStore.getState().resetFilter();
      useRecommendStore.getState().resetPage();
      useLikeStore.getState().initFromServer([]);
      useLikeStore.getState().setPage(1);
      useRoutineStore.getState().setSelectedRoutineId(null);
      useRoutineStore.getState().resetEditMode();

      router.push("/welcome");
    }
  };

  return { logout };
}
