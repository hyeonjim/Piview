"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Camera } from "lucide-react";
import Link from "next/link";
import {
  SETTINGS_SKIN_TYPES,
  SETTINGS_SKIN_CONCERNS,
} from "@/constants/userSettings";
import { useUserStore, selectSkinType } from "@/stores/useUserStore";
import { useUpdateProfile } from "@/hooks/queries/useUserQuery";
import { toSkinTypeEnum } from "@/utils/enumConvert";
import type { SkinType } from "@/types/user";

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h3 className="text-base font-semibold text-text-primary mb-1.5 flex items-center gap-2">
      <span>{icon}</span>
      {title}
    </h3>
  );
}

function Divider() {
  return <div className="h-px bg-border my-6" />;
}

export default function SettingsPage() {
  const router = useRouter();

  // store에서 기존 설정값 읽기
  const storedSkinType = useUserStore(selectSkinType);
  const storedConcerns = useUserStore((s) => s.concerns);
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

  const handleSave = () => {
    // 피부타입 + 피부 고민 → PATCH /users/me로 저장
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

  return (
    <div className="flex flex-col min-h-full bg-warm-bg">
      {/* 헤더 */}
      <div className="sticky top-0 z-10 px-5 pt-5 pb-3 flex items-center gap-3 bg-warm-bg">
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-white border-none cursor-pointer shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
        >
          <ChevronLeft size={20} className="text-text-primary" />
        </button>
        <h2 className="text-lg font-semibold text-text-primary tracking-[0.5px]">
          Settings
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-[30px]">
        {/* 피부타입 */}
        <div className="mt-5">
          <SectionTitle icon="🧴" title="나의 피부타입" />
          <p className="text-xs text-text-muted mb-5">하나를 선택해주세요</p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SKIN_TYPES.map((st) => {
              const isActive = skinType === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSkinTypeLocal(st.id)}
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-chip text-sm font-semibold cursor-pointer transition-all border select-none ${
                    isActive
                      ? "bg-brand text-white border-brand shadow-[0_2px_8px_rgba(162,170,123,0.2)]"
                      : "bg-white text-text-primary border-border"
                  }`}
                >
                  {st.label}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 피부고민 */}
        <div>
          <SectionTitle icon="💭" title="피부 고민" />
          <p className="text-xs text-text-muted mb-5">
            해당하는 고민을 모두 선택해주세요
          </p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SKIN_CONCERNS.map((c) => {
              const isActive = concerns.has(c.label);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleConcern(c.label)}
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-chip text-sm font-semibold cursor-pointer transition-all border select-none ${
                    isActive
                      ? "bg-brand text-white border-brand shadow-[0_2px_8px_rgba(162,170,123,0.2)]"
                      : "bg-white text-text-primary border-border"
                  }`}
                >
                  {isActive && <Check size={14} />}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 재진단 */}
        <div>
          <SectionTitle icon="🔄" title="피부 진단 다시하기" />
          <p className="text-xs text-text-muted mb-5">
            AI 사진 분석으로 피부 상태를 다시 진단할 수 있어요
          </p>
          <Link
            href="/skin-test/photo"
            className="flex items-center gap-3 w-full p-4 cursor-pointer transition-all duration-200 active:scale-[0.98] bg-white border border-border rounded-card"
          >
            {/* 카메라 아이콘 — 베이지 팔레트 적용 */}
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
        <div className="m-6 flex justify-center">
          <button
            onClick={handleSave}
            disabled={isPending}
            className="w-[200px] h-11 rounded-button bg-brand text-white font-semibold text-[16px] border-none cursor-pointer shadow-[0_4px_16px_rgba(162,170,123,0.2)] transition-all active:scale-[0.98] disabled:opacity-60"
          >
            {isPending ? "저장 중..." : "저장하기"}
          </button>
        </div>

        {/* 로그아웃 버튼 */}
        <div className="mt-20 mb-10 flex justify-center">
          <button
            onClick={() => {
              // TODO: 로그아웃 로직 구현
              // 예: localStorage.removeItem('token'), router.push('/login')
              if (confirm('로그아웃 하시겠습니까?')) {
                router.push('/');
              }
            }}
            className="w-[200px] h-11 rounded-button text-gray-700 font-bold text-[16px] border border-border cursor-pointer transition-all active:scale-[0.98] hover:bg-red-100 hover:text-red-800 hover:border-red-200"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
