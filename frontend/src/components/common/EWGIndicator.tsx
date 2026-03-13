// src/components/common/EWGIndicator.tsx
// EWG 성분 안전도 시각화 — 바 + 텍스트 두 가지 variant
import { cn } from "@/lib/utils";

interface EWGIndicatorProps {
  safe: number;
  caution: number;
  danger: number;
  /** bar(기본, 카드용) | detail(상세 페이지용) */
  variant?: "bar" | "detail";
  className?: string;
}

export default function EWGIndicator({
  safe,
  caution,
  danger,
  variant = "bar",
  className,
}: EWGIndicatorProps) {
  const total = safe + caution + danger || 1;

  if (variant === "detail") {
    return (
      <div className={cn("flex flex-col gap-2", className)}>
        {/* 바 */}
        <div className="flex h-2 rounded-full overflow-hidden gap-0.5">
          {safe > 0 && (
            <div className="bg-ewg-safe rounded-full" style={{ flex: safe }} />
          )}
          {caution > 0 && (
            <div className="bg-ewg-caution rounded-full" style={{ flex: caution }} />
          )}
          {danger > 0 && (
            <div className="bg-ewg-danger rounded-full" style={{ flex: danger }} />
          )}
        </div>
        {/* 범례 */}
        <div className="flex gap-3 text-xs text-text-muted">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ewg-safe inline-block" />
            안전 {safe}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ewg-caution inline-block" />
            주의 {caution}
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-ewg-danger inline-block" />
            위험 {danger}
          </span>
        </div>
      </div>
    );
  }

  // bar (카드용 compact)
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
        {safe > 0 && (
          <div className="bg-ewg-safe" style={{ flex: safe / total }} />
        )}
        {caution > 0 && (
          <div className="bg-ewg-caution" style={{ flex: caution / total }} />
        )}
        {danger > 0 && (
          <div className="bg-ewg-danger" style={{ flex: danger / total }} />
        )}
      </div>
      <p className="text-[10px] text-text-muted">
        안전 {safe} · 주의 {caution} · 위험 {danger}
      </p>
    </div>
  );
}
