/**
 * services/client.ts
 * axios 인스턴스 설정 + 토큰 재발급 인터셉터
 *
 * - withCredentials: true → httpOnly 쿠키 자동 전송 (별도 토큰 헤더 불필요)
 * - 401 응답 시 refreshToken으로 자동 재발급 후 원래 요청 재시도
 */

import axios from "axios";
import { useUserStore } from "@/stores/useUserStore";
import { useLocalRoutineStore } from "@/stores/useLocalRoutineStore";

const client = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080",
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
  // httpOnly 쿠키를 모든 요청에 자동 포함 → 인터셉터로 토큰 주입 불필요
  withCredentials: true,
});

// ── 응답 인터셉터: accessToken 만료(401) 처리 ──────────────────────────────
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    // 401 이외의 에러는 그대로 전달
    if (error.response?.status !== 401) {
      return Promise.reject(error);
    }

    try {
      // refreshToken도 httpOnly 쿠키에 있으므로 withCredentials로 자동 전송
      await client.post("/api/v1/auth/refresh");

      // 원래 요청 재시도 (새로 발급된 accessToken 쿠키가 자동 적용됨)
      return client(error.config);
    } catch {
      // refresh도 실패 → 세션 만료, 로그아웃 처리
      useUserStore.getState().clearUser();
      useLocalRoutineStore.getState().clearRoutine();
      localStorage.removeItem("piview-routine");
      window.location.href = "/splash";
      return Promise.reject(error);
    }
  },
);

export default client;
