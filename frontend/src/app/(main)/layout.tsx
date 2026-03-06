// src/app/(main)/layout.tsx
import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    // PC: 화면 중앙 정렬 + 양옆 베이지 배경 노출 (화해 방식)
    // 모바일: max-width 없이 꽉 참
    <div className="min-h-screen bg-bg-base">
      <div className="mx-auto max-w-app min-h-screen bg-bg-surface flex flex-col relative">

        {/* 페이지 콘텐츠 — 하단 탭바 높이만큼 패딩 */}
        <main className="flex-1 pb-nav overflow-y-auto">
          {children}
        </main>

        {/* 하단 탭 바 — 항상 하단 고정 */}
        <BottomNav />
      </div>
    </div>
  );
}
