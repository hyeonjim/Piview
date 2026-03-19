/**
 * app/oauth2/redirect/page.tsx
 * 카카오 OAuth 콜백 처리 페이지
 *
 * 플로우:
 * 1. 백엔드가 이 URL로 리다이렉트 (?token=xxx)
 * 2. URL 쿼리 파라미터에서 accessToken 꺼내기
 * 3. Zustand에 저장
 * 4. /home으로 이동
 *
 * ⚠️ Route Group 밖에 위치해야 함 (백엔드 리다이렉트 URL 고정)
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores/useUserStore";
import { authService } from "@/services/auth";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // 1. URL 쿼리 파라미터에서 token 꺼내기 (?token=xxx)
        const params = new URLSearchParams(window.location.search);
        const accessToken = params.get("token");

        if (!accessToken) {
          // token이 없으면 인증 실패
          router.replace("/welcome");
          return;
        }

        // 2. Zustand에 저장 (이후 모든 API 요청 헤더에 자동 주입됨)
        useUserStore.getState().setAccessToken(accessToken);

        // 3. 유저 정보 조회 후 store에 저장
        const user = await authService.getMe();
        useUserStore.getState().setUser(user);

        // 4. 피부 타입 진단 여부에 따라 분기
        if (!user.mySkinType) {
          router.replace("/skin-test");
        } else {
          router.replace("/home");
        }
      } catch {
        // 인증 실패 → welcome 페이지로 복귀
        router.replace("/welcome");
      }
    };

    handleCallback();
  }, [router]);

  // 처리 중 로딩 UI
  return (
    <div
      className="flex items-center justify-center"
      style={{ height: "100dvh", backgroundColor: "#1E1B24" }}
    >
      <div className="flex flex-col items-center gap-4">
        {/* 로딩 스피너 */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            border: "2px solid rgba(162,170,123,0.2)",
            borderTopColor: "#A2AA7B",
            animation: "spin 0.8s linear infinite",
          }}
        />
        <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "14px" }}>
          로그인 중...
        </p>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
