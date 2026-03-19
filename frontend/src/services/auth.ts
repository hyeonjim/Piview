/**
 * services/auth.ts
 * 인증 관련 API 함수
 * ERD: User (로그인/로그아웃)
 */

import client from "./client";
import type { User } from "@/types/user";
import type { ApiResponse } from "@/types/common";

export const authService = {
  /**
   * 로그인 후 유저 정보 조회
   * 응답 형태: { status, message, data: User } → data 필드만 반환
   */
  getMe: () =>
    client
      .get<ApiResponse<User>>("/users/me")
      .then((response) => response.data.data),

  /**
   * 로그아웃
   * 백엔드가 httpOnly 쿠키를 maxAge=0으로 만료 처리
   */
  logout: () => client.post("/auth/logout"),
};
