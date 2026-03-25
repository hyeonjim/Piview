/**
 * utils/enumConvert.ts
 * 프론트 ↔ 백엔드 enum 변환 유틸
 *
 * SkinType: 한글 ("건성") ↔ 백엔드 ("dry" | "DRY")
 * Gender/AgeGroup: 백엔드 형식 그대로 사용 ("MEN" | "WOMEN", "TEENS" | "TWENTIES" 등)
 *
 * ⚠️ API 연동 전 반드시 이 유틸을 먼저 작성할 것 (모든 연동의 선행 조건)
 */

import type { SkinType } from "@/types/user";

// ── 프론트 → 백엔드 ──────────────────────────────────────────────

/** "건성" | "지성" | "복합성" | "수부지" → "dry" | "oily" | "combination" | "subuji"
 *  GET /products skinType 파라미터용 (소문자)
 */
export const toSkinTypeParam = (skinType: SkinType): string => {
  const map: Record<SkinType, string> = {
    건성: "dry",
    지성: "oily",
    복합성: "combination",
    수부지: "subuji",
  };
  return map[skinType] ?? skinType;
};

/** "건성" | "지성" | "복합성" | "수부지" → "dry" | "oily" | "combination" | "subuji"
 *  POST /skin/surveys gender/ageGroup/skinType 필드용
 */
export const toSkinTypeEnum = (skinType: SkinType): string => {
  const map: Record<SkinType, string> = {
    건성: "dry",
    지성: "oily",
    복합성: "combination",
    수부지: "subuji",
  };
  return map[skinType] ?? skinType;
};

// ── 백엔드 → 프론트 ──────────────────────────────────────────────

/** "DRY" | "OILY" | ... → "건성" | "지성" | ...
 *  피부진단 결과 수신 후 useUserStore.setSkinType 저장용
 */
export const fromSkinTypeEnum = (skinType: string): SkinType => {
  const map: Record<string, SkinType> = {
    DRY: "건성",
    OILY: "지성",
    COMBINATION: "복합성",
    SUBUJI: "수부지",
    // GET /my-cos topSkinType 소문자 대응
    dry: "건성",
    oily: "지성",
    combination: "복합성",
    subuji: "수부지",
  };
  return map[skinType] ?? (skinType as SkinType);
};

// ── 피부 고민 label ↔ DB값 양방향 매핑 ───────────────────────────
// 백엔드 UserProfileService.createSkinProblemMappings() 기준
// 설문 문구(settings 입력) → DB 저장값(GET /users/me 응답)
//
// 변환이 필요한 것만 포함 (동일한 값은 매핑 불필요)
// 여드름, 미백, 피지, 블랙헤드, 각질 → DB값 동일하므로 제외

const CONCERN_DB_TO_LABEL: Record<string, string> = {
  색소침착: "기미/주근깨/잡티",
  안티에이징: "주름/탄력",
  수분: "속건조",
  진정: "홍조",
};

const CONCERN_LABEL_TO_DB: Record<string, string> = {
  "기미/주근깨/잡티": "색소침착",
  "주름/탄력": "안티에이징",
  속건조: "수분",
  홍조: "진정",
};

/** DB값 → 화면 표시 label 변환 (매핑 없으면 원본 그대로) */
export const concernDbToLabel = (dbValue: string): string =>
  CONCERN_DB_TO_LABEL[dbValue] ?? dbValue;

/** 화면 표시 label → DB값 변환 (매핑 없으면 원본 그대로) */
export const concernLabelToDb = (label: string): string =>
  CONCERN_LABEL_TO_DB[label] ?? label;
