"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";

const SLIDE_IMG_1 =
  "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const SLIDE_IMG_2 =
  "https://images.unsplash.com/photo-1666025062728-c33a25e8ee3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";
const SLIDE_IMG_3 =
  "https://images.unsplash.com/photo-1765964492963-b0aa8c172431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080";

const OVERLAY =
  "linear-gradient(to top, rgba(30,27,36,0.92) 0%, rgba(30,27,36,0.5) 40%, rgba(30,27,36,0.1) 65%, transparent 100%)";

const slides = [
  {
    image: SLIDE_IMG_1,
    title: "Discover\nYour Glow",
    subtitle: "당신의 피부에 맞는 특별한 케어를\n지금 시작하세요.",
  },
  {
    image: SLIDE_IMG_2,
    title: "Personalized\nFor You",
    subtitle: "과학적 분석으로 나만의\n스킨케어 루틴을 설계합니다.",
  },
  {
    image: SLIDE_IMG_3,
    title: "Care &\nAttention",
    subtitle:
      "AI 기반 피부 진단과 성분 분석으로\n정확한 맞춤 추천을 경험하세요.",
  },
];

const ACCENT = "#A2AA7B";

export default function WelcomePage() {
  const router = useRouter();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const goNext = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);
  const goPrev = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  const handleTouchStart = (e: React.TouchEvent) =>
    setTouchStart(e.touches[0].clientX);
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart === null) return;
    const diff = touchStart - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) diff > 0 ? goNext() : goPrev();
    setTouchStart(null);
  };

  const handleStart = () => {
    setFading(true);
    setTimeout(() => router.push("/skin-test"), 400);
  };

  const slide = slides[currentSlide];

  return (
    <div
      className="relative flex flex-col"
      style={{
        height: "100%",
        minHeight: "100dvh",
        backgroundColor: "#1E1B24",
        overflow: "hidden",
        opacity: fading ? 0 : 1,
        transition: "opacity 0.4s ease",
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Background images with crossfade */}
      {slides.map((s, i) => (
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

      {/* Gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: OVERLAY }}
      />

      {/* Brand name */}
      <div className="relative z-10 flex justify-center pt-14">
        <p
          style={{
            fontFamily: "'Raleway', sans-serif",
            fontSize: "35px",
            fontWeight: 700,
            color: "rgba(255,255,255,0.85)",
            letterSpacing: "4px",
            textTransform: "uppercase",
          }}
        >
          피뷰
        </p>
      </div>

      <div className="flex-1" />

      {/* Bottom content */}
      <div className="relative z-10 px-7 pb-10">
        {/* Title + subtitle with fade transition */}
        <div style={{ minHeight: "140px" }}>
          <h1
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: "42px",
              fontWeight: 300,
              color: "#FFFFFF",
              lineHeight: 1.15,
              letterSpacing: "-0.5px",
              whiteSpace: "pre-line",
              margin: 0,
              transition: "opacity 0.5s",
            }}
          >
            {slide.title}
          </h1>
          <p
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: "16px",
              fontWeight: 400,
              color: "rgba(255,255,255,0.6)",
              lineHeight: 1.7,
              marginTop: "16px",
              whiteSpace: "pre-line",
              letterSpacing: "0.2px",
            }}
          >
            {slide.subtitle}
          </p>
        </div>

        {/* Pagination dots */}
        <div className="flex items-center gap-2 mt-8">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className="border-none cursor-pointer p-0"
              style={{
                width: i === currentSlide ? "24px" : "6px",
                height: "6px",
                borderRadius: "3px",
                backgroundColor:
                  i === currentSlide ? ACCENT : "rgba(255,255,255,0.3)",
                transition: "all 0.4s ease",
              }}
            />
          ))}
        </div>

        {/* CTA row */}
        <div className="flex items-center justify-between mt-8">
          <button
            onClick={() => router.push("/home")}
            className="bg-transparent border-none cursor-pointer p-0"
            style={{
              fontFamily: "'Raleway', sans-serif",
              fontSize: "16px",
              color: "rgba(255,255,255,0.5)",
              fontWeight: 400,
            }}
          >
            이미 계정이 있으신가요?{" "}
            <span style={{ color: ACCENT, fontWeight: 600 }}>로그인</span>
          </button>

          <button
            onClick={handleStart}
            className="flex items-center justify-center cursor-pointer border-none"
            style={{
              width: "70px",
              height: "70px",
              borderRadius: "50%",
              backgroundColor: ACCENT,
              boxShadow: `0 4px 24px ${ACCENT}88`,
              transition: "transform 0.15s ease",
              marginRight: "10px",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.transform = "scale(1.05)")
            }
            onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
          >
            <ArrowRight size={22} color="#fff" strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
