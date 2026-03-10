"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { WELCOME_SLIDES } from "@/constants/_mock/welcomeSlides";

const OVERLAY =
  "linear-gradient(to top, rgba(30,27,36,0.92) 0%, rgba(30,27,36,0.5) 40%, rgba(30,27,36,0.1) 65%, transparent 100%)";

export default function WelcomePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart,   setTouchStart]   = useState<number | null>(null);
  const [fading,       setFading]       = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % WELCOME_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goNext = useCallback(() => setCurrentSlide((prev) => (prev + 1) % WELCOME_SLIDES.length), []);
  const goPrev = useCallback(() => setCurrentSlide((prev) => (prev - 1 + WELCOME_SLIDES.length) % WELCOME_SLIDES.length), []);

  const handleTouchStart = (e: React.TouchEvent) => setTouchStart(e.touches[0].clientX);
  const handleTouchEnd   = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    setTouchStart(null);
  };

  const handleStart = () => {
    setFading(true);
    setTimeout(() => router.push("/skin-test"), 400);
  };

  const slide = WELCOME_SLIDES[currentSlide];

  return (
    <div className="relative flex flex-col overflow-hidden"
      style={{ height: "100%", minHeight: "100dvh", backgroundColor: "#1E1B24",
        opacity: fading ? 0 : 1, transition: "opacity 0.4s ease" }}
      onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>

      {/* 배경 이미지 크로스페이드 */}
      {WELCOME_SLIDES.map((s, i) => (
        <div key={i} className="absolute inset-0" style={{ opacity: i === currentSlide ? 1 : 0, transition: "opacity 1s ease" }}>
          <img src={s.image} alt="" className="absolute inset-0 w-full h-full object-cover" style={{ objectPosition: "center 30%" }} />
        </div>
      ))}

      {/* 그라디언트 오버레이 */}
      <div className="absolute inset-0 pointer-events-none" style={{ background: OVERLAY }} />

      {/* 브랜드명 */}
      <div className="relative z-10 flex justify-center pt-14">
        <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: "35px", fontWeight: 700,
          color: "rgba(255,255,255,0.85)", letterSpacing: "4px", textTransform: "uppercase" }}>
          피뷰
        </p>
      </div>

      <div className="flex-1" />

      {/* 하단 콘텐츠 */}
      <div className="relative z-10 px-7 pb-10">
        <div style={{ minHeight: "140px" }}>
          <h1 style={{ fontFamily: "'Raleway', sans-serif", fontSize: "42px", fontWeight: 300,
            color: "#FFFFFF", lineHeight: 1.15, letterSpacing: "-0.5px", whiteSpace: "pre-line",
            margin: 0, transition: "opacity 0.5s" }}>
            {slide.title}
          </h1>
          <p style={{ fontFamily: "'Raleway', sans-serif", fontSize: "16px", fontWeight: 400,
            color: "rgba(255,255,255,0.6)", lineHeight: 1.7, marginTop: "16px",
            whiteSpace: "pre-line", letterSpacing: "0.2px" }}>
            {slide.subtitle}
          </p>
        </div>

        {/* 페이지네이션 dots */}
        <div className="flex items-center gap-2 mt-8">
          {WELCOME_SLIDES.map((_, i) => (
            <button key={i} onClick={() => setCurrentSlide(i)}
              className="border-none cursor-pointer p-0"
              style={{ width: i === currentSlide ? "24px" : "6px", height: "6px", borderRadius: "3px",
                backgroundColor: i === currentSlide ? "var(--color-brand)" : "rgba(255,255,255,0.3)",
                transition: "all 0.4s ease" }} />
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center justify-between mt-8">
          <button onClick={() => router.push("/home")} className="bg-transparent border-none cursor-pointer p-0"
            style={{ fontFamily: "'Raleway', sans-serif", fontSize: "16px", color: "rgba(255,255,255,0.5)", fontWeight: 400 }}>
            이미 계정이 있으신가요?{" "}
            <span className="text-brand font-semibold">로그인</span>
          </button>
          <button onClick={handleStart}
            className="flex items-center justify-center cursor-pointer border-none bg-brand"
            style={{ width: "70px", height: "70px", borderRadius: "50%",
              boxShadow: "0 4px 24px rgba(162,170,123,0.53)", transition: "transform 0.15s ease", marginRight: "10px" }}
            onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}>
            <ArrowRight size={22} color="#fff" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
