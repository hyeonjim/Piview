/**
 * hooks/queries/useUserQuery.ts
 * 사용자 정보 TanStack Query 훅
 *
 * useUserQuery — GET /users/me 조회 + Zustand store 동기화
 * useUpdateProfile — PATCH /users/me 뮤테이션
 */

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authService } from "@/services/auth";
import { useUserStore } from "@/stores";
import { queryKeys } from "@/lib/queryKeys";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import type { User, UserProfileUpdateRequest } from "@/types/user";

/**
 * API 응답 User 객체를 프론트 표시 형식으로 정규화
 * - mySkinType: API 영문 enum("dry") → 한글("건성") 변환
 * - 정규화 이유: 백엔드는 "dry"|"oily" 형식, 프론트 store는 "건성"|"지성" 형식
 */
function normalizeUser(apiUser: User): User {
  return {
    ...apiUser,
    mySkinType: apiUser.mySkinType
      ? fromSkinTypeEnum(apiUser.mySkinType as string)
      : null,
  };
}

// ── GET /users/me ─────────────────────────────────────────────────

export function useUserQuery() {
  const setUser = useUserStore((s) => s.setUser);
  const setConcerns = useUserStore((s) => s.setConcerns);

  const query = useQuery({
    queryKey: queryKeys.user,
    queryFn: authService.getMe,
  });

  // TanStack Query v5는 onSuccess 미지원 — useEffect로 Zustand store에 동기화
  useEffect(() => {
    if (query.data) {
      // mySkinType 영문→한글 변환 후 store 저장
      setUser(normalizeUser(query.data));
      // skinProblems(string[]) → concerns store 동기화
      setConcerns(query.data.skinProblems ?? []);
    }
  }, [query.data, setUser, setConcerns]);

  return query;
}

// ── PATCH /users/me ───────────────────────────────────────────────

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useUserStore((s) => s.setUser);
  const setConcerns = useUserStore((s) => s.setConcerns);

  const mutation = useMutation({
    mutationFn: (body: UserProfileUpdateRequest) =>
      authService.updateProfile(body),

    // 성공 시 mySkinType 변환 + store 업데이트 + TanStack Query 캐시 무효화
    onSuccess: (updatedUser) => {
      setUser(normalizeUser(updatedUser));
      setConcerns(updatedUser.skinProblems ?? []);
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });

  // setConcerns를 함께 반환 — select/page.tsx에서 즉시 store 반영용
  return { ...mutation, setConcerns };
}
