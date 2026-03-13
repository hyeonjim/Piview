/**
 * colors.ts
 * 앱 전역 브랜드 컬러 & 시맨틱 컬러 상수
 *
 * 사용처: 모든 page.tsx, 컴포넌트
 * ⚠️ CSS 변수(var(--color-*))가 있는 경우 그쪽이 우선이지만,
 *    인라인 style={{}} 에서는 이 파일 값을 사용
 */

// ── 브랜드 컬러 ──────────────────────────────────────────────────────────────
export const COLOR_BRAND = "#A2AA7B"; // 메인 그린
export const COLOR_BRAND_BG = "#F0F2E8"; // 연한 배경
export const COLOR_BRAND_LIGHT = "#C5CBA8"; // 연한 테두리

// ── 텍스트 ───────────────────────────────────────────────────────────────────
export const COLOR_TEXT = "#1A1A1A";
export const COLOR_TEXT_MUTED = "#AFAFAF";
export const COLOR_TEXT_SUB = "#757575";

// ── 페이지 배경 ───────────────────────────────────────────────────────────────
export const COLOR_PAGE_BG = "#F8F5EF"; // 상세 페이지
export const COLOR_PAGE_WARM = "#FFFAF5"; // 추천 페이지
export const COLOR_PAGE_BEIGE = "#FFFAF5";

// ── 경계선 / 카드 ─────────────────────────────────────────────────────────────
export const COLOR_BORDER = "#E8E0D0";
export const COLOR_SURFACE = "#F5F5F5";

// ── 찜(Love) ─────────────────────────────────────────────────────────────────
export const COLOR_LOVE = "#E57373";
export const COLOR_LOVE_BG = "#FFF0F0";
export const COLOR_LOVE_LIGHT = "#FFEAEA";

// ── 주의 성분 ─────────────────────────────────────────────────────────────────
export const COLOR_CAUTION_BG = "#FFF3E0";
export const COLOR_CAUTION_BORDER = "#FFE0B2";
export const COLOR_CAUTION_TAG_BG = "#FFCCBC";
export const COLOR_CAUTION_TAG = "#BF360C";

// ── 알레르기 성분 ─────────────────────────────────────────────────────────────
export const COLOR_ALLERGEN_BG = "#FFEBEE";
export const COLOR_ALLERGEN_TAG = "#FFCDD2";
export const COLOR_ALLERGEN = "#B71C1C";

// ── EWG ──────────────────────────────────────────────────────────────────────
export const COLOR_EWG_SAFE = "#4CAF50";
export const COLOR_EWG_CAUTION = "#FFB300";
export const COLOR_EWG_DANGER = "#F44336";

// ── 설정 페이지 (warm 계열) ───────────────────────────────────────────────────
export const COLOR_WARM = "#C28C7E"; // 알러지 칩 활성화 색

// ── 페이지네이션 ──────────────────────────────────────────────────────────────
export const COLOR_PAGE_NUM_INACTIVE = "#F5F5F5";
export const COLOR_PAGE_NUM_TEXT_OFF = "#616161";

// ── 제품 상세 페이지 전용 ─────────────────────────────────────────────────────
export const COLOR_PRODUCT_IMG_BG = "#EDEAE2"; // 이미지 영역 배경
export const COLOR_EWG_SAFE_BG = "#E8F5E9"; // EWG 안전 아이콘 배경
export const COLOR_TAB_BG = "#EEEBE4"; // 탭 컨테이너 배경
export const COLOR_TEXT_PLACEHOLDER = "#9E9E9E"; // placeholder / 보조 텍스트

// ── 경고 / 알레르기 텍스트 추가 ──────────────────────────────────────────────
export const COLOR_CAUTION_TEXT = "#E65100"; // 주의 성분 레이블
export const COLOR_ALLERGEN_DARK = "#C62828"; // 알레르기 유발 성분 레이블
export const COLOR_NEUTRAL = "#E0E0E0"; // 중립 바 / 구분선
