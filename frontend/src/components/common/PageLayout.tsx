// src/components/common/PageLayout.tsx
// 페이지 전체 레이아웃 래퍼 — Header + scrollable content 조합
import { type ReactNode } from "react";
import { cn } from "@/lib/utils";
import Header from "./Header";

interface PageLayoutProps {
  /** Header에 전달할 타이틀 */
  title?: string;
  backHref?: string;
  onBack?: () => void;
  headerRight?: ReactNode;
  headerBottom?: ReactNode;
  headerTransparent?: boolean;
  /** 페이지 본문 */
  children: ReactNode;
  /** 본문 좌우 패딩 제거 (풀블리드 이미지 등) */
  noPadding?: boolean;
  className?: string;
}

export default function PageLayout({
  title,
  backHref,
  onBack,
  headerRight,
  headerBottom,
  headerTransparent,
  children,
  noPadding = false,
  className,
}: PageLayoutProps) {
  const hasHeader = title || backHref || onBack || headerRight || headerBottom;

  return (
    <div className={cn("flex flex-col min-h-full", className)}>
      {hasHeader && (
        <Header
          title={title}
          backHref={backHref}
          onBack={onBack}
          right={headerRight}
          bottom={headerBottom}
          transparent={headerTransparent}
        />
      )}
      <main className={cn("flex-1", !noPadding && "px-5 py-4")}>
        {children}
      </main>
    </div>
  );
}
