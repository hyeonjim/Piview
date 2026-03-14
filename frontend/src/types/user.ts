// src/types/user.ts

export type SkinType = "건성" | "지성" | "복합성" | "수부지";
export type Gender = "female" | "male";

export interface User {
  id: number;
  provider: string;       // 카카오 OAuth
  providerId: string;
  email: string | null;
  name: string | null;
  gender: Gender | null;
  ageRange: string | null; // "20대", "30대" 등
  skinType: SkinType | null;
  mySkinProblems: MySkinProblem[]; // 피부고민 (N:M)
}

// 피부고민 (ERD: SkinProblems)
export interface SkinProblem {
  id: number;
  skinProblem: string; // "여드름", "주름" 등
}

// 유저 ↔ 피부고민 매핑 (ERD: MySkinProblems)
export interface MySkinProblem {
  id: number;
  userId: number;
  skinProblemId: number;
  skinProblem?: SkinProblem;
}

// 알러지 성분 (ERD: AvoidContent)
export interface AvoidContent {
  id: number;
  userId: number;
  avoidContent: string;
}

// 피부 진단 퀴즈 (ERD: TypeQuestions / Answer)
export interface TypeQuestion {
  id: number;
  question: string;
}

export interface Answer {
  id: number;
  questionId: number;
  answer: string;
  skinType: SkinType;
}
