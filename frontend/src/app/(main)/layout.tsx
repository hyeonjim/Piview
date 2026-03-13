import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {/* pb-nav: globals.css에 정의 — BottomNav 60px + bottom 16px + 여백 16px = 92px */}
      <main className="flex-1 pb-nav">{children}</main>
      <BottomNav />
    </>
  );
}
