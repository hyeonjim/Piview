"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/stores";

interface WelcomeSlide {
  image: string;
  title: string;
  subtitle: string;
}

// ── 슬라이드 데이터 ────────────────────────────────────────────
// 컴포넌트 외부에 상수로 선언: 렌더링마다 새 배열이 생성되는 것을 방지
const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    image:
      "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Discover\nYour Glow",
    subtitle: "당신의 피부에 맞는 특별한 케어를\n지금 시작하세요.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1666025062728-c33a25e8ee3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Personalized\nFor You",
    subtitle: "과학적 분석으로 나만의\n스킨케어 루틴을 설계합니다.",
  },
  {
    image:
      "https://images.unsplash.com/photo-1765964492963-b0aa8c172431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title: "Care &\nAttention",
    subtitle: "AI 기반 피부 진단과 성분 분석으로\n정확한 맞춤 추천을 경험하세요.",
  },
];

export default function WelcomePage() {
  const router = useRouter();
  // Zustand 선택자: state 전체를 받아 필요한 필드만 반환 → 불필요한 리렌더링 방지
  const user = useUserStore((state) => state.user);

  const [currentSlide, setCurrentSlide] = useState(0);
  // 터치 시작 X 좌표 (null이면 터치 중 아님)
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  // ── 세션 복원 후 자동 이동 ────────────────────────────────────
  // TokenInitializer가 세션 복원 완료 → user가 채워지면 홈으로 이동
  useEffect(() => {
    if (user) {
      router.replace("/home");
    }
  }, [user, router]);

  // ── 자동 슬라이드 ─────────────────────────────────────────────
  // 5초마다 다음 슬라이드로 전환; cleanup으로 메모리 누수 방지
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((previous) => (previous + 1) % WELCOME_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // ── 슬라이드 이동 핸들러 ──────────────────────────────────────
  // useCallback: 의존성 없이 안정적인 참조 유지 (자식 컴포넌트 리렌더링 방지)
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

  // ── 터치 제스처 (스와이프) ────────────────────────────────────
  const handleTouchStart = (event: React.TouchEvent) =>
    setTouchStartX(event.touches[0].clientX);

  const handleTouchEnd = (event: React.TouchEvent) => {
    if (touchStartX === null) return;
    // 이동 거리가 50px 이상이면 슬라이드 전환
    const deltaX = touchStartX - event.changedTouches[0].clientX;
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) goNext();
      else goPrevious();
    }
    setTouchStartX(null);
  };

  // ── 카카오 OAuth2 로그인 ──────────────────────────────────────
  // 백엔드로 redirect_uri를 쿼리 파라미터로 전달 → 인증 완료 후 프론트로 복귀
  const handleKakaoLogin = () => {
    const frontendUrl = window.location.origin;
    const redirectUri = `${frontendUrl}/oauth2/redirect`;
    window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/oauth2/authorization/kakao?redirect_uri=${encodeURIComponent(redirectUri)}`;
  };

  const slide = WELCOME_SLIDES[currentSlide];

  return (
    <div
      className="relative flex flex-col overflow-hidden h-full min-h-[100dvh] bg-[#1E1B24]"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* 배경 이미지 크로스페이드
       * 모든 슬라이드를 절대 위치로 겹쳐 놓고 opacity로만 전환
       * → 이미지가 미리 로드되어 전환이 부드러움 */}
      {WELCOME_SLIDES.map((slideItem, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{
            // JS 상태(currentSlide)에 의존하므로 인라인 style 유지
            opacity: index === currentSlide ? 1 : 0,
          }}
        >
          <Image
            src={slideItem.image}
            alt=""
            fill
            className="object-cover object-[center_30%]"
            priority={index === 0}
          />
        </div>
      ))}

      {/* 배경 그라디언트 오버레이
       * globals.css .welcome-gradient-overlay: 하단 어두움 → 상단 투명
       * 슬라이드 텍스트 가독성 확보 */}
      <div className="absolute inset-0 pointer-events-none welcome-gradient-overlay" />

      {/* 브랜드 로고
       * font-english: globals.css에서 var(--font-english) 적용 */}
      <div className="relative z-10 flex justify-center pt-14">
        <p className="font-english text-[35px] font-bold text-white/85 tracking-[4px] uppercase m-0">
          PIVIEW
        </p>
      </div>

      <div className="flex-1" />

      {/* 하단 슬라이드 콘텐츠 영역 */}
      <div className="relative z-10 px-7 pb-20">
        {/* 슬라이드 텍스트
         * min-h로 높이 고정 → 텍스트 길이 차이에 의한 레이아웃 흔들림 방지
         * font-korean: globals.css에서 var(--font-korean) 적용 */}
        <div className="min-h-[140px]">
          <h1 className="font-korean text-[42px] font-light text-white leading-[1.15] tracking-[-0.5px] whitespace-pre-line m-0 transition-opacity duration-500">
            {slide.title}
          </h1>
          <p className="font-korean mt-4 text-base font-normal text-white/60 leading-[1.7] whitespace-pre-line tracking-[0.2px]">
            {slide.subtitle}
          </p>
        </div>

        {/* 페이지네이션 인디케이터
         * 활성 점: 너비 24px + 브랜드 색상 / 비활성: 6px + 반투명 흰색
         * 너비가 JS 상태에 따라 달라지므로 인라인 style 유지 */}
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

        {/* 로그인 버튼 — 클릭 시 하단 시트 열기 */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={() => setIsLoginOpen(true)}
            className="px-8 py-2.5 rounded-full bg-white/10 backdrop-blur-sm border-[1.5px] border-white/30 text-white text-[20px] font-black tracking-[0.3px] cursor-pointer transition-all duration-300 hover:bg-white/40 hover:border-white/40 active:scale-95"
          >
            Login
          </button>
        </div>
      </div>

      {/* 하단 시트 배경 오버레이
       * opacity 트랜지션 + pointerEvents 조합으로 열림/닫힘 처리
       * isLoginOpen 상태에 의존하므로 인라인 style 유지 */}
      <div
        className="absolute inset-0 z-20 bg-black/50 transition-opacity duration-300 ease-in-out"
        style={{
          opacity: isLoginOpen ? 1 : 0,
          pointerEvents: isLoginOpen ? "auto" : "none",
        }}
        onClick={() => setIsLoginOpen(false)}
      />

      {/* 로그인 하단 시트
       * translateY로 슬라이드 업/다운 애니메이션
       * cubic-bezier(0.32, 0.72, 0, 1): iOS 스타일 바운스 커브 */}
      <div
        className="absolute bottom-0 left-0 right-0 z-30 rounded-t-[28px] bg-[#F5F0E8] px-25 pt-20 pb-30"
        style={{
          transform: isLoginOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="font-english text-[30px] font-bold text-[#4a474e] text-center leading-tight mb-15 whitespace-pre-line">
          Welcome to PIVIEW !
        </h2>

        {/* 카카오 로그인 버튼
         * #FEE500: 카카오 공식 브랜드 컬러 */}
        <div className="flex justify-center">
          <button
            onClick={handleKakaoLogin}
            className="w-150 h-[54px] bg-[#FEE500] text-black/85 text-[18px] font-bold flex items-center justify-center gap-3 cursor-pointer border-none rounded-2xl"
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
        </div>

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
