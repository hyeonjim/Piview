"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const TYPE_ICON_STYLE = {
  width: "64px",
  height: "64px",
  borderRadius: "50%",
  fontSize: "32px",
};
const COMPLETE_BADGE = {
  padding: "6px 16px",
  borderRadius: "12px",
  fontSize: "15px",
  letterSpacing: "0.5px",
};
const TYPE_DESC_STYLE = { fontSize: "15px" };
const TYPE_LABEL_STYLE = {
  fontSize: "36px",
  marginTop: "6px",
  letterSpacing: "-0.5px",
};
const AGE_TEXT_STYLE = { fontSize: "14px", marginTop: "4px" };
const SUMMARY_CARD_STYLE = { borderRadius: "16px" };
const EMOJI_STYLE = { fontSize: "20px", marginTop: "1px" };
const SECTION_LABEL = { fontSize: "13px", marginBottom: "2px" };
const CONCERN_CHIP_STYLE = {
  fontSize: "14px",
  padding: "3px 10px",
  borderRadius: "8px",
  backgroundColor: "white",
  border: "1px solid var(--color-brand-light)",
};
const NONE_TEXT_STYLE = { fontSize: "15px" };
const DIVIDER_STYLE = {
  height: "1px",
  backgroundColor: "var(--color-brand-light)",
};
const INSIGHT_CARD_STYLE = {
  borderRadius: "16px",
  backgroundColor: "#EBF4FF",
  border: "1px solid #BBDEFB",
};
const INSIGHT_TITLE = { fontSize: "14px", fontWeight: 700, color: "#1565C0" };
const INSIGHT_TEXT_STYLE = { fontSize: "14px", lineHeight: 1.7 };

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { X, Lightbulb, ArrowRight } from "lucide-react";
import { SKIN_TYPE_INFO, DEFAULT_SKIN_TYPE } from "@/constants";

function ResultContent() {
  const router = useRouter();
  const params = useSearchParams();
  const skinType = params.get("type") || "combination";
  const concerns = params.get("concerns")?.split(",").filter(Boolean) || [
    "수분 부족",
    "모공",
  ];
  const allergies = params.get("allergies")?.split(",").filter(Boolean) || [];
  const ageGroup = params.get("age") || null;

  const typeInfo = SKIN_TYPE_INFO[skinType] || DEFAULT_SKIN_TYPE;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex justify-end px-6 pt-4">
        <button
          onClick={() => router.push("/home")}
          className="p-2 bg-transparent border-none cursor-pointer"
        >
          <X size={22} color="#2C2C2C" />
        </button>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {/* 아이콘 */}
        <div className="flex justify-center mt-4">
          <div
            className="flex items-center justify-center bg-brand-bg"
            style={TYPE_ICON_STYLE}
          >
            {typeInfo.emoji}
          </div>
        </div>

        {/* 뱃지 */}
        <div className="flex justify-center mt-5">
          <span
            className="bg-brand text-white font-semibold"
            style={COMPLETE_BADGE}
          >
            진단 완료!
          </span>
        </div>

        {/* 결과 */}
        <div className="text-center mt-5">
          <p className="text-text-muted" style={TYPE_DESC_STYLE}>
            회원님의 피부 타입은
          </p>
          <p className="text-brand font-bold" style={TYPE_LABEL_STYLE}>
            {typeInfo.label}
          </p>
          {ageGroup && (
            <p className="text-text-faint" style={AGE_TEXT_STYLE}>
              연령대: {ageGroup}
            </p>
          )}
        </div>

        {/* 요약 카드 */}
        <div className="mt-6 p-5 bg-brand-bg" style={SUMMARY_CARD_STYLE}>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span style={EMOJI_STYLE}>💪</span>
              <div>
                <p className="text-text-faint" style={SECTION_LABEL}>
                  피부 고민
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {concerns.length > 0 ? (
                    concerns.map((c) => (
                      <span
                        key={c}
                        className="text-brand font-semibold"
                        style={CONCERN_CHIP_STYLE}
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <p
                      className="text-text-primary font-semibold"
                      style={NONE_TEXT_STYLE}
                    >
                      없음
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div style={DIVIDER_STYLE} />

            <div className="flex items-start gap-3">
              <span style={EMOJI_STYLE}>⚠️</span>
              <div>
                <p className="text-text-faint" style={SECTION_LABEL}>
                  주의 성분
                </p>
                <p
                  className="text-text-primary font-semibold"
                  style={NONE_TEXT_STYLE}
                >
                  {allergies.length > 0 ? allergies.join(", ") : "없음"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 인사이트 카드 (디자인 고유색 유지) */}
        <div className="mt-4 p-5" style={INSIGHT_CARD_STYLE}>
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={17} color="#2196F3" />
            <p style={INSIGHT_TITLE}>맞춤 인사이트</p>
          </div>
          <p className="text-text-primary" style={INSIGHT_TEXT_STYLE}>
            {typeInfo.insight}
          </p>
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="px-6 pb-10 pt-3 flex flex-col gap-3">
        <button
          onClick={() => router.push("/mypage")}
          className="w-full flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer border-none bg-brand text-white font-semibold"
          style={{
            height: "54px",
            borderRadius: "32px",
            fontSize: "15px",
            boxShadow: "0px 4px 16px rgba(162,170,123,0.35)",
          }}
        >
          내 제품 등록하러 가기 <ArrowRight size={18} color="white" />
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
