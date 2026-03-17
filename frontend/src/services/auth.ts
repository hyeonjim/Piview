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
   * ⚠️ /users/me API 미구현 — 연동 시 주석 해제
   */
  getMe: () => client.get<User>("/users/me").then((response) => response.data),

  /**
   * 로그아웃
   * 백엔드가 httpOnly 쿠키를 maxAge=0으로 만료 처리
   */
  logout: () => client.post("/auth/logout"),
};
