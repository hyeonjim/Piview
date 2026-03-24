/**
 * constants/routineSteps.ts
 * 루틴 스텝 단일 정의 — 앱 전체의 루틴 스텝 정보는 여기서만 관리
 *
 * 사용처:
 *   - app/(main)/home/page.tsx             → ROUTINE_STEPS
 *   - app/product/[id]/page.tsx            → getRoutineSteps
 *   - components/features/mypage/RoutineTab.tsx     → getRoutineSteps
 *   - components/features/mypage/RoutineAddModal.tsx → getRoutineSteps
 */

import type { Gender } from "@/types/user";

export interface RoutineStep {
  code: string;      // 스텝 코드 (CL, PR, SR, LT, CR, SC, SH)
  columnId: number;  // 백엔드 RoutineColumn ID
  key: string;       // 영문 키
  label: string;     // 화면 표시 라벨
  categories: string[]; // 해당 스텝에 속하는 카테고리 목록
}

/** 여성용 루틴 스텝 (기본 6단계) */
export const WOMEN_ROUTINE_STEPS: RoutineStep[] = [
  {
    code: "CL",
    columnId: 1,
    key: "cleanser",
    label: "클렌저",
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
    categories: ["스킨/토너", "미스트", "토너패드"],
  },
  {
    code: "SR",
    columnId: 4,
    key: "serum",
    label: "에센스/앰플/세럼",
    categories: ["에센스/앰플/세럼", "에센스/세럼"],
  },
  {
    code: "LT",
    columnId: 5,
    key: "lotion",
    label: "로션/에멀전",
    categories: ["로션/에멀젼"],
  },
  {
    code: "CR",
    columnId: 6,
    key: "cream",
    label: "크림/오일",
    categories: ["크림", "페이스오일"],
  },
  {
    code: "SC",
    columnId: 7,
    key: "sunscreen",
    label: "선크림",
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
    categories: ["쉐이빙"],
  },
  {
    code: "PR",
    columnId: 3,
    key: "toner",
    label: "스킨/토너/패드/미스트",
    categories: ["스킨/토너", "미스트", "토너패드"],
  },
  {
    code: "SR",
    columnId: 4,
    key: "serum",
    label: "에센스/앰플/세럼",
    categories: ["에센스/앰플/세럼", "에센스/세럼"],
  },
  {
    code: "LT",
    columnId: 5,
    key: "lotion",
    label: "로션/에멀젼/올인원",
    categories: ["로션/에멀젼", "올인원"],
  },
  {
    code: "CR",
    columnId: 6,
    key: "cream",
    label: "크림",
    categories: ["크림"],
  },
  {
    code: "SC",
    columnId: 7,
    key: "sunscreen",
    label: "선크림",
    categories: ["선크림", "선스틱"],
  },
];

/** 성별에 따라 루틴 스텝 반환 */
export function getRoutineSteps(gender: Gender | null): RoutineStep[] {
  return gender === "MEN" ? MEN_ROUTINE_STEPS : WOMEN_ROUTINE_STEPS;
}

/** 루틴 스텝 전체 정의 — 여성 기본값 (home/page.tsx에서 columnId 매칭용) */
export const ROUTINE_STEPS: RoutineStep[] = WOMEN_ROUTINE_STEPS;
