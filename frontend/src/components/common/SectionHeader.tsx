// src/components/common/SectionHeader.tsx
// 피그마: "Browse by categories" + "View all" 우측 링크 패턴
import Link from "next/link";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  /** "전체보기" 링크 */
  moreHref?: string;
  moreLabel?: string;
  className?: string;
}

export default function SectionHeader({
  title,
  moreHref,
  moreLabel = "전체보기",
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="text-lg font-semibold text-text-primary">{title}</h2>
      {moreHref && (
        <Link
          href={moreHref}
          className="text-sm text-brand underline underline-offset-2 hover:text-brand-light transition-colors"
        >
          {moreLabel}
        </Link>
      )}
    </div>
  );
}
