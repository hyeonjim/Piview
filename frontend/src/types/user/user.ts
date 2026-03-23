/**
 * types/user.ts
 * 유저 도메인 타입
 */

// ── 기본 enum ─────────────────────────────────────────────────────
export type SkinType = "건성" | "지성" | "복합성" | "수부지";
export type Gender = "MEN" | "WOMEN";
export type AgeGroup = "TEENS" | "TWENTIES" | "THIRTIES" | "FORTIES_PLUS";

// ── /users/me API 응답 ────────────────────────────────────────────
export interface User {
  id: number;
  userId: number; // 백엔드 API에서 userId로 반환
  provider: string;
  providerId: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null; // 카카오 프로필 이미지 URL
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  mySkinType: SkinType | null;
  exist: boolean;
  skinProblems: string[]; // API 응답 형식 — 백엔드 SkinProblemMapper 키값 배열
}

// ── useUserStore 상태 ─────────────────────────────────────────────
export interface AvoidContent {
  id: number;
  userId: number;
  avoidContent: string;
}

// ── PATCH /api/v1/users/me 요청 body ──────────────────────────────
// 모든 필드 optional — 변경할 필드만 포함해서 전송
export interface UserProfileUpdateRequest {
  gender?: "MEN" | "WOMEN";
  ageGroup?: "TEENS" | "TWENTIES" | "THIRTIES" | "FORTIES_PLUS";
  /** API 형식: "dry" | "oily" | "combination" | "subuji" */
  mySkinType?: string;
  skinProblems?: string[];
}
