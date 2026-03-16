import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/lib/providers";
import "./globals.css";

// 실제 사용 weight만 서브셋으로 로드 — 2MB → ~1MB
// public/fonts/ 에 아래 4개 파일 필요:
//   Pretendard-Regular.subset.woff2
//   Pretendard-Medium.subset.woff2
//   Pretendard-SemiBold.subset.woff2
//   Pretendard-Bold.subset.woff2
const pretendard = localFont({
  src: [
    {
      path: "../../public/fonts/Pretendard-Regular.subset.woff2",
      weight: "400",
    },
    {
      path: "../../public/fonts/Pretendard-Medium.subset.woff2",
      weight: "500",
    },
    {
      path: "../../public/fonts/Pretendard-SemiBold.subset.woff2",
      weight: "600",
    },
    { path: "../../public/fonts/Pretendard-Bold.subset.woff2", weight: "700" },
  ],
  display: "swap",
  variable: "--font-pretendard",
});

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
    <html lang="ko" className={pretendard.variable}>
      <body>
        <div className="min-h-screen bg-bg-base">
          <div className="mx-auto min-h-screen bg-white flex flex-col relative w-full max-w-[500px] shadow-[0_0_0_1px_rgba(162,170,123,0.08),0_8px_60px_rgba(0,0,0,0.10)]">
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
