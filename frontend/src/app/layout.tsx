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
        <div className="min-h-screen" style={{ backgroundColor: "#F0EDE8" }}>
          <div className="mx-auto min-h-screen bg-white flex flex-col relative" style={{ width: "100%", maxWidth: "500px", boxShadow: "0 0 0 1px rgba(162,170,123,0.08), 0 8px 60px rgba(0,0,0,0.10)" }}>
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
