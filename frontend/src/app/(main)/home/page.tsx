"use client";

import { Search, Sparkles, ChevronRight, Droplets, Sun, Smile } from "lucide-react";

// ─── 임시 더미 데이터 (API 연결 전) ─────────────────────
const DUMMY_USER = {
  name: "User",
  skinType: "건성 피부",
  ageRange: "20대",
};

const DUMMY_ROUTINE = [
  { step: 1, emoji: "💧", name: "미스트", sub: "Hydrating Mist" },
  { step: 2, emoji: "☀️", name: "선크림", sub: "SPF 50+ 덧바르기" },
  { step: 3, emoji: "💋", name: "립밤",  sub: "Lip Moisturizer" },
];

const DUMMY_TIPS = [
  { icon: Droplets, title: "수분 관리",  desc: "충분한 수분 공급이 건강한 피부의 기본입니다" },
  { icon: Sun,      title: "자외선 차단", desc: "외출 20분 전 선크림을 꼼꼼히 발라주세요" },
  { icon: Smile,    title: "수면 케어",  desc: "충분한 수면이 피부 재생을 도와줍니다" },
];

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return { text: "GOOD MORNING",  emoji: "🌤️" };
  if (hour < 18) return { text: "GOOD AFTERNOON", emoji: "☀️" };
  return { text: "GOOD EVENING", emoji: "🌙" };
}

function getTimeOfDay() {
  const hour = new Date().getHours();
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

export default function HomePage() {
  const greeting = getGreeting();
  const timeOfDay = getTimeOfDay();

  return (
    <div className="flex flex-col min-h-full bg-bg-surface">

      {/* ── 상단 헤더 ── */}
      <div className="flex items-center justify-between px-5 pt-12 pb-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-text-muted uppercase">
            {greeting.emoji} {greeting.text}
          </p>
          <h1 className="text-2xl font-bold text-text-primary mt-0.5">
            {DUMMY_USER.name}님,
          </h1>
          <p className="text-sm text-text-muted mt-0.5">
            오늘의 스킨케어 루틴을 확인해보세요
          </p>
        </div>
        <button className="w-10 h-10 rounded-full bg-bg-base flex items-center justify-center">
          <Search size={18} className="text-text-secondary" />
        </button>
      </div>

      <div className="flex flex-col gap-5 px-5 pb-6">

        {/* ── AI SKIN ANALYSIS 배너 ── */}
        <div className="rounded-card bg-brand p-5 flex items-center justify-between">
          <div className="flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <Sparkles size={13} className="text-brand-pale" />
              <span className="text-2xs font-bold tracking-widest text-brand-pale uppercase">
                AI Skin Analysis
              </span>
            </div>
            <p className="text-xl font-bold text-text-inverse leading-snug">
              나만의 피부 타입을<br />분석해보세요
            </p>
            <p className="text-xs text-brand-pale mt-0.5">
              맞춤 루틴을 추천받을 수 있어요
            </p>
          </div>
          <button className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>

        {/* ── 오늘의 루틴 ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-text-primary">오늘의 루틴</h2>
            <span className="text-sm text-text-muted">{timeOfDay} 🌤️</span>
          </div>

          <div className="rounded-card bg-bg-card shadow-card overflow-hidden">
            {DUMMY_ROUTINE.map((item, idx) => (
              <div key={item.step}>
                <div className="flex items-center gap-3 px-4 py-3.5">
                  {/* 스텝 번호 */}
                  <div className="w-6 h-6 rounded-full bg-bg-base flex items-center justify-center flex-shrink-0">
                    <span className="text-2xs font-bold text-text-muted">{item.step}</span>
                  </div>
                  {/* 이모지 아이콘 */}
                  <div className="w-9 h-9 rounded-icon bg-bg-surface flex items-center justify-center flex-shrink-0 text-lg">
                    {item.emoji}
                  </div>
                  {/* 텍스트 */}
                  <div className="flex flex-col">
                    <span className="text-base font-semibold text-text-primary">{item.name}</span>
                    <span className="text-xs text-text-muted">{item.sub}</span>
                  </div>
                </div>
                {idx < DUMMY_ROUTINE.length - 1 && (
                  <div className="mx-4 h-px bg-bg-base" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ── Skincare Tips ── */}
        <div>
          <h2 className="text-lg font-bold text-text-primary mb-3">Skincare Tips</h2>
          <div className="flex flex-col gap-2">
            {DUMMY_TIPS.map((tip) => {
              const Icon = tip.icon;
              return (
                <div key={tip.title} className="rounded-card bg-bg-card shadow-card flex items-center gap-3 px-4 py-4">
                  <div className="w-9 h-9 rounded-icon bg-bg-surface flex items-center justify-center flex-shrink-0">
                    <Icon size={18} className="text-brand" />
                  </div>
                  <div>
                    <p className="text-base font-semibold text-text-primary">{tip.title}</p>
                    <p className="text-xs text-text-muted mt-0.5">{tip.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
