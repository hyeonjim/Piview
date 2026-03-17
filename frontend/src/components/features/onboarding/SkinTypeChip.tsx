/**
 * components/features/onboarding/SkinTypeChip.tsx
 *
 * 피부 진단(quiz/select/settings) 화면의 선택형 칩.
 * 활성화 시 브랜드 컬러 적용.
 */

"use client";

import { Check } from "lucide-react";

interface Props {
  label: string;
  isActive: boolean;
  danger?: boolean;  // 알러지 칩은 붉은 계열 강조
  onClick: () => void;
}

export function SkinTypeChip({ label, isActive, danger = false, onClick }: Props) {
  const activeColor = danger ? "#C28C7E" : "var(--color-brand)";
  const activeShadow = danger ? "rgba(194,140,126,0.25)" : "rgba(162,170,123,0.25)";

  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: "30px",
        fontSize: "14px",
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.2s",
        border: `1px solid ${isActive ? activeColor : "#E0D6C8"}`,
        backgroundColor: isActive ? activeColor : "white",
        color: isActive ? "white" : "#1A1A1A",
        boxShadow: isActive ? `0 2px 8px ${activeShadow}` : "none",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        userSelect: "none",
      }}
    >
      {isActive && <Check size={14} className="inline -mt-0.5" />}
      {label}
    </button>
  );
}
