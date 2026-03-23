"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Camera } from "lucide-react";
import Link from "next/link";
import { useUserStore, selectSkinType } from "@/stores/useUserStore";

/** 설정 페이지 피부타입 (id = 한글 레이블, settings에서 직접 저장) */
const SETTINGS_SKIN_TYPES = [
  { id: "건성",  label: "건성"  },
  { id: "지성",  label: "지성"  },
  { id: "복합성", label: "복합성" },
  { id: "수부지", label: "수부지" },
] as const;

/** 설정 페이지 피부 고민 — 백엔드 SkinProblemMapper 키값과 일치 */
const SETTINGS_SKIN_CONCERNS = [
  { id: "acne",         label: "여드름"          },
  { id: "whitening",    label: "미백"            },
  { id: "pigmentation", label: "기미/주근깨/잡티" },
  { id: "wrinkles",     label: "주름/탄력"       },
  { id: "sebum",        label: "피지"            },
  { id: "blackhead",    label: "블랙헤드"        },
  { id: "innerDryness", label: "속건조"          },
  { id: "redness",      label: "홍조"            },
  { id: "keratin",      label: "각질"            },
] as const;
import { useUpdateProfile } from "@/hooks/queries/useUserQuery";
import { toSkinTypeEnum } from "@/utils/enumConvert";
import { authService } from "@/services/auth";
import type { SkinType } from "@/types/user";

/** 피부타입·피부고민 선택 칩 공통 클래스 */
function chipClassName(isActive: boolean) {
  return `inline-flex items-center gap-1 px-3 py-1.5 rounded-chip text-sm font-semibold cursor-pointer transition-all border select-none ${
    isActive
      ? "bg-brand text-white border-brand shadow-[0_2px_8px_rgba(162,170,123,0.2)]"
      : "bg-white text-text-primary border-border"
  }`;
}

function Divider() {
  return <div className="h-px bg-border my-6" />;
}

export default function SettingsPage() {
  const router = useRouter();

  // store에서 기존 설정값 읽기
  const storedSkinType = useUserStore(selectSkinType);
  const storedConcerns = useUserStore((s) => s.concerns);
  const clearUser = useUserStore((s) => s.clearUser);
  const { mutate: updateProfile, isPending } = useUpdateProfile();

  // 로컬 상태 — store 값으로 초기화
  const [skinType, setSkinTypeLocal] = useState<string>(storedSkinType ?? "");
  const [concerns, setConcernsLocal] = useState<Set<string>>(new Set(storedConcerns));

  const toggleConcern = (label: string) =>
    setConcernsLocal((prev: Set<string>) => {
      const next = new Set(prev);
      if (next.has(label)) { next.delete(label); } else { next.add(label); }
      return next;
    });

  // 피부타입 + 피부 고민 → PATCH /users/me로 저장
  const handleSave = () => {
    updateProfile(
      {
        ...(skinType && {
          mySkinType: toSkinTypeEnum(skinType as SkinType),
        }),
        skinProblems: [...concerns],
      },
      { onSuccess: () => router.back() },
    );
  };

  // 로그아웃 — 백엔드 쿠키 만료 후 store 초기화
  const handleLogout = async () => {
    if (!confirm("로그아웃 하시겠습니까?")) return;
    try {
      await authService.logout();
    } finally {
      clearUser();
      router.push("/");
    }
  };

  return (
    <div className="min-h-screen bg-warm-bg">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 px-5 pt-5 pb-3 flex items-center gap-3 bg-warm-bg">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-7.5 h-7.5 rounded-full bg-white border-none cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </button>
        <h2 className="text-lg font-bold text-text-primary tracking-[0.5px]">
          Settings
        </h2>
      </div>

      <div className="px-7.5">
        {/* 피부타입 */}
        <div className="mt-5">
          <h3 className="text-base font-bold text-text-primary mb-1.5">나의 피부타입</h3>
          <p className="text-[14px] text-text-muted mb-5">하나를 선택해주세요</p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SKIN_TYPES.map((st) => (
              <button
                key={st.id}
                onClick={() => setSkinTypeLocal(st.id)}
                className={chipClassName(skinType === st.id)}
              >
                {st.label}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* 피부고민 */}
        <div>
          <h3 className="text-base font-bold text-text-primary mb-1.5">피부 고민</h3>
          <p className="text-xs text-text-muted mb-5">
            해당하는 고민을 모두 선택해주세요
          </p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SKIN_CONCERNS.map((c) => (
              <button
                key={c.id}
                onClick={() => toggleConcern(c.label)}
                className={chipClassName(concerns.has(c.label))}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        <Divider />

        {/* 재진단 */}
        <div>
          <h3 className="text-base font-bold text-text-primary mb-1.5">피부 진단 다시하기</h3>
          <p className="text-xs text-text-muted mb-5">
            AI 사진 분석으로 피부 상태를 다시 진단할 수 있어요
          </p>
          <Link
            href="/skin-test/photo"
            className="flex items-center gap-3 w-full p-4 cursor-pointer transition-all duration-200 active:scale-[0.98] bg-white border border-border rounded-card"
          >
            <div className="flex items-center justify-center shrink-0 w-11 h-11 rounded-[14px] bg-brand-bg">
              <Camera size={22} className="text-brand" />
            </div>
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold text-text-primary">
                AI 사진 분석
              </span>
              <span className="text-xs text-text-muted mt-0.5">
                셀피를 촬영해 피부 상태를 분석해요
              </span>
            </div>
          </Link>
        </div>

        {/* 저장 버튼 */}
        <div className="m-10 flex justify-center">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-50 h-12 rounded-button bg-brand text-white font-bold text-[18px] border-none cursor-pointer shadow-[0_4px_16px_rgba(162,170,123,0.2)] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? "저장 중..." : "저장하기"}
          </button>
        </div>

        {/* 로그아웃 버튼 */}
        <div className="mt-20 mb-10 flex justify-center">
          <button
            onClick={handleLogout}
            className="w-50 h-11 rounded-button text-gray-700 font-bold text-[16px] border border-border cursor-pointer transition-all active:scale-[0.98] hover:bg-red-100 hover:text-red-800 hover:border-red-200"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
