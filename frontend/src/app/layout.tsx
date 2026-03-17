import type { Metadata } from "next";
import localFont from "next/font/local";
import { Providers } from "@/lib/providers";
import "./globals.css";

// ── Google Sans Flex — 영어 본문 폰트 (variable font) ──────────────
const googleSansFlex = localFont({
  src: "../../public/fonts/GoogleSansFlex-VariableFont_GRAD,ROND,opsz,slnt,wdth,wght.ttf",
  display: "swap",
  variable: "--font-english",
});

// ── RIDIBatang — 한국어 바탕 폰트 (본문 + 디스플레이 공용) ─────────
const ridiBatang = localFont({
  src: "../../public/fonts/RIDIBatang.otf",
  display: "swap",
  variable: "--font-pretendard", // 기존 변수명 유지 — 다른 파일 수정 불필요
});

// ── RIDIBatang (세리프 디스플레이용 별칭) ─────────────────────────
const ridiBatangSerif = localFont({
  src: "../../public/fonts/RIDIBatang.otf",
  display: "swap",
  variable: "--font-cormorant", // 기존 변수명 유지 — 다른 파일 수정 불필요
});

export const metadata: Metadata = {
  title: "SkinFit",
  description: "나만의 스킨케어 루틴",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${googleSansFlex.variable} ${ridiBatang.variable} ${ridiBatangSerif.variable}`}>
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
