// src/stores/useUserStore.ts
//
// ✅ ERD 변경 대응 전략:
// - User 원본 객체를 통째로 저장 → 컬럼 추가돼도 store 수정 불필요
// - 자주 쓰는 값만 selector로 꺼내서 사용

import { create } from "zustand";
import type { User, SkinType, AvoidContent } from "@/types/user";

interface UserStore {
  // ── 상태 ──────────────────────────────────────
  user: User | null;             // 로그인된 유저 전체 (ERD: User)
  avoidContents: AvoidContent[]; // 알러지 성분 목록 (ERD: AvoidContent)

  // ── 액션 ──────────────────────────────────────
  setUser: (user: User) => void;
  clearUser: () => void;

  // 피부타입만 빠르게 업데이트 (진단 결과 반영)
  setSkinType: (skinType: SkinType) => void;

  // 알러지 성분
  setAvoidContents: (list: AvoidContent[]) => void;
  addAvoidContent: (item: AvoidContent) => void;
  removeAvoidContent: (id: number) => void;
}

export const useUserStore = create<UserStore>((set) => ({
  user: null,
  avoidContents: [],

  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null, avoidContents: [] }),

  setSkinType: (skinType) =>
    set((state) => ({
      user: state.user ? { ...state.user, skinType } : null,
    })),

  setAvoidContents: (list) => set({ avoidContents: list }),

  addAvoidContent: (item) =>
    set((state) => ({ avoidContents: [...state.avoidContents, item] })),

  removeAvoidContent: (id) =>
    set((state) => ({
      avoidContents: state.avoidContents.filter((a) => a.id !== id),
    })),
}));

// ── 자주 쓰는 selector (컴포넌트에서 import해서 사용) ──
export const selectSkinType  = (s: UserStore) => s.user?.skinType ?? null;
export const selectGender    = (s: UserStore) => s.user?.gender   ?? null;
export const selectUserName  = (s: UserStore) => s.user?.name     ?? "User";
