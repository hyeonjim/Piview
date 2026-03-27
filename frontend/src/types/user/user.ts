export type SkinType = "건성" | "지성" | "복합성" | "수부지";
export type Gender = "MEN" | "WOMEN";
export type AgeGroup = "TEENS" | "TWENTIES" | "THIRTIES" | "FORTIES_PLUS";

export interface User {
  id: number;
  userId: number; 
  provider: string;
  providerId: string;
  email: string | null;
  name: string | null;
  imageUrl: string | null; 
  gender: Gender | null;
  ageGroup: AgeGroup | null;
  mySkinType: SkinType | null;
  exist: boolean;
  skinProblems: string[]; 
}

// ── useUserStore 상태 ────────
export interface AvoidContent {
  id: number;
  userId: number;
  avoidContent: string;
}

// ── GET /api/v1/users/me/disliked/ingredients 응답 ────────
export interface DislikedIngredient {
  ingredientId: number;
  nameKo: string;
  nameEn: string;
  ewgGrade: "low" | "medium" | "high" | "unknown";
}

// ── PATCH /api/v1/users/me 요청 body ───────
// 모든 필드 optional — 변경할 필드만 포함해서 전송
export interface UserProfileUpdateRequest {
  gender?: "MEN" | "WOMEN";
  ageGroup?: "TEENS" | "TWENTIES" | "THIRTIES" | "FORTIES_PLUS";
  /** API 형식: "dry" | "oily" | "combination" | "subuji" */
  mySkinType?: string;
  skinProblems?: string[];
}
