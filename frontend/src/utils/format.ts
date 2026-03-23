/**
 * utils/format.ts
 * 가격·날짜·숫자 포맷 유틸
 *
 * 사용법:
 *   import { formatPrice, formatReviewCount } from "@/utils/format";
 *   formatPrice(28000)        → "₩28,000"
 *   formatReviewCount(12345)  → "12.3k"
 */

/** 가격을 한국 원화 표기로 변환 */
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "-";
  return `₩${price.toLocaleString("ko-KR")}`;
}

/** 리뷰 수를 축약형으로 변환 */
export function formatReviewCount(count: number): string {
  if (count >= 10000) return `${(count / 10000).toFixed(1)}만`;
  if (count >= 1000) return `${(count / 1000).toFixed(1)}k`;
  return count.toLocaleString("ko-KR");
}

/** 평점을 소수점 1자리로 고정 */
export function formatRating(rating: number | null | undefined): string {
  if (rating == null) return "-";
  return rating.toFixed(1);
}

/** 용량 문자열 정규화 (null → "-") */
export function formatVolume(volume: string | null | undefined): string {
  return volume ?? "-";
}

/** 날짜를 "YYYY.MM.DD" 형식으로 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, "0")}.${String(date.getDate()).padStart(2, "0")}`;
}

/** Set 토글 - 있으면 제거, 없으면 추가 */
export function toggleSet<T>(prev: Set<T>, value: T): Set<T> {
  const next = new Set(prev);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

/**
 * 카테고리 표시명 매핑
 * 백엔드 데이터는 "클렌징폼" 등으로 유지하되, 화면에는 축약형으로 표시
 */
const CATEGORY_DISPLAY_NAMES: Record<string, string> = {
  클렌징폼: "폼",
  클렌징젤: "젤",
  클렌징밤: "밤",
  클렌징오일: "오일",
  클렌징워터: "워터",
  클렌징로션: "밀크",
  남성화장품: "맨즈",
};

/**
 * 카테고리명을 화면 표시용으로 변환
 * 매핑에 없으면 원래 이름 반환
 */
export function getCategoryDisplayName(category: string): string {
  return CATEGORY_DISPLAY_NAMES[category] ?? category;
}
