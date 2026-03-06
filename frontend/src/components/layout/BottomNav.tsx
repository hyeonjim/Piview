"use client";

import { Search, Sparkles, Heart, User, Home } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/search", icon: Search, label: "검색" },
  { href: "/routine", icon: Sparkles, label: "루틴" },
  { href: "/home", icon: Home, label: "홈", center: true },
  { href: "/likes", icon: Heart, label: "좋아요" },
  { href: "/mypage", icon: User, label: "마이" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 h-nav w-full bg-bg-card border-t border-bg-surface shadow-nav flex items-center justify-around px-2 pb-safe-b">
      {NAV_ITEMS.map(({ href, icon: Icon, label, center }) => {
        const isActive = pathname === href;

        if (center) {
          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center -mt-5"
            >
              <span
                className={`w-14 h-14 rounded-full flex items-center justify-center shadow-modal transition-colors ${isActive ? "bg-brand" : "bg-text-primary"}`}
              >
                <Icon size={24} className="text-white" />
              </span>
            </Link>
          );
        }

        return (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1 py-1 px-3"
          >
            <Icon
              size={22}
              className={`transition-colors ${isActive ? "text-brand" : "text-text-muted"}`}
            />
            <span
              className={`text-2xs transition-colors ${isActive ? "text-brand font-medium" : "text-text-muted"}`}
            >
              {label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
