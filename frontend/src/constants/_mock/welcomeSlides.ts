/**
 * 🔧 _mock/welcomeSlides.ts
 * 🔧 웰컴 페이지 슬라이드 이미지 및 텍스트 — 임시 하드코딩, 실제 데이터 아님
 *
 * ⚠️  API 교체 대상 (이미지 URL을 CMS/백엔드에서 관리할 경우)
 *     텍스트만 고정이라면 constants/로 이동해도 됨
 *
 * 사용처:
 *   - src/app/(onboarding)/welcome/page.tsx → WELCOME_SLIDES
 */

export interface WelcomeSlide {
  image:    string;
  title:    string;
  subtitle: string;
}

// 🔧 웰컴 슬라이드 목업 — ⚠️ CMS/API 연동 시 삭제
export const WELCOME_SLIDES: WelcomeSlide[] = [
  {
    image:    "https://images.unsplash.com/photo-1620916566398-39f1143ab7be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title:    "Discover\nYour Glow",
    subtitle: "당신의 피부에 맞는 특별한 케어를\n지금 시작하세요.",
  },
  {
    image:    "https://images.unsplash.com/photo-1666025062728-c33a25e8ee3f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title:    "Personalized\nFor You",
    subtitle: "과학적 분석으로 나만의\n스킨케어 루틴을 설계합니다.",
  },
  {
    image:    "https://images.unsplash.com/photo-1765964492963-b0aa8c172431?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    title:    "Care &\nAttention",
    subtitle: "AI 기반 피부 진단과 성분 분석으로\n정확한 맞춤 추천을 경험하세요.",
  },
];
