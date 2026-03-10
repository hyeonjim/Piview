"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import { X, Lightbulb, ArrowRight } from "lucide-react";

const SKIN_TYPE_INFO: Record<
  string,
  { label: string; emoji: string; insight: string }
> = {
  dry: {
    label: "건성 피부",
    emoji: "💧",
    insight:
      "수분 장벽이 약한 편이에요. 히알루론산, 세라마이드 성분이 풍부한 제품을 사용하고, 세안 후 바로 수분 크림을 발라 수분을 잠가주세요.",
  },
  oily: {
    label: "지성 피부",
    emoji: "💦",
    insight:
      "피지 분비가 왕성한 편이에요. 가벼운 젤 타입 보습제와 BHA 성분으로 모공을 관리하고, 논코메도제닉 제품을 선택하세요.",
  },
  combination: {
    label: "복합성 피부",
    emoji: "🔀",
    insight:
      "T존과 볼 부위의 특성이 달라요. 부위별로 다른 케어가 효과적이에요. 오일-프리 제품으로 T존을 관리하고 볼에는 충분한 수분을 공급해주세요.",
  },
  sensitive: {
    label: "민감성 피부",
    emoji: "🌹",
    insight:
      "자극에 예민한 피부예요. 향료, 알코올, 인공색소가 없는 제품을 선택하고, 새 제품은 패치 테스트 후 사용하세요.",
  },
};

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
  const typeInfo = SKIN_TYPE_INFO[skinType] || SKIN_TYPE_INFO.combination;

  return (
    <div className="flex flex-col min-h-full bg-white">
      <div className="flex justify-end px-6 pt-4">
        <button
          onClick={() => router.push("/home")}
          className="p-2 bg-transparent border-none cursor-pointer"
        >
          <X size={22} className="text-text-primary" />
        </button>
      </div>

      <div className="flex-1 px-6 pb-8 overflow-y-auto">
        {/* 이모지 아이콘 */}
        <div className="flex justify-center mt-4">
          <div
            className="flex items-center justify-center bg-brand-bg"
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              fontSize: "36px",
            }}
          >
            {typeInfo.emoji}
          </div>
        </div>

        {/* 진단 완료 뱃지 */}
        <div className="flex justify-center mt-5">
          <span
            className="bg-brand text-white font-semibold"
            style={{
              padding: "6px 20px",
              borderRadius: "12px",
              fontSize: "14px",
              letterSpacing: "0.5px",
            }}
          >
            진단 완료!
          </span>
        </div>

        {/* 결과 */}
        <div className="text-center mt-5">
          <p className="text-text-muted" style={{ fontSize: "15px" }}>
            회원님의 피부 타입은
          </p>
          <p
            className="text-brand font-bold"
            style={{
              fontSize: "36px",
              marginTop: "6px",
              letterSpacing: "-0.5px",
            }}
          >
            {typeInfo.label}
          </p>
          {ageGroup && (
            <p
              className="text-text-faint"
              style={{ fontSize: "14px", marginTop: "4px" }}
            >
              연령대: {ageGroup}
            </p>
          )}
        </div>

        {/* 상세 카드 */}
        <div className="mt-8 p-6 bg-brand-bg" style={{ borderRadius: "16px" }}>
          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3">
              <span style={{ fontSize: "20px", marginTop: "1px" }}>🎯</span>
              <div>
                <p
                  className="text-text-faint"
                  style={{ fontSize: "13px", marginBottom: "2px" }}
                >
                  피부 타입
                </p>
                <p
                  className="text-text-primary font-semibold"
                  style={{ fontSize: "15px" }}
                >
                  {typeInfo.label}
                </p>
              </div>
            </div>
            <div className="border-0 bg-brand/30" style={{ height: "1px" }} />
            <div className="flex items-start gap-3">
              <span style={{ fontSize: "20px", marginTop: "1px" }}>😟</span>
              <div>
                <p
                  className="text-text-faint"
                  style={{ fontSize: "13px", marginBottom: "2px" }}
                >
                  피부 고민
                </p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {concerns.length > 0 ? (
                    concerns.map((c) => (
                      <span
                        key={c}
                        className="bg-white text-brand font-semibold"
                        style={{
                          fontSize: "13px",
                          padding: "2px 10px",
                          borderRadius: "20px",
                          border: "1px solid var(--color-brand-bg)",
                        }}
                      >
                        {c}
                      </span>
                    ))
                  ) : (
                    <p
                      className="text-text-primary font-semibold"
                      style={{ fontSize: "15px" }}
                    >
                      없음
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="bg-brand/30" style={{ height: "1px" }} />
            <div className="flex items-start gap-3">
              <span style={{ fontSize: "20px", marginTop: "1px" }}>⚠️</span>
              <div>
                <p
                  className="text-text-faint"
                  style={{ fontSize: "13px", marginBottom: "2px" }}
                >
                  주의 성분
                </p>
                <p
                  className="text-text-primary font-semibold"
                  style={{ fontSize: "15px" }}
                >
                  {allergies.length > 0 ? allergies.join(", ") : "없음"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 인사이트 카드 — 파란색은 브랜드 고유 UI라 CSS 변수 없음, 직접 값 유지 */}
        <div
          className="mt-4 p-5"
          style={{
            borderRadius: "16px",
            backgroundColor: "#EBF4FF",
            border: "1px solid #BBDEFB",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Lightbulb size={17} color="#2196F3" />
            <p
              className="font-bold"
              style={{ fontSize: "14px", color: "#1565C0" }}
            >
              맞춤 인사이트
            </p>
          </div>
          <p
            className="text-text-primary"
            style={{ fontSize: "14px", lineHeight: 1.7 }}
          >
            {typeInfo.insight}
          </p>
        </div>
      </div>

      {/* 하단 CTA */}
      <div className="px-6 pb-10 pt-3 flex flex-col gap-3">
        <button
          onClick={() => router.push("/routine")}
          className="w-full flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer bg-brand text-white font-semibold border-none"
          style={{
            height: "54px",
            borderRadius: "32px",
            fontSize: "15px",
            boxShadow: "0px 4px 16px rgba(162,170,123,0.35)",
          }}
        >
          내 제품 등록하러 가기 <ArrowRight size={18} color="white" />
        </button>
        <button
          onClick={() => router.push("/home")}
          className="w-full bg-transparent border-none cursor-pointer text-text-faint"
          style={{ fontSize: "14px", padding: "8px 0" }}
        >
          홈으로 돌아가기
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
