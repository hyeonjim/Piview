// src/components/common/Badge.tsx
// shadcn Badge 확장 — 카테고리 필터 칩 + 피부타입 뱃지 + EWG 등급 뱃지
import { Badge as ShadcnBadge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/* ────────────────────────────────────────
   CategoryBadge — 피그마 카테고리 필터 칩
   border border-[#f0f0f0] rounded-[30px]
──────────────────────────────────────── */
interface CategoryBadgeProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryBadge({
  label,
  active = false,
  onClick,
  className,
}: CategoryBadgeProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center justify-center px-5 py-2 rounded-badge text-sm font-medium transition-all whitespace-nowrap",
        active
          ? "bg-brand text-white shadow-sm"
          : "bg-bg-card border border-border text-text-secondary hover:border-brand hover:text-brand",
        className
      )}
    >
      {label}
    </button>
  );
}

/* ────────────────────────────────────────
   SkinTypeBadge — 피부타입 표시 뱃지
   ex) 건성, 지성, 복합성, 수부지
──────────────────────────────────────── */
const SKIN_TYPE_COLORS: Record<string, string> = {
  건성: "bg-blue-50 text-blue-600 border-blue-200",
  지성: "bg-yellow-50 text-yellow-600 border-yellow-200",
  복합성: "bg-purple-50 text-purple-600 border-purple-200",
  수부지: "bg-teal-50 text-teal-600 border-teal-200",
};

interface SkinTypeBadgeProps {
  skinType: string;
  className?: string;
}

export function SkinTypeBadge({ skinType, className }: SkinTypeBadgeProps) {
  const colorClass =
    SKIN_TYPE_COLORS[skinType] ?? "bg-bg-surface text-text-secondary border-border";

  return (
    <ShadcnBadge
      variant="outline"
      className={cn(
        "rounded-badge px-3 py-0.5 text-xs font-medium border",
        colorClass,
        className
      )}
    >
      {skinType}
    </ShadcnBadge>
  );
}

/* ────────────────────────────────────────
   EWGBadge — EWG 종합 등급 뱃지
   ex) 안전 / 주의 / 위험
──────────────────────────────────────── */
type EWGGrade = "safe" | "caution" | "danger" | "unknown";

const EWG_GRADE_MAP: Record<EWGGrade, { label: string; className: string }> = {
  safe:    { label: "안전", className: "bg-ewg-safe/10 text-ewg-safe border-ewg-safe/30" },
  caution: { label: "주의", className: "bg-ewg-caution/10 text-ewg-caution border-ewg-caution/30" },
  danger:  { label: "위험", className: "bg-ewg-danger/10 text-ewg-danger border-ewg-danger/30" },
  unknown: { label: "미정", className: "bg-bg-surface text-text-muted border-border" },
};

interface EWGBadgeProps {
  grade: EWGGrade;
  className?: string;
}

export function EWGBadge({ grade, className }: EWGBadgeProps) {
  const { label, className: colorClass } = EWG_GRADE_MAP[grade];
  return (
    <ShadcnBadge
      variant="outline"
      className={cn(
        "rounded-badge px-3 py-0.5 text-xs font-semibold border",
        colorClass,
        className
      )}
    >
      {label}
    </ShadcnBadge>
  );
}
