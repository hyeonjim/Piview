"use client";

/**
 * components/common/CompareModal.tsx
 * 제품 2개 비교 바텀시트 모달 — search / recommend 페이지 공용
 *
 * - 가격·피부타입 비교 표 (우위 항목 하이라이트)
 * - 피부기능 가로 막대 수치 비교
 * - AI 비교 설명 (현재 하드코딩 — ⚠️ API 연동 시 compareService.getAiComment(ids)로 교체)
 *
 * 상태: 부모 페이지에서 useCompare 훅으로 관리 후 props로 전달
 */

import Image from "next/image";
import { X, Sparkles } from "lucide-react";
import { SKIN_FUNCTION_COLORS } from "@/constants/categoryColors";
import { formatPrice } from "@/utils/format";
import { SkinTypeTag } from "@/components/common/ProductCard";

/** 비교용 제품 정보 인터페이스 */
export interface CompareProduct {
  id: string | number;
  name: string;
  brand: string;
  imageUrl?: string;
  emoji?: string;
  price?: number;
  skinTypes?: string[];
  effects?: string[];
  /** 피부기능별 수치 점수 0~100 — ⚠️ API 연동 시 서버 값으로 교체 */
  effectScores?: Record<string, number>;
}

interface CompareModalProps {
  /** 비교할 2개 제품 */
  compareItems: [CompareProduct, CompareProduct];
  /** 모달 닫기 콜백 */
  onClose: () => void;
}

// ── 피부기능 막대 색상 — 두 제품 구분용 ────────────────────────────
const LEFT_BAR_COLOR = "#A69D92";  // 왼쪽 제품 — 웜 그레이
const RIGHT_BAR_COLOR = "#8A9468"; // 오른쪽 제품 — 올리브 그린

// ── 우위 항목 강조색 ─────────────────────────────────────────────────
const HIGHLIGHT_COLOR = "#5A5248";

// ── 피부기능 수치 기본값 (effectScores 없을 때) ──────────────────────
// ⚠️ API 연동 시 제품 데이터에 포함된 서버 값으로 교체
const FALLBACK_EFFECT_SCORES: Record<string, number> = {
  수분: 70, 진정: 60, 미백: 50, 안티에이징: 55,
  여드름: 65, 피지: 58, 영양: 62, 색소침착: 48, 아토피: 45,
};

/** 피부기능 점수 반환 — effectScores 없으면 fallback 사용 */
function getEffectScore(product: CompareProduct, effectName: string): number {
  return product.effectScores?.[effectName] ?? FALLBACK_EFFECT_SCORES[effectName] ?? 50;
}

/** 두 제품에 등장하는 모든 피부기능 이름 합집합 */
function mergeEffectNames(
  leftProduct: CompareProduct,
  rightProduct: CompareProduct,
): string[] {
  return Array.from(new Set([
    ...(leftProduct.effects ?? []),
    ...(rightProduct.effects ?? []),
  ]));
}

// ── 서브컴포넌트: 제품 헤더 (이미지·브랜드·제품명) ────────────────────
function ProductHeader({ product }: { product: CompareProduct }) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      {/* 제품 이미지 또는 이모지 */}
      <div
        className="flex items-center justify-center overflow-hidden rounded-xl bg-[#F5F2EC]"
        style={{ width: 72, height: 72, flexShrink: 0 }}
      >
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={72}
            height={72}
            className="object-cover"
          />
        ) : (
          <span className="text-4xl">{product.emoji ?? "🧴"}</span>
        )}
      </div>

      {/* 브랜드 */}
      <span className="text-sm font-medium text-[#BFB6AA] uppercase tracking-widest">
        {product.brand}
      </span>

      {/* 제품명 */}
      <p className="m-0 text-sm font-semibold text-[#2A2118] text-center leading-snug line-clamp-2 px-1">
        {product.name}
      </p>
    </div>
  );
}

// ── 서브컴포넌트: 비교 표 (가격·피부타입·평점·매칭 점수) ──────────────
function CompareTable({
  leftProduct,
  rightProduct,
}: {
  leftProduct: CompareProduct;
  rightProduct: CompareProduct;
}) {
  type TableRow = {
    label: string;
    leftContent: React.ReactNode;
    rightContent: React.ReactNode;
    /** 우위 제품 인덱스 — 0: 왼쪽, 1: 오른쪽, null: 강조 없음 */
    highlightIndex: 0 | 1 | null;
  };

  const rows: TableRow[] = [
    {
      label: "가격",
      leftContent: leftProduct.price ? formatPrice(leftProduct.price) : "-",
      rightContent: rightProduct.price ? formatPrice(rightProduct.price) : "-",
      // 가격은 낮을수록 우위
      highlightIndex:
        leftProduct.price != null && rightProduct.price != null
          ? leftProduct.price <= rightProduct.price ? 0 : 1
          : null,
    },
    {
      label: "피부타입",
      // SkinTypeTag 재사용 — ProductCard와 동일한 태그 컴포넌트
      leftContent: (
        <div className="flex flex-wrap gap-1 justify-center">
          {leftProduct.skinTypes && leftProduct.skinTypes.length > 0
            ? leftProduct.skinTypes.map((skinType) => (
                <SkinTypeTag key={skinType} label={skinType} />
              ))
            : <span className="text-sm text-[#C4BEB7]">-</span>}
        </div>
      ),
      rightContent: (
        <div className="flex flex-wrap gap-1 justify-center">
          {rightProduct.skinTypes && rightProduct.skinTypes.length > 0
            ? rightProduct.skinTypes.map((skinType) => (
                <SkinTypeTag key={skinType} label={skinType} />
              ))
            : <span className="text-sm text-[#C4BEB7]">-</span>}
        </div>
      ),
      highlightIndex: null,
    },
  ];

  return (
    <div className="rounded-xl overflow-hidden border border-[#E8E4DF]">
      {/* 헤더 행 — 제품명으로 두 제품 구분 */}
      <div
        className="grid bg-[#F2EFE9]"
        style={{ gridTemplateColumns: "76px 1fr 1fr" }}
      >
        <div className="px-3 py-2 text-sm font-semibold text-[#A69D92]">항목</div>
        <div className="px-2 py-2 text-sm font-semibold text-center text-[#A69D92] leading-tight line-clamp-2">
          {leftProduct.name}
        </div>
        <div className="px-2 py-2 text-sm font-semibold text-center text-[#A69D92] leading-tight line-clamp-2">
          {rightProduct.name}
        </div>
      </div>

      {/* 데이터 행 */}
      {rows.map((row, rowIndex) => (
        <div
          key={row.label}
          className="grid"
          style={{
            gridTemplateColumns: "76px 1fr 1fr",
            borderTop: rowIndex === 0 ? "1px solid #E8E4DF" : "1px solid #F2EFE9",
          }}
        >
          <div className="px-3 py-3 text-sm font-medium text-[#8A8278] bg-[#FAFAF8] flex items-center">
            {row.label}
          </div>
          <div
            className="px-2 py-3 text-sm text-center flex items-center justify-center"
            style={{
              fontWeight: row.highlightIndex === 0 ? 700 : 400,
              color: row.highlightIndex === 0 ? HIGHLIGHT_COLOR : "#2A2118",
            }}
          >
            {row.leftContent}
          </div>
          <div
            className="px-2 py-3 text-sm text-center flex items-center justify-center"
            style={{
              fontWeight: row.highlightIndex === 1 ? 700 : 400,
              color: row.highlightIndex === 1 ? HIGHLIGHT_COLOR : "#2A2118",
            }}
          >
            {row.rightContent}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── 서브컴포넌트: 피부기능 가로 막대 수치 비교 ───────────────────────
function EffectBars({
  leftProduct,
  rightProduct,
}: {
  leftProduct: CompareProduct;
  rightProduct: CompareProduct;
}) {
  const effectNames = mergeEffectNames(leftProduct, rightProduct);
  if (effectNames.length === 0) return null;

  return (
    <div className="flex flex-col gap-4">
      {effectNames.map((effectName) => {
        const leftScore = getEffectScore(leftProduct, effectName);
        const rightScore = getEffectScore(rightProduct, effectName);
        const colorConfig = SKIN_FUNCTION_COLORS[effectName];

        return (
          <div key={effectName}>
            {/* 기능명 태그 + 수치 */}
            <div className="flex items-center justify-between mb-1.5">
              {colorConfig ? (
                <span
                  className="text-sm font-medium px-2 py-0.5 rounded"
                  style={{ backgroundColor: colorConfig.chip, color: colorConfig.accent }}
                >
                  {effectName}
                </span>
              ) : (
                <span className="text-sm font-medium text-[#5A5248]">{effectName}</span>
              )}
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold" style={{ color: LEFT_BAR_COLOR }}>
                  {leftScore}
                </span>
                <span className="text-sm text-[#C4BEB7]">/</span>
                <span className="text-sm font-bold" style={{ color: RIGHT_BAR_COLOR }}>
                  {rightScore}
                </span>
              </div>
            </div>

            {/* 왼쪽 제품 막대 */}
            <div className="h-1.5 rounded-full bg-[#F2EFE9] overflow-hidden mb-1">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${leftScore}%`, backgroundColor: LEFT_BAR_COLOR }}
              />
            </div>

            {/* 오른쪽 제품 막대 */}
            <div className="h-1.5 rounded-full bg-[#F2EFE9] overflow-hidden">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{ width: `${rightScore}%`, backgroundColor: RIGHT_BAR_COLOR }}
              />
            </div>
          </div>
        );
      })}

      {/* 범례 */}
      <div className="flex items-center gap-4 mt-1">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-full" style={{ backgroundColor: LEFT_BAR_COLOR }} />
          <span className="text-sm text-[#A69D92]">{leftProduct.brand}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-2 rounded-full" style={{ backgroundColor: RIGHT_BAR_COLOR }} />
          <span className="text-sm text-[#A69D92]">{rightProduct.brand}</span>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ────────────────────────────────────────────────────
export default function CompareModal({ compareItems, onClose }: CompareModalProps) {
  const [leftProduct, rightProduct] = compareItems;

  return (
    // 배경 딤 — 클릭 시 모달 닫기
    <div
      className="fixed inset-0 z-50 flex flex-col justify-end items-center"
      style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
      onClick={onClose}
    >
      {/* 바텀시트 — 페이지 컨테이너(500px)에 맞게 width 제한, 화면 높이의 최대 85% */}
      <div
        className="relative bg-white rounded-t-2xl flex flex-col"
        style={{ width: "100%", maxWidth: "500px", maxHeight: "85dvh" }}
        onClick={(event) => event.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[#E0DDD8]" />
        </div>

        {/* 헤더 — 고정 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#EDEBE8] shrink-0">
          <h2 className="m-0 text-base font-bold text-[#2A2118]">제품 비교</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-[#F2EFE9] border-none cursor-pointer"
          >
            <X size={16} className="text-[#8A8278]" />
          </button>
        </div>

        {/* 스크롤 가능한 콘텐츠 영역 */}
        <div
          className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-8"
          style={{ scrollbarWidth: "none" }}
        >
          {/* ① 제품 이미지 · 브랜드 · 제품명 */}
          <div className="flex gap-3">
            <ProductHeader product={leftProduct} />
            <div className="w-px bg-[#EDEBE8] self-stretch" />
            <ProductHeader product={rightProduct} />
          </div>

          {/* ② 가격 · 피부타입 · 평점 · 매칭 점수 비교 표 */}
          <div>
            <CompareTable leftProduct={leftProduct} rightProduct={rightProduct} />
          </div>

          {/* ③ 피부기능 가로 막대 수치 비교 */}
          <div>
            <p className="m-0 mb-3 text-sm font-semibold text-[#8A8278] uppercase tracking-wider">
              피부기능 비교
            </p>
            <EffectBars leftProduct={leftProduct} rightProduct={rightProduct} />
          </div>

          {/* ④ AI 비교 설명 — ⚠️ API 연동 시 compareService.getAiComment(ids) 응답으로 교체 */}
          <div className="rounded-xl bg-[#F8F6F2] border border-[#E8E4DF] p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-[#A69D92]" />
              <span className="text-sm font-semibold text-[#8A8278] uppercase tracking-wider">
                AI 비교 분석
              </span>
            </div>
            {/* ⚠️ 하드코딩 — API 연동 시 서버 응답 텍스트로 교체 */}
            <p className="m-0 text-sm text-[#5A5248] leading-relaxed">
              <strong className="font-semibold text-[#3D3028]">{leftProduct.name}</strong>은 수분 공급과
              진정에 강점이 있어 건조하거나 민감한 피부에 적합합니다. 반면{" "}
              <strong className="font-semibold text-[#3D3028]">{rightProduct.name}</strong>은 피지 조절과
              안티에이징 효과가 뛰어나 복합성·지성 피부에 더 효과적입니다. 가격 대비 성분 효율은 두 제품
              모두 우수하며, 피부 고민에 따라 선택하세요.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
