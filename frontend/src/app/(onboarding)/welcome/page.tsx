"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { WELCOME_SLIDES } from "@/constants/_mock/welcomeSlides";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const BRAND_TEXT_STYLE = {
  fontFamily: "'Raleway', sans-serif",
  fontSize: "35px",
  fontWeight: 700,
  color: "rgba(255,255,255,0.85)",
  letterSpacing: "4px",
  textTransform: "uppercase" as const,
};
const SLIDE_MIN_H_STYLE = { minHeight: "140px" };
const TITLE_STYLE = {
  fontFamily: "'Raleway', sans-serif",
  fontSize: "42px",
  fontWeight: 300,
  color: "#FFFFFF",
  lineHeight: 1.15,
  letterSpacing: "-0.5px",
  whiteSpace: "pre-line" as const,
  margin: 0,
  transition: "opacity 0.5s",
};
const DESC_STYLE = {
  fontFamily: "'Raleway', sans-serif",
  fontSize: "16px",
  fontWeight: 400,
  color: "rgba(255,255,255,0.6)",
  lineHeight: 1.7,
  marginTop: "16px",
  whiteSpace: "pre-line" as const,
  letterSpacing: "0.2px",
};

const OVERLAY =
  "linear-gradient(to top, rgba(30,27,36,0.92) 0%, rgba(30,27,36,0.5) 40%, rgba(30,27,36,0.1) 65%, transparent 100%)";

export default function WelcomePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  // 로그인 바텀시트 열림/닫힘 상태
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % WELCOME_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goNext = useCallback(
    () => setCurrentSlide((prev) => (prev + 1) % WELCOME_SLIDES.length),
    [],
  );
  const goPrev = useCallback(
    () =>
      setCurrentSlide(
        (prev) => (prev - 1 + WELCOME_SLIDES.length) % WELCOME_SLIDES.length,
      ),
    [],
  );

  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    setTouchStart(null);
  };

  /**
   * 카카오 로그인 버튼 클릭 핸들러
   * window.location.href로 이동 → 백엔드가 카카오 인증 서버로 리다이렉트
   * redirect_uri로 현재 환경의 프론트 URL을 넘겨서 로컬/배포 자동 분기
   */
  const handleKakaoLogin = () => {
    const frontendUrl = window.location.origin; // 로컬: http://localhost:3000, 배포: https://j14e101.p.ssafy.io:3000
    const redirectUri = `${frontendUrl}/oauth2/redirect`;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/kakao?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  /**
   * 관리자로 바로 시작 — 마이페이지로 이동
   * ⚠️ API 연동 시 관리자 인증 로직으로 교체
   */
  const handleAdminLogin = () => {
    router.push("/mypage");
  };

  const slide = WELCOME_SLIDES[currentSlide];

  return (
    <div
      className="relative flex flex-col overflow-hidden"
      style={{
        height: "100%",
        minHeight: "100dvh",
        backgroundColor: "#1E1B24",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 배경 이미지 크로스페이드 */}
      {WELCOME_SLIDES.map((s, i) => (
        <div
          key={i}
          className="absolute inset-0"
          style={{
            opacity: i === currentSlide ? 1 : 0,
            transition: "opacity 1s ease",
          }}
        >
          <img
            src={s.image}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
            style={{ objectPosition: "center 30%" }}
          />
        </div>
      ))}

      {/* 그라디언트 오버레이 */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: OVERLAY }}
      />

      {/* 브랜드명 */}
      <div className="relative z-10 flex justify-center pt-14">
        <p style={BRAND_TEXT_STYLE}>피뷰</p>
      </div>

      <div className="flex-1" />

      {/* 하단 콘텐츠 */}
      <div className="relative z-10 px-7 pb-10">
        <div style={SLIDE_MIN_H_STYLE}>
          <h1 style={TITLE_STYLE}>{slide.title}</h1>
          <p style={DESC_STYLE}>{slide.subtitle}</p>
        </div>

        {/* 페이지네이션 dots */}
        <div className="flex items-center gap-2 mt-8">
          {WELCOME_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="border-none cursor-pointer p-0"
              style={{
                width: i === currentSlide ? "24px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor:
                  i === currentSlide
                    ? "var(--color-brand)"
                    : "rgba(255,255,255,0.3)",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>

        {/* 로그인 링크 버튼 */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setIsLoginOpen(true)}
            className="cursor-pointer border-none bg-transparent"
            style={{
              fontSize: "15px",
              fontWeight: 600,
              color: "rgba(255,255,255,0.75)",
              letterSpacing: "0.2px",
              textDecoration: "underline",
              textUnderlineOffset: "3px",
            }}
          >
            이미 계정이 있으신가요? 로그인
          </button>
        </div>
      </div>

      {/* 바텀시트 오버레이 */}
      <div
        className="absolute inset-0 z-20"
        style={{
          backgroundColor: "rgba(0,0,0,0.5)",
          opacity: isLoginOpen ? 1 : 0,
          pointerEvents: isLoginOpen ? "auto" : "none",
          transition: "opacity 0.3s ease",
        }}
        onClick={() => setIsLoginOpen(false)}
      />

      {/* 로그인 바텀시트 */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30"
        style={{
          borderRadius: "28px 28px 0 0",
          backgroundColor: "#F5F0E8",
          padding: "36px 28px 40px",
          transform: isLoginOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 타이틀 */}
        <h2
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: "28px",
            fontWeight: 700,
            color: "#1E1B24",
            textAlign: "center",
            lineHeight: 1.25,
            marginBottom: "32px",
          }}
        >
          Welcome Back{"\n"}to PiView !
        </h2>

        {/* 카카오 로그인 버튼 */}
        <button
          onClick={handleKakaoLogin}
          className="w-full flex items-center justify-center gap-3 cursor-pointer border-none rounded-2xl"
          style={{
            backgroundColor: "#FEE500",
            height: "54px",
            fontSize: "16px",
            fontWeight: 600,
            color: "rgba(0,0,0,0.85)",
          }}
        >
          {/* 카카오 말풍선 아이콘 */}
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

        {/* 구분선 */}
        <div className="flex items-center gap-3 my-5">
          <div style={{ flex: 1, height: "1px", backgroundColor: "#D0C8B8" }} />
          <span style={{ fontSize: "13px", color: "#9E9585", fontWeight: 400 }}>
            또는
          </span>
          <div style={{ flex: 1, height: "1px", backgroundColor: "#D0C8B8" }} />
        </div>

        {/* 관리자로 바로 시작 버튼 */}
        <button
          onClick={handleAdminLogin}
          className="w-full flex items-center justify-center gap-3 cursor-pointer border-none rounded-2xl"
          style={{
            backgroundColor: "#E5DFD3",
            height: "54px",
            fontSize: "16px",
            fontWeight: 600,
            color: "#5A5248",
          }}
        >
          {/* 방패 아이콘 */}
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

        {/* 약관 동의 안내 */}
        <p
          style={{
            fontSize: "12px",
            color: "#9E9585",
            textAlign: "center",
            marginTop: "20px",
            lineHeight: 1.6,
          }}
        >
          로그인 시{" "}
          <span
            style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            서비스 이용약관
          </span>{" "}
          및{" "}
          <span
            style={{ textDecoration: "underline", textUnderlineOffset: "2px" }}
          >
            개인정보처리방침
          </span>
          에 동의합니다.
        </p>
      </div>
    </div>
  );
}
