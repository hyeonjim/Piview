/**
 * types/user/skin.ts
 * ERD: MySkin, SkinProblems
 */

// ERD: SkinProblems → 피부고민 마스터 테이블
export interface SkinProblem {
  id: number;           // ERD: skin_problem_id
  skinProblem: string;  // "여드름", "주름", "미백" 등
}

// ERD: MySkin → 유저-피부고민 매핑
export interface MySkin {
  id: number;           // ERD: myskin_id
  userId: number;
  skinProblem: string;  // ERD: skin_problem VARCHAR
  // ⚠️ ERD에서 SkinProblems와 FK 없이 텍스트 직접 저장 → BE 팀 확인 필요
}
