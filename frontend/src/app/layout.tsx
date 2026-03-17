import type { Metadata } from "next";
import localFont from "next/font/local";
import { Noto_Serif_KR } from "next/font/google";
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

// ── Noto Serif KR — 한국어 세리프 디스플레이 폰트 ──────────────────
// 에디토리얼 헤딩, 섹션 타이틀, 브랜드 강조에 사용 (Cormorant 대체)
const notoSerifKR = Noto_Serif_KR({
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-cormorant", // 기존 변수명 유지 — 다른 파일 수정 불필요
  display: "swap",
  preload: false, // 한국어 폰트는 용량이 크므로 preload 비활성화
});

export const metadata: Metadata = {
  title: "SkinFit",
  description: "나만의 스킨케어 루틴",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${pretendard.variable} ${notoSerifKR.variable}`}>
      <body>
        <div className="min-h-screen" style={{ backgroundColor: "#F2EFE9" }}>
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
