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

  /**
   * 개발용 로그인 (테스트 전용)
   * 이메일을 전달하면 해당 유저의 Access Token을 발급
   * 유저가 없으면 새로 생성
   * 반환: JWT 토큰 문자열
   */
  devLogin: (email: string = "test@kakao.com") =>
    client
      .get<ApiResponse<string>>(`/auth/dev/login?email=${encodeURIComponent(email)}`)
      .then((response) => response.data.data),
};
