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
        <div className="min-h-screen bg-gray-100">
          <div className="mx-auto max-w-app min-h-screen bg-white flex flex-col relative shadow-sm">
            {children}
          </div>
        </div>
      </body>
    </html>
  );
}
