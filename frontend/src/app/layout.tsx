import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SkinVue",
  description: "나만의 스킨케어 루틴",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <div className="min-h-screen bg-bg-base">
          <div className="mx-auto min-h-screen bg-white flex flex-col relative w-full max-w-[500px] shadow-[0_0_0_1px_rgba(162,170,123,0.08),0_8px_60px_rgba(0,0,0,0.10)]">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
