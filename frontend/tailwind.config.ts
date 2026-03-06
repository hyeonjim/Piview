/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      // ─── 레이아웃 ───────────────────────────────────────────
      maxWidth: {
        app: "800px", // PC: 양옆 공백 / 모바일: 꽉 참
      },

      // ─── 컬러 (피그마 2개 화면 기반) ────────────────────────
      colors: {
        // 브랜드 (올리브/카키 계열) — AI SKIN ANALYSIS 배너, 추천 버튼, 활성 아이콘
        brand: {
          DEFAULT: "#6B7A4A", // 진한 올리브 (배너 배경, 추천 버튼)
          light:   "#8A9A60", // 연한 올리브 (뱃지, 호버)
          muted:   "#B5BE94", // 뮤트 올리브 (비활성 태그, 보조 텍스트)
          pale:    "#D6DAC3", // 아주 연한 올리브 (태그 배경)
        },

        // 배경 (크림/베이지 계열)
        bg: {
          base:    "#E8E8DC", // 앱 최외곽 배경 (회색빛 베이지)
          surface: "#F2F2EA", // 카드/섹션 배경
          card:    "#FFFFFF", // 카드 내부 흰색
        },

        // 텍스트
        text: {
          primary:   "#1A1A1A", // 제목 (거의 검정)
          secondary: "#4A4A4A", // 본문 텍스트
          muted:     "#9A9A8A", // 서브 설명, 플레이스홀더
          inverse:   "#FFFFFF", // 배너 위 흰색 텍스트
        },

        // EWG 등급
        ewg: {
          safe:    "#52A869", // 🟢 낮은 위험 (1~2점)
          caution: "#E8A020", // 🟡 중간 위험 (3~6점)
          danger:  "#D94F3D", // 🔴 높은 위험 (7~10점)
          unknown: "#ADADAD", // ⚪ 미정
        },

        // 성분 충돌 신뢰도
        conflict: {
          certain: "#D94F3D", // 🔴 확실
          caution: "#E8A020", // 🟡 주의
          myth:    "#52A869", // 🟢 속설(안전)
        },
      },

      // ─── 폰트 ────────────────────────────────────────────────
      fontFamily: {
        sans: ["Pretendard", "Apple SD Gothic Neo", "Noto Sans KR", "sans-serif"],
      },
      fontSize: {
        "2xs": ["10px", { lineHeight: "14px" }],
        xs:    ["12px", { lineHeight: "16px" }],
        sm:    ["13px", { lineHeight: "18px" }],
        base:  ["14px", { lineHeight: "20px" }],
        md:    ["15px", { lineHeight: "22px" }],
        lg:    ["16px", { lineHeight: "24px" }],
        xl:    ["18px", { lineHeight: "26px" }],
        "2xl": ["20px", { lineHeight: "28px" }],
        "3xl": ["24px", { lineHeight: "32px" }],
      },

      // ─── 보더 반경 ───────────────────────────────────────────
      borderRadius: {
        card:   "16px", // 루틴 카드, AI 배너
        badge:  "99px", // 피부타입 뱃지 (건성피부, 20대 등)
        button: "12px", // OCR/저장/추천 버튼
        icon:   "10px", // CL/TN/SR 아이콘 박스
      },

      // ─── 간격 ────────────────────────────────────────────────
      spacing: {
        "nav":    "64px",  // 하단 탭 바 높이
        "header": "56px",  // 상단 헤더 높이
        "page-x": "20px",  // 페이지 좌우 패딩
        "safe-b": "env(safe-area-inset-bottom)", // iOS 홈 인디케이터
      },

      // ─── 그림자 ──────────────────────────────────────────────
      boxShadow: {
        card:  "0 2px 12px rgba(0, 0, 0, 0.06)",  // 루틴 카드
        nav:   "0 -1px 12px rgba(0, 0, 0, 0.08)", // 하단 탭 바
        modal: "0 8px 32px rgba(0, 0, 0, 0.16)",  // 모달
      },
    },
  },
  plugins: [],
};
