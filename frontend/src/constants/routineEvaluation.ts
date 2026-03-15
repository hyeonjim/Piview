/**
 * routineEvaluation.ts
 * 루틴 종합점수 → 평가 텍스트·색상 매핑
 *
 * 사용처:
 *   - src/app/(main)/mypage/page.tsx
 */

// colors.ts 의존성 제거 — CSS 변수로 직접 참조
const COLOR_BRAND     = "var(--color-brand)";
const COLOR_TEXT_MUTED = "var(--color-text-muted)";

export interface RoutineEvaluation {
  text:  string;
  color: string;
}

export function getRoutineEvaluation(avgScore: number, count: number): RoutineEvaluation {
  if (count === 0)      return { text: "루틴에 제품을 추가해보세요! 추천 버튼으로 최적의 제품을 찾아드려요.", color: COLOR_TEXT_MUTED };
  if (avgScore >= 92)   return { text: "완벽한 루틴! AI 분석 결과 내 피부에 최적화된 조합이에요.",          color: "#E65100" };
  if (avgScore >= 82)   return { text: "훌륭한 루틴이에요. 피부 개선 효과가 충분히 기대됩니다.",            color: "#1D4ED8" };
  if (avgScore >= 72)   return { text: "좋은 루틴이에요. 피부 타입 특화 제품을 추가하면 더욱 완벽해져요.",  color: "#065F46" };
  return                       { text: "루틴 업그레이드 여지가 있어요. 맞춤 추천 탭을 확인해보세요.",       color: "#9D174D" };
}

/** 루틴 점수 → 막대 컬러 */
export function getScoreBarColor(score: number): string {
  if (score >= 90) return COLOR_BRAND;
  if (score >= 80) return "#5E6E48";
  if (score >= 70) return "#8A7B64";
  return COLOR_TEXT_MUTED;
}
