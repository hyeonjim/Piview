"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Check, Camera, ClipboardList } from "lucide-react";
import Link from "next/link";

// ── 피그마 ThemeContext 원본값 ──
const COLORS = {
  primary: "#A2AA7B",
  primaryBg: "#F0F2E8",
  accentShadow: "rgba(162,170,123,0.2)",
  warmBg: "#FFFAF5",
  border: "#F0F0F0",
  text: "#1A1A1A",
  textMuted: "#AFAFAF",
  warm: "#C28C7E",
};

// ── 피그마 constants.ts 원본값 ──
const SKIN_TYPES = [
  { id: "건성", label: "건성" },
  { id: "지성", label: "지성" },
  { id: "복합성", label: "복합성" },
  { id: "수부지", label: "수부지" },
] as const;

const SKIN_CONCERNS = [
  { id: "atopy", label: "아토피" },
  { id: "acne", label: "여드름" },
  { id: "whitening", label: "미백" },
  { id: "sebum", label: "피지/블랙헤드" },
  { id: "pigmentation", label: "기미/주근깨/잡티" },
  { id: "innerDryness", label: "속건조" },
  { id: "wrinkles", label: "주름/탄력" },
  { id: "redness", label: "홍조" },
  { id: "keratin", label: "각질" },
] as const;

const ALLERGIES = [
  { id: "fragrance", label: "향료" },
  { id: "alcohol", label: "알코올" },
  { id: "paraben", label: "파라벤" },
  { id: "sulfate", label: "설페이트(SLS)" },
  { id: "silicone", label: "실리콘" },
  { id: "mineral-oil", label: "미네랄 오일" },
  { id: "essential-oil", label: "에센셜 오일" },
  { id: "retinol", label: "레티놀" },
  { id: "aha-bha", label: "AHA/BHA" },
  { id: "niacinamide", label: "나이아신아마이드" },
] as const;

const chipBase: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "30px",
  fontSize: "14px",
  fontWeight: 500,
  cursor: "pointer",
  transition: "all 0.2s",
  border: "1px solid",
  userSelect: "none",
  display: "inline-flex",
  alignItems: "center",
  gap: "4px",
};

function SectionTitle({ icon, title }: { icon: string; title: string }) {
  return (
    <h3
      style={{
        fontSize: "16px",
        fontWeight: 600,
        color: "#1A1A1A",
        marginBottom: "6px",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      <span>{icon}</span>
      {title}
    </h3>
  );
}

function Divider() {
  return <div style={{ height: 1, backgroundColor: COLORS.border, margin: "24px 0" }} />;
}

export default function SettingsPage() {
  const router = useRouter();

  // TODO: useUserStore에서 초기값 로드
  const [skinType, setSkinType] = useState<string>("");
  const [concerns, setConcerns] = useState<Set<string>>(new Set());
  const [allergies, setAllergies] = useState<Set<string>>(new Set());

  const toggleConcern = (label: string) => {
    setConcerns((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const toggleAllergy = (label: string) => {
    setAllergies((prev) => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const handleSave = () => {
    // TODO: userService.saveDiagnosisResult() 호출 후 useUserStore 업데이트
    router.back();
  };

  return (
    <div className="flex flex-col min-h-full" style={{ backgroundColor: COLORS.warmBg }}>

      {/* ── 헤더 ── */}
      <div
        className="sticky top-0 z-10 px-5 pt-5 pb-3 flex items-center gap-3"
        style={{ backgroundColor: COLORS.warmBg }}
      >
        <button
          onClick={() => router.back()}
          className="flex items-center justify-center bg-white border-none cursor-pointer"
          style={{ width: 30, height: 30, borderRadius: "50%", boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
        >
          <ChevronLeft size={20} color={COLORS.text} />
        </button>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: COLORS.text, letterSpacing: "0.5px" }}>
          피부 설정
        </h2>
      </div>

      {/* ── 본문 ── */}
      <div className="flex-1 overflow-y-auto px-[30px] pt-0 pb-0">

        {/* 피부타입 */}
        <div className="mt-5">
          <SectionTitle icon="🧴" title="나의 피부타입" />
          <p style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "12px" }}>
            하나를 선택해주세요
          </p>
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map((st) => {
              const isActive = skinType === st.id;
              return (
                <button
                  key={st.id}
                  onClick={() => setSkinType(st.id)}
                  style={{
                    ...chipBase,
                    backgroundColor: isActive ? COLORS.primary : "white",
                    color: isActive ? "white" : COLORS.text,
                    borderColor: isActive ? COLORS.primary : COLORS.border,
                    boxShadow: isActive ? `0 2px 8px ${COLORS.accentShadow}` : "none",
                  }}
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
          <p style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "12px" }}>
            해당하는 고민을 모두 선택해주세요
          </p>
          <div className="flex flex-wrap gap-2">
            {SKIN_CONCERNS.map((c) => {
              const isActive = concerns.has(c.label);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleConcern(c.label)}
                  style={{
                    ...chipBase,
                    backgroundColor: isActive ? COLORS.primary : "white",
                    color: isActive ? "white" : COLORS.text,
                    borderColor: isActive ? COLORS.primary : COLORS.border,
                    boxShadow: isActive ? `0 2px 8px ${COLORS.accentShadow}` : "none",
                  }}
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
          <p style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "12px" }}>
            피하고 싶은 성분을 선택해주세요
          </p>
          <div className="flex flex-wrap gap-2">
            {ALLERGIES.map((a) => {
              const isActive = allergies.has(a.label);
              return (
                <button
                  key={a.id}
                  onClick={() => toggleAllergy(a.label)}
                  style={{
                    ...chipBase,
                    backgroundColor: isActive ? COLORS.warm : "white",
                    color: isActive ? "white" : COLORS.text,
                    borderColor: isActive ? COLORS.warm : COLORS.border,
                    boxShadow: isActive ? "0 2px 8px rgba(194,140,126,0.25)" : "none",
                  }}
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
          <p style={{ fontSize: "13px", color: COLORS.textMuted, marginBottom: "16px" }}>
            AI 사진 분석이나 피부타입 퀴즈를 다시 진행할 수 있어요
          </p>
          <div className="flex flex-col gap-3">
            <Link href="/skin-test/camera">
              <button
                className="flex items-center gap-3 w-full p-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: "white", border: `1px solid ${COLORS.border}`, borderRadius: "16px" }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: "#E8F5E9" }}
                >
                  <Camera size={22} color="#4CAF50" />
                </div>
                <div className="flex flex-col items-start">
                  <span style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text }}>AI 사진 분석</span>
                  <span style={{ fontSize: "13px", color: COLORS.textMuted, marginTop: 2 }}>
                    셀피를 촬영해 피부 상태를 분석해요
                  </span>
                </div>
              </button>
            </Link>

            <Link href="/skin-test/quiz">
              <button
                className="flex items-center gap-3 w-full p-4 cursor-pointer transition-all duration-200 active:scale-[0.98]"
                style={{ backgroundColor: "white", border: `1px solid ${COLORS.border}`, borderRadius: "16px" }}
              >
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: COLORS.primaryBg }}
                >
                  <ClipboardList size={22} color={COLORS.primary} />
                </div>
                <div className="flex flex-col items-start">
                  <span style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text }}>피부타입 퀴즈</span>
                  <span style={{ fontSize: "13px", color: COLORS.textMuted, marginTop: 2 }}>
                    간단한 질문으로 피부타입을 알아봐요
                  </span>
                </div>
              </button>
            </Link>
          </div>
        </div>

        {/* 저장 버튼 */}
        <div style={{ marginTop: "24px", marginBottom: "40px", display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleSave}
            style={{
              width: "200px",
              height: "44px",
              borderRadius: "30px",
              backgroundColor: COLORS.primary,
              color: "white",
              fontWeight: 600,
              fontSize: "15px",
              border: "none",
              cursor: "pointer",
              boxShadow: `0 4px 16px ${COLORS.accentShadow}`,
              transition: "all 0.2s",
            }}
          >
            저장하기
          </button>
        </div>
      </div>
    </div>
  );
}
