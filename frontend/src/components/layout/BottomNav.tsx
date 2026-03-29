"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Star, Heart, User } from "lucide-react";
import { useChatbotStore } from "@/stores";

// 홈을 중간(index 2)에 배치한 탭 순서
const TABS = [
  { id: "search",    href: "/search",    icon: Search},
  { id: "recommend", href: "/recommend", icon: Star},
  { id: "home",      href: "/home",      icon: Home},
  { id: "likes",     href: "/likes",     icon: Heart },
  { id: "mypage",    href: "/mypage",    icon: User},
] as const;

export default function BottomNav() {
  const router   = useRouter();
  const pathname = usePathname();

  const getActiveTab = (): string => {
    if (pathname.startsWith("/search"))    return "search";
    if (pathname.startsWith("/recommend")) return "recommend";
    if (pathname.startsWith("/likes"))     return "likes";
    if (pathname.startsWith("/mypage"))    return "mypage";
    return "home";
  };
  const activeTab = getActiveTab();
  // 챗봇 입력 포커스(모바일 키보드 열림) 시 BottomNav 숨김 — 모바일(≤500px)에서만 적용
  const isChatKeyboardOpen = useChatbotStore((state) => state.isChatKeyboardOpen);

  return (
    // iOS Safari 스크롤 시 주소창 변화로 nav가 줄어드는 버그 방지: will-change: transform
    <nav
      className={`fixed bottom-0 left-0 right-0 z-50 flex justify-center${isChatKeyboardOpen ? " max-[500px]:hidden" : ""}`}
      style={{ willChange: "transform" }}
    >
      <div className="bottom-nav-container">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isHome = tab.id === "home";
          const Icon = tab.icon;

          // 홈 버튼 — 원형, 중앙 배치
          if (isHome) {
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className="bottom-nav-button"
              >
                <div className="bottom-nav-home-circle" data-active={isActive}>
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2 : 1.6}
                    className="bottom-nav-home-icon"
                    data-active={isActive}
                  />
                </div>
              </button>
            );
          }

          // 일반 탭 버튼
          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className="bottom-nav-button"
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.4}
                className="bottom-nav-icon"
                data-active={isActive}
                style={{
                  fill: (tab.id === "likes" || tab.id === "recommend") && isActive ? "currentColor" : "none",
                }}
              />
              {/* 활성 표시 — 하단 선 */}
              {isActive && <div className="bottom-nav-indicator" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
