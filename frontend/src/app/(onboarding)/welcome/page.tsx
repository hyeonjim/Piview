"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WELCOME_SLIDES } from "@/constants/_mock/welcomeSlides";
import { useUserStore } from "@/stores";
import { authService } from "@/services/auth";

const GRADIENT_OVERLAY =
  "linear-gradient(to top, rgba(30,27,36,0.92) 0%, rgba(30,27,36,0.5) 40%, rgba(30,27,36,0.1) 65%, transparent 100%)";

export default function WelcomePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // Auto-slide effect
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % WELCOME_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Navigation handlers
  const goNext = useCallback(
    () => setCurrentSlide((previous) => (previous + 1) % WELCOME_SLIDES.length),
    [],
  );

  const goPrevious = useCallback(
    () =>
      setCurrentSlide(
        (previous) =>
          (previous - 1 + WELCOME_SLIDES.length) % WELCOME_SLIDES.length,
      ),
    [],
  );

  // Touch gesture handlers
  const handleTouchStart = (event: React.TouchEvent) =>
    setTouchStart(event.touches[0].clientX);

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStart === null) return;
    const difference = touchStart - event.changedTouches[0].clientX;
    if (Math.abs(difference) > 50) {
      if (difference > 0) {
        goNext();
      } else {
        goPrevious();
      }
    }
    setTouchStart(null);
  };

  /**
   * 카카오 로그인 핸들러
   * 백엔드로 리다이렉트하여 OAuth2 인증 시작
   */
  const handleKakaoLogin = () => {
    const frontendUrl = window.location.origin;
    const redirectUri = `${frontendUrl}/oauth2/redirect`;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/kakao?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  /**
   * 관리자 로그인 (개발/테스트 전용)
   * 백엔드 개발용 API를 호출하여 실제 Access Token 발급
   */
  const handleAdminLogin = async () => {
    try {
      // 개발용 API 호출 - Access Token 발급
      const accessToken = await authService.devLogin("admin@test.com");

      // 받은 토큰을 Zustand store에 저장
      useUserStore.getState().setAccessToken(accessToken);

      // 마이페이지로 이동
      // useUserQuery가 /users/me를 호출하여 실제 사용자 정보를 가져옴
      router.push("/mypage");
    } catch (error) {
      console.error("개발용 로그인 실패:", error);
      // 실패 시 fallback으로 로컬 스토어에만 설정 (기존 방식)
      useUserStore.getState().setUser({
        id: 999999,
        userId: 999999,
        provider: "test",
        providerId: "test-admin",
        email: "admin@test.com",
        name: "User",
        imageUrl: null,
        gender: "WOMEN",
        ageGroup: null,
        mySkinType: null,
        exist: true,
        mySkinProblems: [],
      });
      router.push("/mypage");
    }
  };

  const slide = WELCOME_SLIDES[currentSlide];

  return (
    <div
      className="relative flex flex-col overflow-hidden h-full min-h-[100dvh] bg-[#1E1B24]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background images with crossfade */}
      {WELCOME_SLIDES.map((slideItem, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            opacity: index === currentSlide ? 1 : 0,
          }}
        >
          <img
            src={slideItem.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover object-[center_30%]"
          />
        </div>
      ))}

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: GRADIENT_OVERLAY }}
      />

      {/* Brand logo */}
      <div className="relative z-10 flex justify-center pt-14">
        <p
          className="text-[35px] font-bold text-white/85 tracking-[4px] uppercase m-0"
          style={{ fontFamily: "var(--font-english)" }}
        >
          PIVIEW
        </p>
      </div>

      <div className="flex-1" />

      {/* Bottom content area */}
      <div className="relative z-10 px-7 pb-20">
        {/* Slide content */}
        <div className="min-h-[140px]">
          <h1
            className="text-[42px] font-light text-white leading-[1.15] tracking-[-0.5px] whitespace-pre-line m-0 transition-opacity duration-500"
            style={{ fontFamily: "var(--font-korean)" }}
          >
            {slide.title}
          </h1>
          <p
            className="mt-4 text-base font-normal text-white/60 leading-[1.7] whitespace-pre-line tracking-[0.2px]"
            style={{ fontFamily: "var(--font-korean)" }}
          >
            {slide.subtitle}
          </p>
        </div>

        {/* Pagination dots */}
        <div className="flex items-center gap-2 mt-8">
          {WELCOME_SLIDES.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className="h-1.5 rounded-[3px] border-none cursor-pointer p-0 transition-all duration-[400ms] ease-in-out"
              style={{
                width: index === currentSlide ? "24px" : "6px",
                backgroundColor:
                  index === currentSlide
                    ? "var(--color-brand)"
                    : "rgba(255,255,255,0.3)",
              }}
            />
          ))}
        </div>

        {/* Login button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setIsLoginOpen(true)}
            className="px-10 py-3 rounded-full bg-white/10 backdrop-blur-sm border-[1.5px] border-white/30 text-white text-[22px] font-black tracking-[0.3px] cursor-pointer transition-all duration-300 hover:bg-white/40 hover:border-white/40 active:scale-95"
          >
            Login
          </button>
        </div>
      </div>

      {/* Bottom sheet overlay */}
      <div
        className="absolute inset-0 z-20 bg-black/50 transition-opacity duration-300 ease-in-out"
        style={{
          opacity: isLoginOpen ? 1 : 0,
          pointerEvents: isLoginOpen ? "auto" : "none",
        }}
        onClick={() => setIsLoginOpen(false)}
      />

      {/* Login bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 rounded-t-[28px] bg-[#F5F0E8] px-25 pt-9 pb-10"
        style={{
          transform: isLoginOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2
          className="text-[24px] font-bold text-[#1E1B24] text-center leading-tight mb-12 whitespace-pre-line"
          style={{ fontFamily: "var(--font-english)" }}
        >
          Welcome Back{"\n"}to PiView !
        </h2>

        <button
          onClick={handleKakaoLogin}
          className="w-full h-[54px] bg-[#FEE500] text-black/85 text-base font-semibold flex items-center justify-center gap-3 cursor-pointer border-none rounded-2xl"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="rgba(0,0,0,0.85)"
          >
            <path d="M12 3C6.477 3 2 6.477 2 11c0 2.897 1.553 5.453 3.926 7.07L4.9 21.5a.5.5 0 0 0 .7.55l4.13-2.32A11.3 11.3 0 0 0 12 20c5.523 0 10-3.477 10-8S17.523 3 12 3z" />
          </svg>
          카카오로 시작하기
        </button>

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-[#D0C8B8]" />
          <span className="text-[13px] text-[#9E9585] font-normal">또는</span>
          <div className="flex-1 h-px bg-[#D0C8B8]" />
        </div>

        <button
          onClick={handleAdminLogin}
          className="w-full h-[54px] bg-[#E5DFD3] text-[#5A5248] text-base font-semibold flex items-center justify-center gap-3 cursor-pointer border-none rounded-2xl"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#5A5248"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          관리자로 바로 시작
        </button>

        <p className="text-xs text-[#9E9585] text-center mt-5 leading-[1.6]">
          로그인 시{" "}
          <span className="underline underline-offset-[2px]">
            서비스 이용약관
          </span>{" "}
          및{" "}
          <span className="underline underline-offset-[2px]">
            개인정보처리방침
          </span>
          에 동의합니다.
        </p>
      </div>
    </div>
  );
}
