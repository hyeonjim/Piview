import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* BottomNav(56px) 높이만큼 여백 확보 */}
      <main style={{ paddingBottom: "56px" }}>{children}</main>
      <BottomNav />
    </>
  );
}
