"use client";

import { useState } from "react";
import { Camera, Target, ClipboardList, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

const PRIMARY = "#A2AA7B";
const PRIMARY_BG = "#F0F2E8";

const OPTIONS = [
  {
    key: "photo",
    href: "/skin-test/camera",
    icon: Camera,
    title: "AI 사진 분석",
    desc: "얼굴 사진으로 AI가 피부 타입을 분석해요",
    badge: "추천",
  },
  {
    key: "know",
    href: "/skin-test/select",
    icon: Target,
    title: "알고 있어요",
    desc: "피부 타입을 직접 선택합니다",
  },
  {
    key: "quiz",
    href: "/skin-test/quiz",
    icon: ClipboardList,
    title: "잘 모르겠어요",
    desc: "간단한 퀴즈로 진단받기",
  },
];

export default function SkinTestPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(null);

  const handleNext = () => {
    const opt = OPTIONS.find((o) => o.key === selected);
    if (opt) router.push(opt.href);
  };

  return (
    <div
      className="flex flex-col min-h-full px-6"
      style={{ backgroundColor: "#FFFAF5" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between pt-4 pb-2">
        <button
          onClick={() => router.push("/home")}
          className="p-2 -ml-2 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={22} color="#1a1a1a" />
        </button>
        <span style={{ fontSize: "15px", color: "#9E9E9E", fontWeight: 500 }}>
          1/3 단계
        </span>
      </div>

      {/* Title */}
      <div className="mt-8">
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 500,
            color: "#1a1a1a",
            lineHeight: 1.4,
          }}
        >
          내 피부 타입을
          <br />
          알려주세요
        </h1>
      </div>

      {/* Options */}
      <div className="mt-8 flex flex-col gap-3">
        {OPTIONS.map((option) => {
          const Icon = option.icon;
          const isSelected = selected === option.key;
          return (
            <button
              key={option.key}
              onClick={() => setSelected(option.key)}
              className="w-full text-left p-5 transition-all duration-200 cursor-pointer relative"
              style={{
                borderRadius: "16px",
                backgroundColor: isSelected ? PRIMARY_BG : "#FFFAF5",
                border: `1.5px solid ${isSelected ? PRIMARY : "#F0F0F0"}`,
                boxShadow: isSelected
                  ? "0px 4px 12px rgba(162,170,123,0.15)"
                  : "0px 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              {option.badge && (
                <span
                  className="absolute top-4 right-4 text-xs font-semibold px-2 py-0.5"
                  style={{
                    borderRadius: "8px",
                    backgroundColor: PRIMARY_BG,
                    color: PRIMARY,
                  }}
                >
                  {option.badge}
                </span>
              )}
              <div style={{ color: isSelected ? PRIMARY : "#AFAFAF" }}>
                <Icon size={24} />
              </div>
              <p
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#1a1a1a",
                  marginTop: "10px",
                }}
              >
                {option.title}
              </p>
              <p
                style={{
                  fontSize: "15px",
                  color: "#9E9E9E",
                  marginTop: "4px",
                  lineHeight: 1.5,
                }}
              >
                {option.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* Bottom Buttons */}
      <div
        className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] px-5 pb-8 pt-3"
        style={{ background: "linear-gradient(transparent, #FFFAF5 30%)" }}
      >
        <button
          onClick={handleNext}
          className="w-full transition-all duration-200"
          style={{
            height: "52px",
            borderRadius: "32px",
            backgroundColor: selected ? PRIMARY : "#E8E0D0",
            color: selected ? "#FFFFFF" : "#AFAFAF",
            fontSize: "15px",
            fontWeight: 600,
            border: "none",
            cursor: selected ? "pointer" : "default",
          }}
        >
          다음
        </button>
        <button
          onClick={() => router.push("/home")}
          className="w-full mt-2 bg-transparent border-none cursor-pointer"
          style={{ fontSize: "14px", color: "#AFAFAF", padding: "8px 0" }}
        >
          건너뛰기
        </button>
      </div>

      <div style={{ height: "120px" }} />
    </div>
  );
}
