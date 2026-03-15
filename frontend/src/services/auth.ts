/**
 * services/auth.ts
 * 인증 관련 API 함수
 * ERD: User (로그인/로그아웃)
 */

import client from "./client";
import type { User } from "@/types/user";

export const authService = {
  /**
   * 로그인 후 유저 정보 조회
   * /oauth/callback 페이지에서 호출
   * ⚠️ API 연동 시 실제 엔드포인트로 교체
   */
  getMe: () =>
    client.get<User>("/api/v1/users/me").then((response) => response.data),

  /**
   * 로그아웃
   * 백엔드가 httpOnly 쿠키를 maxAge=0으로 만료 처리
   * ⚠️ API 연동 시 주석 해제
   */
  logout: () => client.post("/api/v1/auth/logout"),
};
