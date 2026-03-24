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

export interface RoutineStepCategory {
  categoryId: number;
  bigCategoryId: number;
  name: string;
}

export interface RoutineStep {
  code: string;                    // 스텝 코드 (CL, PR, SR, LT, CR, SC, SH)
  columnId: number;                // 백엔드 RoutineColumn ID
  label: string;                   // 화면 표시 라벨
  icon: string;                    // 이모지 아이콘
  categories: RoutineStepCategory[]; // 스텝에 속하는 카테고리 (ID 기반)
}

/**
 * 여성용 루틴 스텝 (6단계)
 * 스킨케어(bigCategoryId:1), 클렌징(2), 선케어(3) 카테고리만 포함
 * 남성화장품(bigCategoryId:4) 제외
 */
export const WOMEN_ROUTINE_STEPS: RoutineStep[] = [
  {
    code: "CL",
    columnId: 1,
    label: "클렌저",
    icon: "🫧",
    categories: [
      { categoryId: 8,  bigCategoryId: 2, name: "클렌징폼"    },
      { categoryId: 9,  bigCategoryId: 2, name: "클렌징젤"    },
      { categoryId: 10, bigCategoryId: 2, name: "클렌징밤"    },
      { categoryId: 11, bigCategoryId: 2, name: "클렌징오일"  },
      { categoryId: 12, bigCategoryId: 2, name: "클렌징워터"  },
      { categoryId: 13, bigCategoryId: 2, name: "클렌징로션"  },
    ],
  },
  {
    code: "PR",
    columnId: 3,
    label: "스킨/토너/패드/미스트",
    icon: "💧",
    categories: [
      { categoryId: 1, bigCategoryId: 1, name: "스킨/토너" },
      { categoryId: 7, bigCategoryId: 1, name: "토너패드"  },
      { categoryId: 5, bigCategoryId: 1, name: "미스트"    },
    ],
  },
  {
    code: "SR",
    columnId: 4,
    label: "에센스/앰플/세럼",
    icon: "✨",
    categories: [
      { categoryId: 3, bigCategoryId: 1, name: "에센스/앰플/세럼" },
    ],
  },
  {
    code: "LT",
    columnId: 5,
    label: "로션/에멀전",
    icon: "🧴",
    categories: [
      { categoryId: 2, bigCategoryId: 1, name: "로션/에멀젼" },
    ],
  },
  {
    code: "CR",
    columnId: 6,
    label: "크림/오일",
    icon: "🤍",
    categories: [
      { categoryId: 4, bigCategoryId: 1, name: "크림"      },
      { categoryId: 6, bigCategoryId: 1, name: "페이스오일" },
    ],
  },
  {
    code: "SC",
    columnId: 7,
    label: "선크림",
    icon: "☀️",
    categories: [
      { categoryId: 14, bigCategoryId: 3, name: "선크림" },
      { categoryId: 15, bigCategoryId: 3, name: "선스틱" },
    ],
  },
];

/**
 * 남성용 루틴 스텝 (7단계 — 쉐이빙 포함)
 * 스텝별로 일반 카테고리(스킨케어/클렌징/선케어) + 남성화장품(bigCategoryId:4) 동시 포함
 */
export const MEN_ROUTINE_STEPS: RoutineStep[] = [
  {
    code: "CL",
    columnId: 1,
    label: "클렌저",
    icon: "🫧",
    categories: [
      { categoryId: 8,  bigCategoryId: 2, name: "클렌징폼"   },
      { categoryId: 9,  bigCategoryId: 2, name: "클렌징젤"   },
      { categoryId: 10, bigCategoryId: 2, name: "클렌징밤"   },
      { categoryId: 11, bigCategoryId: 2, name: "클렌징오일" },
      { categoryId: 12, bigCategoryId: 2, name: "클렌징워터" },
      { categoryId: 13, bigCategoryId: 2, name: "클렌징로션" },
    ],
  },
  {
    code: "SH",
    columnId: 2,
    label: "쉐이빙",
    icon: "🪒",
    categories: [
      { categoryId: 22, bigCategoryId: 4, name: "쉐이빙" },
    ],
  },
  {
    code: "PR",
    columnId: 3,
    label: "스킨/토너/패드/미스트",
    icon: "💧",
    categories: [
      { categoryId: 1,  bigCategoryId: 1, name: "스킨/토너" },
      { categoryId: 7,  bigCategoryId: 1, name: "토너패드"  },
      { categoryId: 5,  bigCategoryId: 1, name: "미스트"    },
      { categoryId: 16, bigCategoryId: 4, name: "스킨/토너" },
    ],
  },
  {
    code: "SR",
    columnId: 4,
    label: "에센스/앰플/세럼",
    icon: "✨",
    categories: [
      { categoryId: 3,  bigCategoryId: 1, name: "에센스/앰플/세럼" },
      { categoryId: 21, bigCategoryId: 4, name: "에센스/세럼"      },
    ],
  },
  {
    code: "LT",
    columnId: 5,
    label: "로션/에멀젼/올인원",
    icon: "🧴",
    categories: [
      { categoryId: 2,  bigCategoryId: 1, name: "로션/에멀젼" },
      { categoryId: 17, bigCategoryId: 4, name: "로션/에멀젼" },
      { categoryId: 19, bigCategoryId: 4, name: "올인원"      },
    ],
  },
  {
    code: "CR",
    columnId: 6,
    label: "크림",
    icon: "🤍",
    categories: [
      { categoryId: 4,  bigCategoryId: 1, name: "크림" },
      { categoryId: 6,  bigCategoryId: 1, name: "페이스오일" },
      { categoryId: 18, bigCategoryId: 4, name: "크림" },
    ],
  },
  {
    code: "SC",
    columnId: 7,
    label: "선크림",
    icon: "☀️",
    categories: [
      { categoryId: 14, bigCategoryId: 3, name: "선크림" },
      { categoryId: 15, bigCategoryId: 3, name: "선스틱" },
      { categoryId: 20, bigCategoryId: 4, name: "선크림" },
    ],
  },
];

/** 성별에 따라 루틴 스텝 반환 */
export function getRoutineSteps(gender: Gender | null): RoutineStep[] {
  return gender === "MEN" ? MEN_ROUTINE_STEPS : WOMEN_ROUTINE_STEPS;
}

/** 루틴 스텝 전체 정의 — 여성 기본값 (home/page.tsx에서 columnId 매칭용) */
export const ROUTINE_STEPS: RoutineStep[] = WOMEN_ROUTINE_STEPS;
