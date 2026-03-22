import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/lib/providers";
import "./globals.css";

// ── MaruBuri — 한글 전용 폰트 (모든 굵기) ────────────────────────
const maruBuri = localFont({
  src: [
    {
      path: "../../public/fonts/MaruBuri-ExtraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/fonts/MaruBuri-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      // weight 범위 "400 500": font-medium(500) 요청 시 Regular가 처리 (시스템 폰트 폴백 방지)
      path: "../../public/fonts/MaruBuri-Regular.ttf",
      weight: "400 500",
      style: "normal",
    },
    {
      path: "../../public/fonts/MaruBuri-SemiBold.ttf",
      weight: "600",
      style: "normal",
    },
    {
      path: "../../public/fonts/MaruBuri-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  display: "swap",
  variable: "--font-korean",
});

// ── SortsMillGoudy — 영문 전용 폰트 ──────────────────────────────
const sortsMillGoudy = localFont({
  src: [
    {
      path: "../../public/fonts/SortsMillGoudy-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/SortsMillGoudy-Italic.ttf",
      weight: "400",
      style: "italic",
    },
  ],
  display: "swap",
  variable: "--font-english",
});

export const metadata: Metadata = {
  title: "Piview",
  description: "나만의 스킨케어 루틴",
};

// viewport는 metadata와 분리해서 export해야 Next.js가 올바르게 처리함
export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="ko"
      className={`${maruBuri.variable} ${sortsMillGoudy.variable}`}
    >
      <body>
        <div className="min-h-screen bg-[#F2EFE9]">
          <div
            className="mx-auto min-h-screen bg-white flex flex-col relative w-full max-w-app shadow-app"
          >
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
