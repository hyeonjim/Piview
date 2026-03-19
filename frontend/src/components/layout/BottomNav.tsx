"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Sparkles, Heart, User } from "lucide-react";

// 홈을 중간(index 2)에 배치한 탭 순서
const TABS = [
  { id: "search",    href: "/search",    icon: Search},
  { id: "recommend", href: "/recommend", icon: Sparkles},
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

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-center">
      <div
        className="w-full flex items-center relative"
        style={{
          maxWidth: "500px",
          height: "56px",
          backgroundColor: "#FDFCFB",
          borderTop: "1px solid #E2DDD8",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {TABS.map((tab) => {
          const isActive  = activeTab === tab.id;
          const isHome    = tab.id === "home";
          const Icon      = tab.icon;

          // 홈 버튼 — 원형, 중앙 배치
          if (isHome) {
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className="flex flex-1 flex-col items-center justify-center h-full cursor-pointer border-none bg-transparent"
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    backgroundColor: isActive ? "#5A504A" : "#EAE5DF",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: isActive
                      ? "0 2px 8px rgba(90,80,74,0.30)"
                      : "0 1px 4px rgba(90,80,74,0.12)",
                    transition: "background-color 0.15s, box-shadow 0.15s",
                    marginBottom: "2px",
                  }}
                >
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2 : 1.6}
                    style={{
                      color: isActive ? "#FDFCFB" : "#8C847C",
                      transition: "color 0.15s",
                    }}
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
              className="flex flex-1 flex-col items-center justify-center h-full cursor-pointer border-none bg-transparent"
              style={{ transition: "opacity 0.15s" }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2 : 1.4}
                style={{
                  color: isActive ? "#5A504A" : "#C4BEB7",
                  fill: tab.id === "likes" && isActive ? "#5A504A" : "none",
                  transition: "color 0.15s",
                }}
              />
              <span
                className="text-[9px]"
                style={{
                  color: isActive ? "#5A504A" : "#C4BEB7",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.08em",
                  marginTop: "2px",
                }}
              >
              </span>
              {/* 활성 표시 — 하단 선 (베이지 테마 accent) */}
              {isActive && (
                <div
                  className="absolute bottom-0"
                  style={{
                    width: "20px",
                    height: "2px",
                    backgroundColor: "#A69D92",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
