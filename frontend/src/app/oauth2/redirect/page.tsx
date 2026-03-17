/**
 * app/oauth2/redirect/page.tsx
 * 카카오 OAuth 콜백 처리 페이지
 *
 * 플로우:
 * 백엔드 → 이 URL로 리다이렉트 (/oauth/callback?success=true)
 * → 유저 정보 fetch → Zustand store 저장 → /home 이동
 *
 * ⚠️ Route Group 밖에 위치해야 함 (백엔드 리다이렉트 URL 고정)
 */

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth";
import { useUserStore } from "@/stores/useUserStore";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // authService.getMe()가 실제 BE 호출로 교체 완료
        const user = await authService.getMe();
        useUserStore.getState().setUser(user);

        // 신규 유저 (피부타입 미설정)는 skin-test로, 기존 유저는 home으로
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
