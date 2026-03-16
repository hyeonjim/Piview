import type { Metadata } from "next";
import localFont from "next/font/local";
import { Cormorant_Garamond } from "next/font/google";
import { Providers } from "@/lib/providers";
import "./globals.css";

// ── Pretendard — 한국어 본문 폰트 ──────────────────────────────────
const pretendard = localFont({
  src: [
    { path: "../../public/fonts/Pretendard-Regular.subset.woff2",  weight: "400" },
    { path: "../../public/fonts/Pretendard-Medium.subset.woff2",   weight: "500" },
    { path: "../../public/fonts/Pretendard-SemiBold.subset.woff2", weight: "600" },
    { path: "../../public/fonts/Pretendard-Bold.subset.woff2",     weight: "700" },
  ],
  display: "swap",
  variable: "--font-pretendard",
});

// ── Cormorant Garamond — 럭셔리 세리프 디스플레이 폰트 ──────────────
// 에디토리얼 헤딩, 섹션 타이틀, 브랜드 강조에 사용
const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SkinFit",
  description: "나만의 스킨케어 루틴",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${cormorant.variable}`}>
      <body>
        <div className="min-h-screen" style={{ backgroundColor: "#EFEFEB" }}>
          <div
            className="mx-auto min-h-screen bg-white flex flex-col relative w-full"
            style={{
              maxWidth: "500px",
              boxShadow: "0 0 0 1px rgba(0,0,0,0.04), 0 20px 80px rgba(0,0,0,0.08)",
            }}
          >
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
