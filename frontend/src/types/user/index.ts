/**
 * types/user/index.ts
 * ERD: User 테이블 기준
 *
 * 변경점:
 * - ageRange → ageGroup (ERD: age_group ENUM)
 * - skinType → mySkinType (ERD: my_skin_type)
 * - exist 필드 추가 (ERD: exist boolean → 소프트 딜리트)
 */

export type SkinType = "건성" | "지성" | "복합성" | "수부지";
// ⚠️ ERD COMMENT는 "men, women"이지만 현재 타입: male/female → BE 팀 확인 필요
export type Gender = "male" | "female";
export type AgeGroup = "10" | "20" | "30" | "40";

// ERD: User
export interface User {
  id: number;
  email: string | null;
  provider: string;           // 카카오
  name: string | null;
  providerId: string;         // ERD: provider_id
  gender: Gender | null;
  exist: boolean;             // ERD: exist → 소프트 딜리트 플래그
  mySkinType: SkinType | null; // ERD: my_skin_type
  ageGroup: AgeGroup | null;   // ERD: age_group
}
