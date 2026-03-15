// src/types/user.ts

export type SkinType = "건성" | "지성" | "복합성" | "수부지";
export type Gender = "men" | "women";
export type AgeGroup = "10" | "20" | "30" | "40";

export interface User {
  id: number;
  provider: string;              // 카카오 OAuth
  providerId: string;            // ERD: provider_id
  email: string | null;
  name: string | null;
  gender: Gender | null;
  ageRange: string | null;       // 구버전 호환 ("20대", "30대" 등)
  ageGroup: AgeGroup | null;     // ERD: age_group ENUM (신규)
  skinType: SkinType | null;     // 구버전 호환
  mySkinType: SkinType | null;   // ERD: my_skin_type (신규)
  exist: boolean;                // ERD: exist → 소프트 딜리트 플래그 (신규)
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

// ⚠️ 변경: skinType 제거 (ERD Answer 테이블에 해당 컬럼 없음)
export interface Answer {
  id: number;           // ERD: answer_id
  questionId: number;
  answer: string;
}
