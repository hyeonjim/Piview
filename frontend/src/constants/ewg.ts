/**
 * ewg.ts
 * EWG 안전 등급 색상 기준 및 스타일 유틸
 * → UI 표현 규칙. DB 교체 대상 아님.
 *
 * 사용처:
 *   - src/app/(main)/recommend/page.tsx   → getEwgStyle
 *   - src/app/product/[id]/page.tsx       → getEwgStyle, EWG_LABELS
 */

export interface EwgStyle {
  bg:   string; // CSS 변수
  text: string; // CSS 변수
  bar:  string; // CSS 변수 (프로그레스 바용)
}

/**
 * EWG 점수 → 색상 스타일 반환
 * 1~2: 안전 (safe), 3~6: 주의 (caution), 7+: 위험 (danger)
 */
export function getEwgStyle(ewg: number): EwgStyle {
  if (ewg <= 2) return {
    bg:   "var(--color-ewg-safe-bg)",
    text: "var(--color-ewg-safe)",
    bar:  "var(--color-ewg-safe-bar)",
  };
  if (ewg <= 6) return {
    bg:   "var(--color-ewg-caution-bg)",
    text: "var(--color-ewg-caution)",
    bar:  "var(--color-ewg-caution-bar)",
  };
  return {
    bg:   "var(--color-ewg-danger-bg)",
    text: "var(--color-ewg-danger)",
    bar:  "var(--color-ewg-danger-bar)",
  };
}

/** EWG 등급 한글 레이블 */
export const EWG_LABELS: Record<string, string> = {
  safe:    "안전",
  caution: "주의",
  danger:  "위험",
  unknown: "미확인",
};
