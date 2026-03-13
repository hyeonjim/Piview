/**
 * routineSteps.ts
 * 루틴 스텝 구조 정의 (카테고리 코드, 아이콘, 필수 여부)
 * → 앱의 루틴 구성 방식 자체를 정의하는 UI 상수. DB 교체 대상 아님.
 *
 * 사용처:
 *   - src/app/(main)/routine/page.tsx  → ROUTINE_STEPS, CAT_ICONS
 *   - src/app/(main)/mypage/page.tsx   → ROUTINE_STEPS (코드/라벨만 사용)
 */

export interface RoutineStep {
  id:       string;
  label:    string;
  category: string;
  icon:     string;
  required: boolean;
}

/** 루틴 스텝 전체 정의 */
export const ROUTINE_STEPS: RoutineStep[] = [
  { id: "cleanser",  label: "클렌저",     category: "클렌저",  icon: "🫧", required: true  },
  { id: "toner",     label: "토너/스킨",  category: "토너",    icon: "💧", required: true  },
  { id: "serum",     label: "세럼/에센스",category: "세럼",    icon: "✨", required: false },
  { id: "cream",     label: "크림/오일",  category: "크림",    icon: "🤍", required: true  },
  { id: "sunscreen", label: "선크림",     category: "선크림",  icon: "☀️", required: true  },
  { id: "eyecream",  label: "아이크림",   category: "아이크림",icon: "👁️", required: false },
  { id: "mask",      label: "마스크팩",   category: "마스크",  icon: "🎭", required: false },
];

/** 카테고리 → 2자리 코드 맵 (루틴 카드 아이콘 텍스트용) */
export const CAT_ICONS: Record<string, string> = {
  클렌저:   "CL",
  토너:     "TO",
  세럼:     "SR",
  크림:     "CR",
  선크림:   "SC",
  아이크림: "EC",
  마스크:   "MK",
};

/**
 * mypage용 루틴 스텝 (코드 + 라벨 단순 버전)
 * routine/page.tsx의 ROUTINE_STEPS와 별도로 관리
 * → 나중에 유저 루틴 API 연동 시 삭제
 */
export const MYPAGE_ROUTINE_STEPS = [
  { code: "CL", label: "클렌저"              },
  { code: "PR", label: "스킨/토너/미스트/패드" },
  { code: "SR", label: "세럼/에센스/앰플"     },
  { code: "LT", label: "로션/에멀전"          },
  { code: "CR", label: "크림/오일"            },
  { code: "SC", label: "선크림"              },
] as const;
