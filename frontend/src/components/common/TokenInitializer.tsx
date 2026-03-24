/**
 * components/common/TokenInitializer.tsx
 *
 * 새로고침 시 로그인 세션 복원 컴포넌트
 *
 * 동작 방식:
 * 1. 마운트 시 accessToken이 없으면 /auth/refresh 호출
 * 2. 성공 → 새 accessToken + /users/me 로 유저 복원 → 현재 페이지 유지
 * 3. 실패 → 토큰 없이 진행 (각 페이지에서 welcome으로 리다이렉트)
 * 4. 복원 완료 전까지 로딩 화면 표시 (API 401 깜빡임 방지)
 */

"use client";

import { useEffect, useState } from "react";
import axios from "axios";
import { useUserStore } from "@/stores";
import { authService } from "@/services/auth";

// ── 인터셉터 없는 순수 axios 인스턴스 ─────────────────────────────
// client.ts의 응답 인터셉터는 /auth/refresh 401 시 window.location을 강제 이동시킴
// TokenInitializer는 세션 복원 시도 맥락이므로 인터셉터 개입 없이 직접 호출해야 함
const rawAxios = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL
    ? `${process.env.NEXT_PUBLIC_API_URL}/api/v1`
    : "http://localhost:8080/api/v1",
  withCredentials: true, // refreshToken httpOnly 쿠키 자동 전송
});

interface TokenInitializerProps {
  children: React.ReactNode;
}

export function TokenInitializer({ children }: TokenInitializerProps) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const restoreSession = async () => {
      const accessToken = useUserStore.getState().accessToken;

      // 이미 토큰 있으면 (oauth 콜백 직후 등) 바로 통과
      if (accessToken) {
        setIsReady(true);
        return;
      }

      try {
        // 인터셉터 없는 rawAxios로 호출 → 실패해도 window.location 강제이동 없음
        const refreshResponse = await rawAxios.post("/auth/refresh");

        // 응답 바디: { accessToken: "..." } 또는 { data: { accessToken: "..." } }
        const newToken =
          (refreshResponse.data?.accessToken as string | undefined) ??
          (refreshResponse.data?.data?.accessToken as string | undefined) ??
          null;

        if (newToken) {
          useUserStore.getState().setAccessToken(newToken);

          // 유저 정보도 복원
          const user = await authService.getMe();
          useUserStore.getState().setUser(user);
        }
      } catch {
        // refreshToken 만료 or 미로그인 → 토큰 없이 진행
        // 각 페이지의 auth guard에서 welcome으로 이동 처리
      } finally {
        setIsReady(true);
      }
    };

    restoreSession();
  }, []);

  if (!isReady) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "var(--color-bg-beige)",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            border: "2px solid rgba(166,157,146,0.2)",
            borderTopColor: "var(--color-brand)",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return <>{children}</>;
}
