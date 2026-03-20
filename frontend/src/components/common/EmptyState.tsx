// src/components/common/EmptyState.tsx
// 검색 결과 없음, 루틴 없음 등 빈 상태 표시
import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  className?: string;
}

export default function EmptyState({
  icon: Icon,
  title,
  description,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 py-16 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="w-16 h-16 rounded-full bg-bg-surface flex items-center justify-center mb-1">
          <Icon size={28} className="text-text-muted" />
        </div>
      )}
      <p className="text-base font-semibold text-text-primary">{title}</p>
      {description && (
        <p className="text-sm text-text-muted max-w-[240px] leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}
