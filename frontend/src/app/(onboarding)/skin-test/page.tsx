"use client";

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { SKIN_TEST_OPTIONS } from "@/constants";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const STEP_INDICATOR_STYLE = { fontSize: "15px" };
const TITLE_STYLE = { fontSize: "24px", lineHeight: 1.4 };
const OPTION_BADGE_STYLE = { borderRadius: "8px" };
const OPTION_TITLE_STYLE = { fontSize: "16px", marginTop: "10px" };
const OPTION_DESC_STYLE = {
  fontSize: "15px",
  marginTop: "4px",
  lineHeight: 1.5,
};
const BOTTOM_BG = "linear-gradient(transparent, var(--color-warm-bg) 30%)";
const NEXT_BTN_BASE = {
  height: "52px",
  borderRadius: "32px",
  fontSize: "15px",
};
const SKIP_BTN_STYLE = { fontSize: "14px", padding: "8px 0" };
const BOTTOM_SPACER = { height: "120px" };

export default function SkinTestPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    const opt = SKIN_TEST_OPTIONS.find((o) => o.key === selected);
    if (opt) router.push(opt.href);
  };

  return (
    <div className="flex flex-col min-h-full px-6 bg-warm-bg">
      <div className="flex items-center justify-between pt-4 pb-2">
        <button
          onClick={() => router.push("/home")}
          className="p-2 -ml-2 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
        <span
          className="text-text-muted font-medium"
          style={STEP_INDICATOR_STYLE}
        >
          1/3 단계
        </span>
      </div>

      <div className="mt-8">
        <h1 className="text-text-primary font-medium" style={TITLE_STYLE}>
          내 피부 타입을
          <br />
          알려주세요
        </h1>
      </div>

      <div className="mt-8 flex flex-col gap-3">
        {SKIN_TEST_OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.key;
          return (
            <button
              key={option.key}
              onClick={() => setSelected(option.key)}
              className="w-full text-left p-5 transition-all duration-200 cursor-pointer relative"
              style={{
                borderRadius: "16px",
                backgroundColor: isSelected
                  ? "var(--color-brand-bg)"
                  : "var(--color-warm-bg)",
                border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#E8E0D0"}`,
                boxShadow: isSelected
                  ? "0px 4px 12px rgba(162,170,123,0.15)"
                  : "0px 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {option.badge && (
                <span
                  className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5 bg-brand-bg text-brand"
                  style={OPTION_BADGE_STYLE}
                >
                  {option.badge}
                </span>
              )}
              <div className={isSelected ? "text-brand" : "text-text-faint"}>
                <Icon size={24} />
              </div>
              <p
                className="text-text-primary font-semibold"
                style={OPTION_TITLE_STYLE}
              >
                {option.title}
              </p>
              <p className="text-text-muted" style={OPTION_DESC_STYLE}>
                {option.desc}
              </p>
            </button>
          );
        })}
      </div>

      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-8 pt-3"
        style={{ background: BOTTOM_BG }}
      >
        <button
          onClick={handleNext}
          className="w-full transition-all duration-200 border-none font-semibold"
          style={{
            ...NEXT_BTN_BASE,
            backgroundColor: selected
              ? "var(--color-brand)"
              : "var(--color-border-warm)",
            color: selected ? "#FFFFFF" : "var(--color-text-faint)",
            cursor: selected ? "pointer" : "default",
          }}
        >
          다음
        </button>
        <button
          onClick={() => router.push("/home")}
          className="w-full mt-2 bg-transparent border-none cursor-pointer text-text-faint"
          style={SKIP_BTN_STYLE}
        >
          건너뛰기
        </button>
      </div>

      <div style={BOTTOM_SPACER} />
    </div>
  );
}
