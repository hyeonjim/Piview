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
  mySkinProblems: MySkinProblem[]; // ⚠️ ERD 확정 후 구조 수정 필요
}

// ── GET /my-cos 응답에 포함 ───────────────────────────────────────
// ⚠️ ERD 확정 후 구조 수정 필요
export interface MySkinProblem {
  id: number;
  userId: number;
  skinProblemId: number;
}

// ── useUserStore 상태 ─────────────────────────────────────────────
export interface AvoidContent {
  id: number;
  userId: number;
  avoidContent: string;
}
