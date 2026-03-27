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
import { dislikedService } from "@/services/disliked";
import { useUserStore } from "@/stores";
import { queryKeys } from "@/lib/queryKeys";
import { fromSkinTypeEnum, concernDbToLabel } from "@/utils/enumConvert";
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
      setUser(normalizeUser(query.data));
      // skinProblems(DB값) → label 변환 후 concerns store 동기화
      // oauth redirect에서 이미 저장되어 있어도, 최신 API 응답으로 덮어씀
      setConcerns((query.data.skinProblems ?? []).map(concernDbToLabel));
    }
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

  return query;
}

// ── GET /users/me/disliked/ingredients ────────────────────────────

/**
 * 기피 제품에 등록된 제품의 알러지 성분 목록 조회
 * API 응답을 AvoidContent 형태로 변환하여 store에 동기화
 * → mypage 기피 성분 배지 + settings 보유 알러지 섹션에서 공통 사용
 */
export function useDislikedIngredientsQuery() {
  const setAvoidContents = useUserStore((s) => s.setAvoidContents);

  const query = useQuery({
    queryKey: queryKeys.dislikedIngredients,
    queryFn: dislikedService.getIngredients,
  });

  // nameKo → avoidContent 변환 후 store 동기화
  useEffect(() => {
    if (query.data) {
      setAvoidContents(
        query.data.map((ingredient) => ({
          id: ingredient.ingredientId,
          userId: 0,
          avoidContent: ingredient.nameKo,
        })),
      );
    }
  }, [query.data]); // eslint-disable-line react-hooks/exhaustive-deps

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
      setConcerns((updatedUser.skinProblems ?? []).map(concernDbToLabel));
      queryClient.invalidateQueries({ queryKey: queryKeys.user });
    },
  });

  // setConcerns를 함께 반환 — select/page.tsx에서 즉시 store 반영용
  return { ...mutation, setConcerns };
}
