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

export interface RoutineStep {
  code:       string;    // 스텝 코드 (CL, PR, SR, LT, CR, SC)
  key:        string;    // 영문 키 (AddToRoutineModal 호환)
  label:      string;    // 화면 표시 라벨
  icon:       string;    // 이모지 아이콘
  categories: string[];  // 해당 스텝에 속하는 카테고리 목록 (mypage 필터 + 자동 추천용)
}

/** 루틴 스텝 전체 정의 — 순서가 루틴 순서 */
export const ROUTINE_STEPS: RoutineStep[] = [
  { code: "CL", key: "cleanser",  label: "클렌저",      icon: "🫧", categories: ["클렌저", "폼/젤/밤/오일", "클렌징폼", "클렌징젤", "클렌징밤", "클렌징오일", "클렌징밀크"] },
  { code: "PR", key: "toner",     label: "스킨/토너",   icon: "💧", categories: ["스킨/토너", "토너", "미스트", "패드"] },
  { code: "SR", key: "serum",     label: "세럼/에센스", icon: "✨", categories: ["에센스/앰플/세럼", "세럼", "에센스", "세럼/에센스"] },
  { code: "LT", key: "lotion",    label: "로션/에멀전", icon: "🧴", categories: ["로션/에멀젼", "로션", "에멀전"] },
  { code: "CR", key: "cream",     label: "크림/오일",   icon: "🤍", categories: ["크림", "페이스오일", "아이크림"] },
  { code: "SC", key: "sunscreen", label: "선크림",      icon: "☀️", categories: ["선크림/스틱", "선크림", "선스틱", "선케어"] },
];

/** AddToRoutineModal에서 사용하는 스텝 키 타입 */
export type RoutineStepKey = typeof ROUTINE_STEPS[number]["key"];

/**
 * 루틴 스토어 초기값 — 모든 스텝을 null로 초기화
 * ⚠️ 백엔드 연동 시 삭제
 */
export const INITIAL_ROUTINE = Object.fromEntries(
  ROUTINE_STEPS.map((s) => [s.code, null])
);

/**
 * mypage용 코드+라벨 단순 버전 (기존 MYPAGE_ROUTINE_STEPS 대체)
 * 하위 호환을 위해 유지 — ROUTINE_STEPS에서 파생
 */
export const MYPAGE_ROUTINE_STEPS = ROUTINE_STEPS.map(({ code, label }) => ({ code, label }));
