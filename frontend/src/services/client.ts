/**
 * services/client.ts
 * axios 인스턴스 설정 + 토큰 인터셉터
 *
 * - 요청 인터셉터: Zustand에서 accessToken 꺼내 Authorization 헤더에 주입
 * - 응답 인터셉터: 401 시 refreshToken(httpOnly 쿠키)으로 재발급 후 원래 요청 재시도
 * - _retry 플래그로 refresh 무한루프 방지
 */

import axios, { type InternalAxiosRequestConfig } from "axios";
import { useUserStore } from "@/stores";
import { useSearchStore } from "@/stores/useSearchStore";
import { useRecommendStore } from "@/stores/useRecommendStore";
import { useLikeStore } from "@/stores";

// _retry 플래그 타입 확장 (TypeScript 에러 방지)
interface RetryableRequestConfig extends InternalAxiosRequestConfig {
  _retry?: boolean;
}

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : "http://localhost:8080/api/v1",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  // refreshToken(httpOnly 쿠키) 자동 전송용
  withCredentials: true,
});

// ── 전체 store 초기화 헬퍼 — 로그아웃/세션 만료 시 호출 ──────────────────
function clearAllStores() {
  useUserStore.getState().clearUser();
  useSearchStore.getState().setSearchQuery("");
  useSearchStore.getState().resetFilter();
  useRecommendStore.getState().setSearchQuery("");
  useRecommendStore.getState().resetFilter();
  useLikeStore.getState().initFromServer([]);
  useLikeStore.getState().setPage(1);
}

// ── 요청 인터셉터: accessToken → Authorization 헤더 주입 ───────────────────
client.interceptors.request.use((config) => {
  const accessToken = useUserStore.getState().accessToken;
  if (accessToken) {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }
  return config;
});

// ── 응답 인터셉터: accessToken 만료(401) 처리 ──────────────────────────────
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig;

    // 401 이외의 에러는 그대로 전달
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    // refresh 요청 자체가 401이면 무한루프 방지 — 바로 로그아웃
    if (originalRequest.url?.includes("/auth/refresh")) {
      clearAllStores();
      window.location.href = "/splash";
      return Promise.reject(error);
    }

    // _retry 플래그가 이미 있으면 refresh도 실패한 것 → 무한루프 방지
    if (originalRequest._retry) {
      clearAllStores();
      window.location.href = "/splash";
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      // refreshToken은 httpOnly 쿠키 → withCredentials로 자동 전송
      // 응답으로 새 accessToken이 일반 쿠키로 내려옴
      await client.post("/auth/refresh");

      // 새로 발급된 accessToken 쿠키에서 꺼내 Zustand에 저장 후 쿠키 삭제
      const newAccessToken = getCookieAndClear("accessToken");
      if (newAccessToken) {
        useUserStore.getState().setAccessToken(newAccessToken);
        originalRequest.headers["Authorization"] = `Bearer ${newAccessToken}`;
      }

      // 원래 요청 재시도
      return client(originalRequest);
    } catch {
      // refresh도 실패 → 세션 만료, 로그아웃 처리
      clearAllStores();
      window.location.href = "/splash";
      return Promise.reject(error);
    }
  },
);

/**
 * 쿠키에서 값을 꺼내고 즉시 삭제하는 헬퍼
 * accessToken은 일반 쿠키(httpOnly: false)라 JS로 접근 가능
 */
function getCookieAndClear(cookieName: string): string | null {
  const cookieMatch = document.cookie.match(
    new RegExp("(?:^|; )" + cookieName + "=([^;]*)"),
  );
  if (!cookieMatch) return null;

  const cookieValue = decodeURIComponent(cookieMatch[1]);

  // 보안을 위해 즉시 삭제 (Max-Age=0)
  document.cookie = `${cookieName}=; Max-Age=0; path=/`;

  return cookieValue;
}

export { getCookieAndClear };
export default client;
