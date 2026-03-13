/**
 * skinTypes.ts
 * 피부 타입, 성별, 연령대 선택 옵션
 *
 * 사용처:
 *   - src/app/(onboarding)/skin-test/select/page.tsx  → SKIN_TYPES, AGE_GROUPS, GENDER_OPTIONS, SKIN_CONCERNS, ALLERGIES
 *   - src/app/(main)/recommend/page.tsx               → SKIN_TYPE_LABELS
 */

/** 피부 타입 레이블 (필터 칩용 — 짧은 이름) */
export const SKIN_TYPE_LABELS = ["건성", "지성", "복합성", "수부지"] as const;

/** 피부 타입 선택 옵션 (아이콘 포함) */
export const SKIN_TYPES = [
  { id: "dry",         icon: "💧", label: "건성"   },
  { id: "oily",        icon: "💦", label: "지성"   },
  { id: "combination", icon: "🔀", label: "복합성" },
  { id: "dehydrated",  icon: "💧💦", label: "수부지" },
] as const;

/** 성별 선택 옵션 */
export const GENDER_OPTIONS = [
  { id: "female", icon: "👩", label: "여성" },
  { id: "male",   icon: "👨", label: "남성" },
] as const;

/** 연령대 선택 옵션 */
export const AGE_GROUPS = [
  { id: "10s",  label: "10대"    },
  { id: "20s",  label: "20대"    },
  { id: "30s",  label: "30대"    },
  { id: "40s+", label: "40대 이상" },
] as const;

/** 피부 고민 선택지 (복수 선택) */
export const SKIN_CONCERNS = [
  "여드름/트러블",
  "건조함",
  "주름/탄력",
  "색소/잡티",
  "모공",
  "블랙헤드",
  "피지",
  "수분부족",
  "민감함",
  "칙칙함",
] as const;

/** 알레르기 성분 선택지 */
export const ALLERGIES = [
  "향료",
  "알코올",
  "파라벤",
  "설페이트",
  "실리콘",
  "라놀린",
  "포름알데히드",
  "페녹시에탄올",
  "트리클로산",
  "옥시벤존",
] as const;
