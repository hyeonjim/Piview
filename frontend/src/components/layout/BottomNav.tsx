"use client";

import { useRouter, usePathname } from "next/navigation";
import { Home, Search, Sparkles, Heart, User } from "lucide-react";

const TABS = [
  { id: "search", href: "/search", icon: Search, isCenter: false },
  { id: "recommend", href: "/recommend", icon: Sparkles, isCenter: false },
  { id: "home", href: "/home", icon: Home, isCenter: true },
  { id: "wishlist", href: "/likes", icon: Heart, isCenter: false },
  { id: "mypage", href: "/mypage", icon: User, isCenter: false },
];

export default function BottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const getActiveTab = () => {
    if (pathname.startsWith("/search")) return "search";
    if (pathname.startsWith("/recommend")) return "recommend";
    if (pathname.startsWith("/likes")) return "wishlist";
    if (pathname.startsWith("/mypage")) return "mypage";
    return "home";
  };
  const activeTab = getActiveTab();

  return (
    <div
      style={{
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
      }}
    >
      <div
        className="flex items-center justify-between"
        style={{
          width: "100%",
          maxWidth: "480px",
          height: "60px",
          borderRadius: "100px",
          backdropFilter: "blur(80px) saturate(220%)",
          WebkitBackdropFilter: "blur(80px) saturate(220%)",
          backgroundImage:
            "linear-gradient(170deg, rgba(162,170,123,0.03) 0%, rgba(236,234,222,0.05) 50%, rgba(255,250,245,0.06) 100%)",
          border: "1px solid rgba(255,255,255,0.15)",
          boxShadow:
            "0 8px 32px rgba(120,130,80,0.05), inset 0 1px 0 rgba(255,255,255,0.08)",
          padding: "0 24px",
          pointerEvents: "auto",
        }}
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
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  backgroundColor: isActive ? "var(--color-brand)" : "#3A3A3A",
                  boxShadow: isActive
                    ? "0 4px 16px rgba(162,170,123,0.45)"
                    : "0 4px 12px rgba(0,0,0,0.2)",
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
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                backgroundColor: isActive
                  ? "var(--color-brand)"
                  : "transparent",
              }}
            >
              <Icon
                size={20}
                color={isActive ? "#FFFFFF" : "rgba(60,60,60,0.55)"}
                strokeWidth={isActive ? 2 : 1.5}
                fill={tab.id === "wishlist" && isActive ? "#FFFFFF" : "none"}
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}
