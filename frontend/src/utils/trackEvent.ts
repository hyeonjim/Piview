/**
 * utils/trackEvent.ts
 * 사용자 행동 이벤트 로깅 유틸
 *
 * POST /api/v1/logs/events
 * fire-and-forget — 응답 대기 없이 백그라운드 전송
 * keepalive: true — 페이지 이동/닫힘 시에도 요청 유실 방지
 *
 * ⚠️ userId는 Zustand 메모리에서 가져옴 (localStorage 금지)
 */

import { useUserStore } from "@/stores";

export type EventType = "VIEW_PRODUCT" | "SEARCH" | "LIKE";

/**
 * 사용자 행동 이벤트를 백그라운드로 전송
 * @param eventType  이벤트 종류
 * @param productId  제품 ID (VIEW_PRODUCT, LIKE 시 전달)
 * @param searchKeyword  검색어 (SEARCH 시 전달)
 */
export const trackEvent = (
  eventType: EventType,
  productId: number | null = null,
  searchKeyword: string | null = null,
): void => {
  // Zustand 메모리에서 userId 추출 (localStorage 금지)
  const userId = useUserStore.getState().user?.userId ?? null;

  const payload = {
    userId,
    eventType,
    productId,
    searchKeyword,
    timestamp: new Date().toISOString(),
  };

  const baseUrl = process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : "http://localhost:8080/api/v1";

  // accessToken 주입
  const accessToken = useUserStore.getState().accessToken;

  fetch(`${baseUrl}/logs/events`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    },
    body: JSON.stringify(payload),
    keepalive: true, // 페이지 이동/닫힘 시에도 요청 유실 방지
  }).catch(() => {
    // 이벤트 로그 실패는 UX에 영향 없음 — 무시
  });
};
