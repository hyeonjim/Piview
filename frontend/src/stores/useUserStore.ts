// src/stores/useUserStore.ts
//
// ✅ ERD 변경 대응 전략:
// - User 원본 객체를 통째로 저장 → 컬럼 추가돼도 store 수정 불필요
// - 자주 쓰는 값만 selector로 꺼내서 사용

import { create } from "zustand";
import type { User, SkinType, AvoidContent } from "@/types/user";

interface UserStore {
  // ── 상태 ──────────────────────────────────────
  user: User | null; // 로그인된 유저 전체 (ERD: User)
  accessToken: string | null; // Authorization 헤더용 JWT (일반 쿠키에서 꺼내 저장)
  avoidContents: AvoidContent[]; // 알러지 성분 목록 (ERD: AvoidContent)
  skinType: SkinType | null; // user 없이도 피부타입 저장 가능한 독립 필드
  concerns: string[]; // 피부 고민 목록 — ⚠️ API 연동 시 mySkinProblemsService로 교체

  // ── 액션 ──────────────────────────────────────
  setUser: (user: User) => void;
  setAccessToken: (token: string) => void;
  clearUser: () => void;

  // 피부타입만 빠르게 업데이트 (진단 결과 반영)
  // skinType(구버전 호환) + mySkinType(ERD 신규) 두 필드 동시 업데이트
  setSkinType: (skinType: SkinType) => void;

  // 알러지 성분
  setAvoidContents: (list: AvoidContent[]) => void;
  addAvoidContent: (item: AvoidContent) => void;
  removeAvoidContent: (id: number) => void;

  // 피부 고민
  setConcerns: (concerns: string[]) => void;

  // 개발 도구 - 성별별 루틴 확인용 (나중에 삭제 예정)
  toggleGenderForTest: () => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  accessToken: null,
  avoidContents: [],
  skinType: null,
  concerns: [],

  setUser: (user) => set({ user }),
  setAccessToken: (token) => set({ accessToken: token }),

  // accessToken + user + avoidContents 모두 초기화
  clearUser: () =>
    set({
      user: null,
      accessToken: null,
      avoidContents: [],
      skinType: null,
      concerns: [],
    }),

  // skinType 독립 필드 + user 내 mySkinType 필드 동시 업데이트
  // user가 null이어도 독립 필드에 저장되므로 설정 페이지에서 항상 반영됨
  setSkinType: (skinType) =>
    set((state) => ({
      skinType,
      user: state.user ? { ...state.user, mySkinType: skinType } : null,
    })),

  setAvoidContents: (list) => set({ avoidContents: list }),

  setConcerns: (concerns) => set({ concerns }),

  addAvoidContent: (item) =>
    set((state) => ({ avoidContents: [...state.avoidContents, item] })),

  removeAvoidContent: (id) =>
    set((state) => ({
      avoidContents: state.avoidContents.filter(
        (avoidContent) => avoidContent.id !== id,
      ),
    })),

  // 개발 도구 - 성별 토글 (성별별 루틴 확인용, 나중에 삭제 예정)
  toggleGenderForTest: () =>
    set((state) => ({
      user: state.user
        ? {
            ...state.user,
            gender: state.user.gender === "MEN" ? "WOMEN" : "MEN",
          }
        : null,
    })),
}));

// ── 자주 쓰는 selector (컴포넌트에서 import해서 사용) ──
// mySkinType(user) 우선, 없으면 skinType(독립 필드) 폴백
export const selectSkinType = (s: UserStore) =>
  s.user?.mySkinType ?? s.skinType ?? null;
export const selectGender = (s: UserStore) => s.user?.gender ?? null;
export const selectUserName = (s: UserStore) => s.user?.name ?? "User";
export const selectAccessToken = (s: UserStore) => s.accessToken;
