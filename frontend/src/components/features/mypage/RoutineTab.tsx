"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
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
  width: "28px",
  height: "28px",
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

import { useMemo } from "react";
import { Plus, X, RotateCcw } from "lucide-react";
import {
  getRoutineEvaluation,
  getScoreBarColor,
} from "@/constants/routineEvaluation";
import { ROUTINE_STEPS } from "@/constants/routineSteps";
import {
  useLocalRoutineStore,
  type LocalProduct,
} from "@/stores/useLocalRoutineStore";
import ProductCard from "@/components/common/ProductCard";

interface RoutineTabProps {
  routine: Record<string, LocalProduct[]>;
  onOpenModal: (code: string) => void;
  // productId 추가: 같은 스텝 내 특정 제품 제거
  onRemove: (code: string, productId: string) => void;
}

export default function RoutineTab({
  routine,
  onOpenModal,
  onRemove,
}: RoutineTabProps) {
  // 홈화면 메인 루틴 on/off
  const { isMainRoutine, toggleMainRoutine, clearRoutine } =
    useLocalRoutineStore();

  // 1개 이상 제품이 있는 스텝 수 — null 방어 (localStorage 구버전 호환)
  const filledCount = useMemo(
    () =>
      Object.values(routine).filter(
        (products) => Array.isArray(products) && products.length > 0,
      ).length,
    [routine],
  );

  // 루틴 전체 제품 flat 배열 (점수 계산용) — null 방어
  const allProducts = useMemo(
    () => Object.values(routine).flatMap((products) => products ?? []),
    [routine],
  );

  const routineScores = useMemo(
    () =>
      allProducts
        .filter((product) => product.matchScore > 0)
        .map((product) => product.matchScore),
    [allProducts],
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
    <div className="px-5 pt-4 flex flex-col gap-2 pb-10">
      {/* 헤더 */}
      <div className="flex items-start justify-between mb-1">
        {/* min-w-0: 텍스트가 길어도 버튼 영역을 침범하지 않도록 수축 허용 */}
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
        <div className="flex gap-1.5">
          {/* 초기화 — ⚠️ API 연동 시 루틴 초기화 API 호출로 교체 */}
          <button
            onClick={clearRoutine}
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
            ⇄ OCR
          </button>
          {/* 저장 */}
          <button
            className="flex items-center gap-1 font-medium border border-border text-text-secondary cursor-pointer bg-transparent"
            style={ROUTINE_HEADER_BTN_STYLE}
          >
            📋 저장
          </button>
        </div>
      </div>

      {/* 루틴 스텝별 섹션 */}
      {ROUTINE_STEPS.map((step) => {
        const products = routine[step.code] ?? [];
        return (
          <div key={step.code} className="mt-3">
            {/* 스텝 섹션 헤더 — 아이콘, 라벨, + 추가 버튼 */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <span className="text-base">{step.icon}</span>
                <span className="text-sm font-semibold text-text-primary">
                  {step.label}
                </span>
              </div>
              <button
                onClick={() => onOpenModal(step.code)}
                className="flex items-center gap-1 text-xs font-medium text-brand cursor-pointer border-none bg-transparent"
              >
                <Plus size={13} /> 추가
              </button>
            </div>

            {products.length === 0 ? (
              // 빈 상태 플레이스홀더
              <div
                className="rounded-2xl px-4 py-3 flex items-center gap-3"
                style={{
                  backgroundColor: "var(--color-warm-bg)",
                  border: "1px solid var(--color-border-subtle)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-text-muted shrink-0"
                  style={{ backgroundColor: "var(--color-bg-muted-warm)" }}
                >
                  {step.code}
                </div>
                <p className="flex-1 text-sm font-medium text-text-muted">
                  아직 추가된 제품이 없어요
                </p>
              </div>
            ) : (
              // 1열 가로 목록 — ProductCard horizontal 재사용, like 버튼 숨김
              <div className="flex flex-col gap-2">
                {products.map((product) => (
                  <div key={product.id} className="relative">
                    {/* ProductCard layout="horizontal" 재사용 — EWG 숨기고 피부타입·기능 태그 표시 */}
                    <ProductCard
                      id={product.id}
                      name={product.name}
                      brand={product.brand}
                      emoji={product.emoji}
                      category={product.category}
                      skinTypes={product.skinTypes}
                      effects={product.effects}
                      layout="horizontal"
                      showActions={false}
                      showLike={false}
                      showEwg={false}
                    />
                    {/* 제품 제거 버튼 오버레이 — 우측 상단 */}
                    <button
                      onClick={(event) => {
                        event.preventDefault();
                        event.stopPropagation();
                        onRemove(step.code, product.id);
                      }}
                      className="absolute top-2 right-2 z-10 w-6 h-6 flex items-center justify-center rounded-full border-none cursor-pointer"
                      style={{
                        backgroundColor: "rgba(255,255,255,0.92)",
                        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                      }}
                    >
                      <X size={12} color="#888" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* 루틴 종합 점수 카드 — 항상 표시 */}
      <div
        className="mt-10 p-4 rounded-2xl"
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
