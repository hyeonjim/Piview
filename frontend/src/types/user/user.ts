/**
 * types/user.ts
 * 유저 도메인 타입
 */

// ── 기본 enum ─────────────────────────────────────────────────────
export type SkinType = "건성" | "지성" | "복합성" | "수부지";
export type Gender = "men" | "women";
export type AgeGroup = "10" | "20" | "30" | "40";

// ── /users/me API 응답 ────────────────────────────────────────────
// ⚠️ /users/me API 미구현 — 연동 시 실제 응답 기준으로 필드 확인 필요
// ⚠️ skinType, ageRange — 구버전 호환 필드. 연동 후 제거 예정
export interface User {
  id: number;
  provider: string;
  providerId: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null; // 카카오 프로필 이미지 URL
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  mySkinType: SkinType | null;
  exist: boolean;
  mySkinProblems: MySkinProblem[]; // ⚠️ 승찬님 ERD 확정 후 구조 수정 필요
}

// ── GET /my-cos 응답에 포함 ───────────────────────────────────────
// ⚠️ 승찬님 ERD 확정 후 구조 수정 필요
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
