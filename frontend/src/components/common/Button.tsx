// src/components/common/Button.tsx
// shadcn Button을 우리 브랜드 토큰으로 확장
import { Button as ShadcnButton } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { type ButtonHTMLAttributes, type ReactNode } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  /**
   * primary  — 올리브 배경 / 흰 텍스트  (피그마: bg-[#a2aa7b])
   * secondary — 베이지 배경 / 기본 텍스트
   * outline  — 테두리만 / 올리브 텍스트  (피그마: border border-[#f0f0f0])
   * ghost    — 텍스트만
   * danger   — 빨간 배경 (삭제 등)
   */
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  /** sm=36px / md=48px / lg=56px */
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  loading?: boolean;
  children: ReactNode;
}

export default function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  loading = false,
  className,
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <ShadcnButton
      disabled={disabled || loading}
      className={cn(
        // 기본: 피그마 rounded-[32px] 풀 라운드 버튼
        "rounded-[32px] font-semibold transition-all active:scale-[0.97]",
        // 사이즈
        size === "sm" && "h-9 px-5 text-sm",
        size === "md" && "h-12 px-6 text-[15px]",
        size === "lg" && "h-14 px-8 text-base",
        // variant
        variant === "primary" &&
          "bg-brand text-white hover:bg-brand-light border-none shadow-none",
        variant === "secondary" &&
          "bg-bg-surface text-text-primary hover:bg-brand-pale border-none shadow-none",
        variant === "outline" &&
          "bg-transparent border border-border text-text-primary hover:border-brand hover:text-brand",
        variant === "ghost" &&
          "bg-transparent text-brand hover:bg-brand-pale border-none shadow-none",
        variant === "danger" &&
          "bg-ewg-danger text-white hover:opacity-90 border-none shadow-none",
        // 전체 너비
        fullWidth && "w-full",
        className
      )}
      {...props}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          {children}
        </span>
      ) : (
        children
      )}
    </ShadcnButton>
  );
}
