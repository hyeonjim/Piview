"use client";

import React from "react";

import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Sparkles, Heart, User } from "lucide-react";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const NAV_WRAPPER_STYLE: React.CSSProperties = {
  position: "fixed",
  bottom: "16px",
  left: "50%",
  transform: "translateX(-50%)",
  zIndex: 50,
  pointerEvents: "none",
  width: "100%",
  maxWidth: "600px",
  display: "flex",
  justifyContent: "center",
  padding: "0 24px",
};
const NAV_CONTAINER_STYLE: React.CSSProperties = {
  width: "100%",
  maxWidth: "380px",
  height: "60px",
  borderRadius: "100px",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(5px)",
  background:
    "linear-gradient(154deg, rgba(162,170,123,0.12) 3.5%, rgba(236,234,222,0.06) 101.94%)",
  border: "1px solid rgba(255,255,255,0.35)",
  boxShadow: "0 10px 40px 0 rgba(120,130,80,0.26)",
  padding: "0 24px",
  pointerEvents: "auto",
};
const NAV_CENTER_BTN_BASE: React.CSSProperties = {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
};
const NAV_BTN_BASE: React.CSSProperties = {
  width: "40px",
  height: "40px",
  borderRadius: "50%",
};

const TABS = [
  { id: "search", href: "/search", icon: Search, isCenter: false },
  { id: "recommend", href: "/recommend", icon: Sparkles, isCenter: false },
  { id: "home", href: "/home", icon: Home, isCenter: true },
  { id: "likes", href: "/likes", icon: Heart, isCenter: false },
  { id: "mypage", href: "/mypage", icon: User, isCenter: false },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.startsWith("/search")) return "search";
    if (pathname.startsWith("/recommend")) return "recommend";
    if (pathname.startsWith("/likes")) return "likes";
    if (pathname.startsWith("/mypage")) return "mypage";
    return "home";
  };
  const activeTab = getActiveTab();

  return (
    <div style={NAV_WRAPPER_STYLE}>
      <div
        className="flex items-center justify-between"
        style={NAV_CONTAINER_STYLE}
      >
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;

          if (tab.isCenter) {
            return (
              <button
                key={tab.id}
                onClick={() => router.push(tab.href)}
                className="flex items-center justify-center cursor-pointer transition-all duration-200 border-none shrink-0"
                style={{
                  ...NAV_CENTER_BTN_BASE,
                  backgroundColor: isActive ? "var(--color-brand)" : "#a6a2a2",
                  boxShadow: isActive
                    ? "0 4px 16px rgba(162,170,123,0.45)"
                    : "0 4px 12px rgba(0,0,0,0.15)",
                }}
              >
                <Icon size={22} color="#FFFFFF" strokeWidth={2} />
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => router.push(tab.href)}
              className="flex items-center justify-center cursor-pointer transition-all duration-200 border-none shrink-0"
              style={{
                ...NAV_BTN_BASE,
                backgroundColor: isActive
                  ? "var(--color-brand)"
                  : "transparent",
              }}
            >
              <Icon
                size={20}
                color={isActive ? "#FFFFFF" : "rgba(60,60,60,0.55)"}
                strokeWidth={isActive ? 2 : 1.5}
                fill={tab.id === "likes" && isActive ? "#FFFFFF" : "none"}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
