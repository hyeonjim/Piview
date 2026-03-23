"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { SKIN_TYPES } from "@/constants";
import { useUserStore } from "@/stores";

function ResultContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // URL param으로 넘어온 피부 타입 ID (예: "dry", "oily")
  const skinTypeId = searchParams.get("type") || "combination";

  // SKIN_TYPES에서 label 조회
  const skinType = SKIN_TYPES.find((type) => type.id === skinTypeId);
  const skinLabel = skinType?.label ?? "복합성";

  // Zustand store에서 실제 저장된 데이터 읽기
  const concerns = useUserStore((state) => state.concerns);

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex-1 px-6 pb-3 mt-5 overflow-y-auto">
        {/* 뱃지 */}
        <div className="flex justify-center mt-4">
          <span className="bg-brand text-white font-semibold px-4 py-1.5 rounded-xl text-[15px] tracking-wide">
            진단 완료!
          </span>
        </div>

        {/* 결과 */}
        <div className="text-center mt-5">
          <p className="text-text-muted text-[15px]">회원님의 피부 타입은</p>
          <p className="font-bold text-[28px] mt-1.5 tracking-tight">
            {skinLabel}
          </p>
        </div>

        {/* 피부 고민 카드 */}
        <div className="mt-6 p-5 bg-brand-bg rounded-2xl">
          <div className="flex items-start gap-3">
            <span className="text-xl mt-0.5">💪</span>
            <div>
              <p className="text-text-faint text-sm mb-0.5">피부 고민</p>
              <div className="flex flex-wrap gap-1.5">
                {concerns.length > 0 ? (
                  concerns.map((concern) => (
                    <span
                      key={concern}
                      className="text-brand font-bold text-sm px-2.5 py-0.5 rounded-lg bg-white border border-brand-light"
                    >
                      {concern}
                    </span>
                  ))
                ) : (
                  <p className="text-text-primary font-semibold text-[15px]">
                    없음
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="px-26 pb-10 pt-23 flex flex-col gap-3">
        <button
          onClick={() => router.push("/mypage")}
          className="w-full h-[54px] flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer border-none bg-brand text-white font-semibold rounded-button text-[15px] shadow-[0px_4px_16px_rgba(162,170,123,0.35)]"
        >
          내 루틴 설정하기
        </button>
      </div>
    </div>
  );
}

export default function SkinTestResultPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-full text-text-faint">
          Loading...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  );
}
