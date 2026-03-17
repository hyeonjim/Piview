// src/components/common/IconButton.tsx
// 헤더 우측 아이콘 버튼 (알림, 검색 등)
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface IconButtonProps {
  icon: LucideIcon;
  label: string; // 접근성
  onClick?: () => void;
  badge?: number; // 알림 뱃지 숫자
  className?: string;
}

export default function IconButton({
  icon: Icon,
  label,
  onClick,
  badge,
  className,
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      onClick={onClick}
      className={cn(
        "relative w-9 h-9 flex items-center justify-center rounded-full hover:bg-bg-surface transition-colors",
        className
      )}
    >
      <Icon size={22} className="text-text-primary" />
      {badge != null && badge > 0 && (
        <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 bg-ewg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center">
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </button>
  );
}
