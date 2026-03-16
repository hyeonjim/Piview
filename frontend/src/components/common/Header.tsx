// src/components/common/Header.tsx
import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface HeaderProps {
  /** 페이지 타이틀 */
  title?: string;
  /** 뒤로가기 링크 */
  backHref?: string;
  /** 뒤로가기 클릭 핸들러 (backHref 없을 때) */
  onBack?: () => void;
  /** 우측 액션 영역 (아이콘 버튼 등) */
  right?: ReactNode;
  /** 하단 컨텐츠 (탭, 검색바 등) */
  bottom?: ReactNode;
  /** 배경 투명 여부 */
  transparent?: boolean;
  className?: string;
}

export default function Header({
  title,
  backHref,
  onBack,
  right,
  bottom,
  transparent = false,
  className,
}: HeaderProps) {
  const hasBack = backHref || onBack;

  const BackButton = () => {
    const inner = (
      <span className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-bg-surface transition-colors">
        <ChevronLeft size={22} className="text-text-primary" />
      </span>
    );
    if (backHref) return <Link href={backHref}>{inner}</Link>;
    if (onBack) return <button onClick={onBack}>{inner}</button>;
    return null;
  };

  return (
    <header
      className={cn(
        "sticky top-0 z-20 w-full",
        transparent ? "bg-transparent" : "bg-bg-card border-b border-border",
        className
      )}
    >
      {/* 메인 행 */}
      <div className="h-header flex items-center px-4 gap-2">
        {/* 왼쪽 */}
        <div className="w-10 shrink-0">
          {hasBack && <BackButton />}
        </div>

        {/* 중앙 타이틀 */}
        <div className="flex-1 text-center min-w-0">
          {title && (
            <h1 className="text-lg font-semibold text-text-primary truncate">
              {title}
            </h1>
          )}
        </div>

        {/* 오른쪽 */}
        <div className="w-10 shrink-0 flex justify-end">
          {right}
        </div>
      </div>

      {/* 하단 슬롯 (탭바, 검색 등) */}
      {bottom && (
        <div className="px-4 pb-3">
          {bottom}
        </div>
      )}
    </header>
  );
}
