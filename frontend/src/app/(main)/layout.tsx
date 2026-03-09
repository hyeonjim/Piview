import BottomNav from "@/components/layout/BottomNav";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <main className="flex-1 pb-nav overflow-y-auto">{children}</main>
      <BottomNav />
    </>
  );
}
