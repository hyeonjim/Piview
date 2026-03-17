"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const ROUTINE_CARD_BORDER_EMPTY = "var(--color-border-subtle)";
/* 베이지 팔레트 — 채워진 카드 보더를 Beige-3로 교체 */
const ROUTINE_CARD_BORDER_FILLED = "#D9D1C7";
const SCORE_RING_TRACK_COLOR = "var(--color-border-subtle)";
const SCORE_RING_SIZE = { width: 56, height: 56 };
// 제품 이미지(emoji) 영역 — 80×80 (step code 배지의 2배)
const ROUTINE_PRODUCT_IMAGE_STYLE = {
  width: "80px",
  height: "80px",
  borderRadius: "16px",
  backgroundColor: "var(--color-bg-muted-warm)",
  fontSize: "36px",
  display: "flex" as const,
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
const ROUTINE_PLUS_MINUS_BTN = {
  width: "22px",
  height: "22px",
  borderRadius: "50%",
  backgroundColor: "var(--color-bg-muted-warm)",
  border: "none",
};
const REASON_TEXT_STYLE = { fontSize: "13px", lineHeight: 1.6 };
const ROUTINE_HEADER_BTN_STYLE = {
  fontSize: "12px",
  padding: "5px 10px",
  borderRadius: "20px",
  backgroundColor: "transparent",
};

import { useState, useMemo } from "react";
import { Plus, X, ChevronDown, ChevronUp, RotateCcw } from "lucide-react";
import {
  CATEGORY_COLORS,
  SKIN_FUNCTION_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";
import {
  getRoutineEvaluation,
  getScoreBarColor,
} from "@/constants/routineEvaluation";
import { MYPAGE_ROUTINE_STEPS } from "@/constants/routineSteps";
import { useLocalRoutineStore, type LocalProduct } from "@/stores/useLocalRoutineStore";

interface RoutineTabProps {
  routine: Record<string, LocalProduct | null>;
  onOpenModal: (code: string) => void;
  onRemove: (code: string) => void;
}

export default function RoutineTab({
  routine,
  onOpenModal,
  onRemove,
}: RoutineTabProps) {
  // 홈화면 메인 루틴 on/off
  const { isMainRoutine, toggleMainRoutine } = useLocalRoutineStore();

  // 추천 이유 펼침 상태 — key: step.code
  const [openReason, setOpenReason] = useState<Record<string, boolean>>({});
  const toggleReason = (code: string) =>
    setOpenReason((prev) => ({ ...prev, [code]: !prev[code] }));

  const filledProducts = useMemo(
    () =>
      Object.values(routine).filter(
        (product): product is LocalProduct => !!product,
      ),
    [routine],
  );
  const filledCount = filledProducts.length;

  const routineScores = useMemo(
    () =>
      filledProducts
        .filter((product) => product.matchScore > 0)
        .map((product) => product.matchScore),
    [filledProducts],
  );
  const avgScore =
    routineScores.length > 0
      ? Math.round(
          routineScores.reduce((acc, score) => acc + score, 0) /
            routineScores.length,
        )
      : 0;
  const evaluation = getRoutineEvaluation(avgScore, routineScores.length);
  const scoreColor = getScoreBarColor(avgScore);
  const CIRCUMFERENCE = 138;
  const strokeDash =
    routineScores.length > 0 ? (avgScore / 100) * CIRCUMFERENCE : 0;

  return (
    <div className="px-5 pt-4 flex flex-col gap-2 pb-24">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-1">
        {/* min-w-0: 자막 텍스트가 길어도 버튼 영역을 침범하지 않도록 수축 허용 */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5">
            <p className="text-base font-bold text-text-primary">내 루틴</p>
            {/* ⚠️ API 연동 시 서버 루틴 메인 설정 API로 교체 */}
            <button
              onClick={toggleMainRoutine}
              className={`flex items-center gap-1 px-2 py-1 rounded-full border text-[12px] font-semibold cursor-pointer transition-all active:scale-95 ${
                isMainRoutine
                  ? "bg-amber-200 border-amber-200 text-[#8a827a]"
                  : "bg-transparent border-[#D9D5D0] text-[#B8A99A]"
              }`}
            >
              {isMainRoutine ? "★" : "☆"} 메인
            </button>
          </div>
          <p className="text-xs text-text-muted mt-0.5">
            {filledCount}/6단계 완성 · 길게 눌러 순서 변경
          </p>
        </div>
        {/* shrink-0: 버튼 3개가 항상 1줄로 유지되도록 수축 방지 */}
        <div className="flex gap-1.5 shrink-0">
          {/* 초기화 */}
          <button
            onClick={() => {
              // ⚠️ API 연동 시 루틴 초기화 API 호출로 교체
              MYPAGE_ROUTINE_STEPS.forEach((step) => onRemove(step.code));
            }}
            className="flex items-center gap-1 font-medium border border-border text-text-secondary cursor-pointer bg-transparent"
            style={ROUTINE_HEADER_BTN_STYLE}
          >
            <RotateCcw size={12} /> 초기화
          </button>
          {/* OCR */}
          <button
            className="flex items-center gap-1 font-medium border border-border text-text-secondary cursor-pointer bg-transparent"
            style={ROUTINE_HEADER_BTN_STYLE}
          >
            OCR
          </button>
          {/* 저장 */}
          <button
            className="flex items-center gap-1 font-medium border border-border text-text-secondary cursor-pointer bg-transparent"
            style={ROUTINE_HEADER_BTN_STYLE}
          >
            저장
          </button>
        </div>
      </div>

      {/* 루틴 스텝 카드 목록 */}
      {MYPAGE_ROUTINE_STEPS.map((step) => {
        const filled = routine[step.code];
        return (
          <div
            key={step.code}
            className="rounded-2xl px-4 py-3 transition-all mt-3"
            style={{
              /* 채워진 카드는 흰 배경, 빈 카드는 베이지 배경 */
              backgroundColor: filled ? "#FFFFFF" : "var(--color-warm-bg)",
              border: `1px solid ${filled ? ROUTINE_CARD_BORDER_FILLED : ROUTINE_CARD_BORDER_EMPTY}`,
            }}
          >
            {filled ? (
              <div className="flex flex-col">
                {/* 카드 메인 행 */}
                <div className="flex items-start gap-3">
                  {/* 제품 이미지 — emoji를 80×80 크기로 표시 */}
                  <div style={ROUTINE_PRODUCT_IMAGE_STYLE}>
                    {filled.emoji}
                  </div>

                  {/* 제품 정보 */}
                  <div className="flex-1 min-w-0">
                    {/* 브랜드 + 카테고리 칩 */}
                    <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                      <span className="text-[11px] text-text-muted">
                        {filled.brand}
                      </span>
                      {CATEGORY_COLORS[filled.category] && (
                        <span
                          className="text-[10px] px-1.5 py-[1px] rounded-[4px] font-medium"
                          style={{
                            backgroundColor:
                              CATEGORY_COLORS[filled.category].chip,
                            color: CATEGORY_COLORS[filled.category].accent,
                          }}
                        >
                          {filled.category}
                        </span>
                      )}
                    </div>
                    {/* 제품명 */}
                    <p className="truncate text-sm font-semibold text-text-primary">
                      {filled.name}
                    </p>
                    {/* 피부타입 칩 */}
                    {filled.skinTypes.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filled.skinTypes.map((skinType) => {
                          const tc = SKIN_TYPE_TAG_COLORS[skinType];
                          return tc ? (
                            <span
                              key={skinType}
                              className="text-[10px] px-[6px] py-[1px] rounded-[4px] font-medium"
                              style={{ backgroundColor: tc.bg, color: tc.text }}
                            >
                              {skinType}
                            </span>
                          ) : null;
                        })}
                      </div>
                    )}
                    {/* 기능 칩 */}
                    <div className="flex flex-wrap gap-1 mt-1">
                      {filled.effects.slice(0, 3).map((fn) => {
                        const fc = SKIN_FUNCTION_COLORS[fn];
                        return fc ? (
                          <span
                            key={fn}
                            className="text-[10px] px-[5px] py-[1px] rounded-[4px] font-medium"
                            style={{
                              backgroundColor: fc.chip,
                              color: fc.accent,
                            }}
                          >
                            {fn}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  {/* + - 버튼 */}
                  <div className="flex flex-row gap-2 shrink-0">
                    <button
                      onClick={() => onOpenModal(step.code)}
                      className="flex items-center justify-center cursor-pointer"
                      style={ROUTINE_PLUS_MINUS_BTN}
                    >
                      <Plus size={14} className="text-text-muted" />
                    </button>
                    <button
                      onClick={() => onRemove(step.code)}
                      className="flex items-center justify-center cursor-pointer"
                      style={ROUTINE_PLUS_MINUS_BTN}
                    >
                      <X size={14} className="text-text-muted" />
                    </button>
                  </div>
                </div>

                {/* 추천 이유 토글 */}
                {/* ⚠️ API 연동 시 filled.reason으로 교체 */}
                <button
                  onClick={() => toggleReason(step.code)}
                  className="flex items-center gap-1 mt-2 text-text-muted bg-transparent border-none cursor-pointer self-start"
                  style={{ fontSize: "12px" }}
                >
                  추천 이유
                  {openReason[step.code] ? (
                    <ChevronUp size={12} />
                  ) : (
                    <ChevronDown size={12} />
                  )}
                </button>
                {openReason[step.code] && (
                  <p className="text-text-muted mt-1" style={REASON_TEXT_STYLE}>
                    {/* ⚠️ API 연동 시 filled.reason으로 교체 */}
                    해당 제품의 추천 이유가 여기 표시됩니다.
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-text-muted shrink-0"
                  style={{ backgroundColor: "var(--color-bg-muted-warm)" }}
                >
                  {step.code}
                </div>
                <p className="flex-1 text-sm font-medium text-text-primary">
                  {step.label}
                </p>
                <button
                  onClick={() => onOpenModal(step.code)}
                  className="flex items-center gap-1 text-xs font-medium text-brand cursor-pointer border-none bg-transparent"
                >
                  <Plus size={13} /> 추가
                </button>
              </div>
            )}
          </div>
        );
      })}

      {/* 루틴 종합 점수 카드 — 항상 표시 */}
      <div
        className="mt-2 p-4 rounded-2xl"
        style={{
          backgroundColor: "var(--color-warm-bg)",
          border: `1px solid ${filledCount > 0 ? scoreColor + "40" : "var(--color-border-subtle)"}`,
        }}
      >
        <div className="flex items-center gap-3">
          {/* 점수 링 */}
          <div
            className="relative shrink-0 flex items-center justify-center"
            style={SCORE_RING_SIZE}
          >
            <svg width="56" height="56" className="absolute">
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={SCORE_RING_TRACK_COLOR}
                strokeWidth="4"
              />
              <circle
                cx="28"
                cy="28"
                r="22"
                fill="none"
                stroke={filledCount > 0 ? scoreColor : SCORE_RING_TRACK_COLOR}
                strokeWidth="4"
                strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                strokeLinecap="round"
                transform="rotate(-90 28 28)"
                style={{ transition: "stroke-dasharray 0.6s ease" }}
              />
            </svg>
            <span
              className="relative z-[1] text-[13px] font-bold"
              style={{
                color: filledCount > 0 ? scoreColor : "var(--color-text-muted)",
              }}
            >
              {avgScore}
            </span>
          </div>
          {/* 텍스트 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-1">
              <span
                className="text-sm"
                style={{
                  color:
                    filledCount > 0 ? scoreColor : "var(--color-text-muted)",
                }}
              >
                ∼
              </span>
              <span className="text-sm font-bold text-text-primary">
                내 루틴 종합 점수
              </span>
            </div>
            <p className="text-xs text-text-muted leading-[1.6] break-keep">
              {evaluation.text}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
