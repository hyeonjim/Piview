/**
 * constants/routineSteps.ts
 * 루틴 스텝 단일 정의 — 앱 전체의 루틴 스텝 정보는 여기서만 관리
 *
 * ⚠️ 백엔드 연동 시: ROUTINE_STEPS 배열을 API 응답으로 교체
 *
 * 사용처:
 *   - stores/useLocalRoutineStore.ts  → ROUTINE_STEPS, INITIAL_ROUTINE
 *   - app/(main)/home/page.tsx        → ROUTINE_STEPS
 *   - app/(main)/mypage/page.tsx      → ROUTINE_STEPS
 *   - components/features/search/AddToRoutineModal.tsx → ROUTINE_STEPS, RoutineStepKey
 */

import type { Gender } from "@/types/user";

export interface RoutineStep {
  code: string; // 스텝 코드 (CL, PR, SR, LT, CR, SC, SH)
  columnId: number; // 백엔드 RoutineColumn ID (draft API용)
  key: string; // 영문 키 (AddToRoutineModal 호환)
  label: string; // 화면 표시 라벨
  icon: string; // 이모지 아이콘
  categories: string[]; // 해당 스텝에 속하는 카테고리 목록 (mypage 필터 + 자동 추천용)
}

/** 여성용 루틴 스텝 (기본 6단계) */
export const WOMEN_ROUTINE_STEPS: RoutineStep[] = [
  {
    code: "CL",
    columnId: 1,
    key: "cleanser",
    label: "클렌저",
    icon: "🫧",
    categories: [
      "클렌징폼",
      "클렌징젤",
      "클렌징밤",
      "클렌징오일",
      "클렌징밀크",
      "클렌징로션",
      "클렌징워터",
    ],
  },
  {
    code: "PR",
    columnId: 3,
    key: "toner",
    label: "스킨/토너/패드/미스트",
    icon: "💧",
    categories: ["스킨/토너", "미스트", "토너패드"],
  },
  {
    code: "SR",
    columnId: 4,
    key: "serum",
    label: "에센스/앰플/세럼",
    icon: "✨",
    categories: ["에센스/앰플/세럼", "에센스/세럼"],
  },
  {
    code: "LT",
    columnId: 5,
    key: "lotion",
    label: "로션/에멀전",
    icon: "🧴",
    categories: ["로션/에멀젼"],
  },
  {
    code: "CR",
    columnId: 6,
    key: "cream",
    label: "크림/오일",
    icon: "🤍",
    categories: ["크림", "페이스오일"],
  },
  {
    code: "SC",
    columnId: 7,
    key: "sunscreen",
    label: "선크림",
    icon: "☀️",
    categories: ["선크림", "선스틱"],
  },
];

/** 남성용 루틴 스텝 (7단계 - 쉐이빙 포함) */
export const MEN_ROUTINE_STEPS: RoutineStep[] = [
  {
    code: "CL",
    columnId: 1,
    key: "cleanser",
    label: "클렌저",
    icon: "🫧",
    categories: [
      "클렌징폼",
      "클렌징젤",
      "클렌징밤",
      "클렌징오일",
      "클렌징밀크",
      "클렌징로션",
      "클렌징워터",
    ],
  },
  {
    code: "SH",
    columnId: 2,
    key: "shaving",
    label: "쉐이빙",
    icon: "🪒",
    categories: ["쉐이빙"],
  },
  {
    code: "PR",
    columnId: 3,
    key: "toner",
    label: "스킨/토너/패드/미스트",
    icon: "💧",
    categories: ["스킨/토너", "미스트", "토너패드"],
  },
  {
    code: "SR",
    columnId: 4,
    key: "serum",
    label: "에센스/앰플/세럼",
    icon: "✨",
    categories: ["에센스/앰플/세럼", "에센스/세럼"],
  },
  {
    code: "LT",
    columnId: 5,
    key: "lotion",
    label: "로션/에멀젼/올인원",
    icon: "🧴",
    categories: ["로션/에멀젼", "올인원"],
  },
  {
    code: "CR",
    columnId: 6,
    key: "cream",
    label: "크림",
    icon: "🤍",
    categories: ["크림"],
  },
  {
    code: "SC",
    columnId: 7,
    key: "sunscreen",
    label: "선크림",
    icon: "☀️",
    categories: ["선크림", "선스틱"],
  },
];

/**
 * 성별에 따라 루틴 스텝 반환
 * 개발 도구용 - 성별별 루틴 확인에 사용
 */
export function getRoutineSteps(gender: Gender | null): RoutineStep[] {
  return gender === "MEN" ? MEN_ROUTINE_STEPS : WOMEN_ROUTINE_STEPS;
}

/** 루틴 스텝 전체 정의 — 순서가 루틴 순서 (하위 호환용, 여성 기본) */
export const ROUTINE_STEPS: RoutineStep[] = WOMEN_ROUTINE_STEPS;

/** AddToRoutineModal에서 사용하는 스텝 키 타입 */
export type RoutineStepKey = (typeof ROUTINE_STEPS)[number]["key"];

/**
 * 루틴 스토어 초기값 — 모든 스텝을 빈 배열로 초기화
 * ⚠️ 백엔드 연동 시 삭제
 */
export const INITIAL_ROUTINE = Object.fromEntries(
  ROUTINE_STEPS.map((s) => [s.code, [] as never[]]),
);

/**
 * mypage용 코드+라벨 단순 버전 (기존 MYPAGE_ROUTINE_STEPS 대체)
 * 하위 호환을 위해 유지 — ROUTINE_STEPS에서 파생
 */
export const MYPAGE_ROUTINE_STEPS = ROUTINE_STEPS.map(({ code, label }) => ({
  code,
  label,
}));
