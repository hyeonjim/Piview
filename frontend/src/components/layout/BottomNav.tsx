"use client";

import React from "react";
import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Sparkles, Heart, User } from "lucide-react";

const TABS = [
  { id: "home",      href: "/home",      icon: Home,     label: "홈"   },
  { id: "search",    href: "/search",    icon: Search,   label: "전체" },
  { id: "recommend", href: "/recommend", icon: Sparkles, label: "추천" },
  { id: "likes",     href: "/likes",     icon: Heart,    label: "찜"   },
  { id: "mypage",    href: "/mypage",    icon: User,     label: "마이" },
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
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 flex justify-center"
    >
      <div
        className="w-full flex items-center"
        style={{
          maxWidth: "500px",
          height: "56px",
          backgroundColor: "#FDFCFB",
          borderTop: "1px solid #E2DDD8",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon     = tab.icon;

          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className="flex flex-1 flex-col items-center justify-center h-full gap-[2px] cursor-pointer border-none bg-transparent"
              style={{ transition: "opacity 0.15s" }}
              aria-label={tab.label}
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
                className="text-[9px] tracking-[0.5px] uppercase"
                style={{
                  color: isActive ? "#5A504A" : "#C4BEB7",
                  fontFamily: "var(--font-pretendard), sans-serif",
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: "0.08em",
                }}
              >
                {tab.label}
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
