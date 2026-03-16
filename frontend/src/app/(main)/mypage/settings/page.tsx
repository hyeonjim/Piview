"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Camera } from "lucide-react";
import Link from "next/link";
import {
  SETTINGS_SKIN_TYPES,
  SETTINGS_SKIN_CONCERNS,
  SETTINGS_ALLERGIES,
} from "@/constants/userSettings";
import { useUserStore, selectSkinType } from "@/stores/useUserStore";
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
  const storedAvoidContents = useUserStore((s) => s.avoidContents);
  const storedConcerns = useUserStore((s) => s.concerns);
  const { setSkinType, setAvoidContents, setConcerns: setConcernsStore } = useUserStore();

  // 로컬 상태 — store 값으로 초기화
  const [skinType, setSkinTypeLocal] = useState<string>(storedSkinType ?? "");
  const [concerns, setConcernsLocal] = useState<Set<string>>(new Set(storedConcerns));
  const [allergies, setAllergies] = useState<Set<string>>(
    new Set(storedAvoidContents.map((a) => a.avoidContent)),
  );

  // store 값 변경 시 동기화 (페이지 재진입 대응)
  useEffect(() => {
    if (storedSkinType) setSkinTypeLocal(storedSkinType);
  }, [storedSkinType]);

  useEffect(() => {
    setConcernsLocal(new Set(storedConcerns));
  }, [storedConcerns]);

  const toggleConcern = (label: string) =>
    setConcernsLocal((prev: Set<string>) => {
      const n = new Set(prev);
      n.has(label) ? n.delete(label) : n.add(label);
      return n;
    });

  const toggleAllergy = (label: string) =>
    setAllergies((prev) => {
      const n = new Set(prev);
      n.has(label) ? n.delete(label) : n.add(label);
      return n;
    });

  const handleSave = () => {
    // 피부타입 저장
    if (skinType) setSkinType(skinType as SkinType);

    // 알러지 성분 저장 — ⚠️ API 연동 시 avoidContentsService.save()로 교체
    setAvoidContents(
      [...allergies].map((label, idx) => ({
        id: idx,
        userId: 0,
        avoidContent: label,
      })),
    );

    // 피부 고민 저장 — ⚠️ API 연동 시 mySkinProblemsService.save()로 교체
    setConcernsStore([...concerns]);

    router.back();
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
          피부 설정
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto px-[30px]">
        {/* 피부타입 */}
        <div className="mt-5">
          <SectionTitle icon="🧴" title="나의 피부타입" />
          <p className="text-xs text-text-muted mb-3">하나를 선택해주세요</p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SKIN_TYPES.map((st) => {
              const isActive = skinType === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSkinTypeLocal(st.id)}
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-chip text-sm font-medium cursor-pointer transition-all border select-none ${
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
          <p className="text-xs text-text-muted mb-3">
            해당하는 고민을 모두 선택해주세요
          </p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_SKIN_CONCERNS.map((c) => {
              const isActive = concerns.has(c.label);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleConcern(c.label)}
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-chip text-sm font-medium cursor-pointer transition-all border select-none ${
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

        {/* 알러지 */}
        <div>
          <SectionTitle icon="⚠️" title="알러지 / 기피 성분" />
          <p className="text-xs text-text-muted mb-3">
            피하고 싶은 성분을 선택해주세요
          </p>
          <div className="flex flex-wrap gap-2">
            {SETTINGS_ALLERGIES.map((a) => {
              const isActive = allergies.has(a.label);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAllergy(a.label)}
                  className={`inline-flex items-center gap-1 px-4 py-2 rounded-chip text-sm font-medium cursor-pointer transition-all border select-none ${
                    isActive
                      ? "bg-warm text-white border-warm shadow-[0_2px_8px_rgba(194,140,126,0.25)]"
                      : "bg-white text-text-primary border-border"
                  }`}
                >
                  {isActive && <Check size={14} />}
                  {a.label}
                </button>
              );
            })}
          </div>
        </div>

        <Divider />

        {/* 재진단 */}
        <div>
          <SectionTitle icon="🔄" title="피부 진단 다시하기" />
          <p className="text-xs text-text-muted mb-4">
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
        <div className="mt-6 mb-10 flex justify-center">
          <button
            onClick={handleSave}
            className="w-[200px] h-11 rounded-button bg-brand text-white font-semibold text-[15px] border-none cursor-pointer shadow-[0_4px_16px_rgba(162,170,123,0.2)] transition-all active:scale-[0.98]"
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
