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
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Piview",
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: "website",
    title: "Piview",
    description: "나만의 스킨케어 루틴",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#F2EFE9",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="ko"
      className={`${maruBuri.variable} ${sortsMillGoudy.variable}`}
    >
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body>
        <div className="min-h-screen bg-[#F2EFE9]">
          <div className="mx-auto min-h-screen bg-white flex flex-col relative w-full max-w-app shadow-app">
            <Providers>{children}</Providers>
          </div>
        </div>
      </body>
    </html>
  );
}
