/**
 * types/user/allergen.ts
 * ERD의 알러지 관련 테이블 두 개를 분리
 *
 * UserAllergen = 시스템 제공 표준 알러지 선택
 * MyAvoidContent = 유저 직접 입력 기피 성분 (자유 입력)
 */

// ERD: Allergens → 표준 알러지 성분 마스터
export interface Allergen {
  id: number;            // ERD: allergen_id
  nameKo: string;
  nameEn: string | null;
}

// ERD: UserAllergen → 유저가 선택한 알러지 성분
export interface UserAllergen {
  id: number;            // ERD: user_allergen_id
  userId: number;
  allergenId: number;
  allergen?: Allergen;
}

// ERD: MyAvoidContri → 유저가 직접 입력한 기피 성분
export interface MyAvoidContent {
  key: string;           // ERD: Key(VARCHAR PK)
  userId: number;
  avoidContent: string;  // ERD: avoid_contri → 성분명만 저장
}
