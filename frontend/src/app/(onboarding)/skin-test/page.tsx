"use client";

import { ArrowLeft, Camera, Target } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useRouter } from "next/navigation";

/** 피부 진단 방법 선택 옵션 (AI 사진 / 직접 선택) */
interface SkinTestOption {
  key: string;
  href: string;
  icon: LucideIcon;
  title: string;
  desc: string;
}

const SKIN_TEST_OPTIONS: SkinTestOption[] = [
  {
    key: "photo",
    href: "/skin-test/photo",
    icon: Camera,
    title: "AI 사진 분석",
    desc: "얼굴 사진으로 AI가 피부 타입을 분석해요",
  },
  {
    key: "know",
    href: "/skin-test/select",
    icon: Target,
    title: "알고 있어요",
    desc: "피부 타입을 직접 선택합니다",
  },
];

export default function SkinTestPage() {
  const router = useRouter();

  return (
    <div className="flex flex-col min-h-screen px-10 bg-warm-bg">
      <div className="flex items-center pt-4 pb-2">
        <button
          onClick={() => router.push("/welcome")}
          className="p-2 -ml-2 bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={22} className="text-text-primary" />
        </button>
      </div>

      <div className="mt-8">
        <h1 className="text-text-primary font-bold text-2xl leading-[1.4]">
          내 피부 타입을 설정합니다
        </h1>
      </div>

      {/* 피부 타입 선택 목록 — 클릭 시 바로 이동 */}
      <div className="mt-8 flex flex-col gap-3">
        {SKIN_TEST_OPTIONS.map((option) => {
          const Icon = option.icon;
          return (
            <button
              key={option.key}
              onClick={() => router.push(option.href)}
              className="group w-full text-left p-5 transition-all duration-200 cursor-pointer relative rounded-2xl border-[1.5px] bg-white border-[#E8E0D0] shadow-[0px_1px_3px_rgba(0,0,0,0.04)] hover:border-brand hover:shadow-[0px_4px_12px_rgba(162,170,123,0.15)]"
            >
              <div className="text-text-faint group-hover:text-brand transition-colors duration-200">
                <Icon size={24} />
              </div>
              <p className="text-text-primary font-bold text-[17px] mt-2.5">
                {option.title}
              </p>
              <p className="text-text-muted text-[15px] mt-1 leading-normal">
                {option.desc}
              </p>
            </button>
          );
        })}
      </div>

      {/* 하단 버튼 영역 */}
      <div className="w-[250px] mx-auto px-6 pb-10 pt-4 mt-auto">
        <button
          onClick={() => router.push("/home")}
          className="w-full h-[52px] rounded-[32px] font-bold text-[18px] transition-all duration-200 border-none bg-border-warm text-gray-800 cursor-pointer"
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
