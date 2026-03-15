// ⚠️ 미연결 컴포넌트 — 백엔드 연동 시 페이지에 연결 예정
/**
 * components/features/mypage/ProfileCard.tsx
 *
 * 마이페이지 상단 프로필 카드.
 * 이름·피부타입·나이대 표시.
 */

"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const CARD_STYLE = {
  borderRadius: "20px",
  backgroundColor: "#F8F6F0",
  border: "1px solid #EAE5DA",
};
const AVATAR_STYLE = {
  width: "52px",
  height: "52px",
  borderRadius: "50%",
  backgroundColor: "var(--color-brand)",
};
const AVATAR_ICON_STYLE = { fontSize: "22px" };
const NAME_TEXT_STYLE = {
  fontSize: "18px",
  fontWeight: 700,
  color: "#1A1A1A",
  margin: 0,
};
const META_TEXT_STYLE = {
  fontSize: "12px",
  color: "#9E9E9E",
  margin: "2px 0 0",
};
const SETTINGS_BTN_STYLE = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  backgroundColor: "white",
  border: "1px solid #EAE5DA",
};
const SKIN_TEST_BTN_STYLE = {
  fontSize: "13px",
  fontWeight: 600,
  padding: "5px 14px",
  borderRadius: "20px",
  backgroundColor: "var(--color-brand)",
  color: "white",
};

import { Settings } from "lucide-react";
import Link from "next/link";

interface Props {
  name: string | null;
  skinType: string | null;
  ageGroup?: string | null;
  gender?: string | null;
}

const SKIN_TYPE_LABEL: Record<string, string> = {
  건성: "🌵 건성",
  지성: "💦 지성",
  복합성: "⚖️ 복합성",
  수부지: "💧 수부지",
};

export function ProfileCard({ name, skinType, ageGroup, gender }: Props) {
  return (
    <div className="mx-5 mb-5 p-5" style={CARD_STYLE}>
      <div className="flex items-start justify-between">
        {/* 아바타 + 이름 */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center"
            style={AVATAR_STYLE}
          >
            <span style={AVATAR_ICON_STYLE}>👤</span>
          </div>
          <div>
            <p style={NAME_TEXT_STYLE}>{name ?? "User"}님</p>
            <p style={META_TEXT_STYLE}>
              {[
                ageGroup,
                gender === "female"
                  ? "여성"
                  : gender === "male"
                    ? "남성"
                    : null,
              ]
                .filter(Boolean)
                .join(" · ") || "프로필을 설정해보세요"}
            </p>
          </div>
        </div>

        {/* 설정 링크 */}
        <Link href="/mypage/settings">
          <button
            className="flex items-center justify-center cursor-pointer"
            style={SETTINGS_BTN_STYLE}
          >
            <Settings size={16} color="#9E9E9E" />
          </button>
        </Link>
      </div>

      {/* 피부타입 뱃지 */}
      {skinType && (
        <div className="mt-3 flex items-center gap-2">
          <span style={SKIN_TEST_BTN_STYLE}>
            {SKIN_TYPE_LABEL[skinType] ?? skinType}
          </span>
        </div>
      )}
    </div>
  );
}
