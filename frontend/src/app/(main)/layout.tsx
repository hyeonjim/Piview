import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* flex-1: 루트 레이아웃 flex-col에서 남은 공간 모두 차지 → 페이지 minHeight:"100%" 정상 동작 */}
      {/* paddingBottom: BottomNav(56px) + Android 제스처 내비게이션 safe area 합산 */}
      <main className="flex-1 flex flex-col" style={{ paddingBottom: "calc(56px + env(safe-area-inset-bottom, 0px))" }}>{children}</main>
      <BottomNav />
    </>
  );
}
