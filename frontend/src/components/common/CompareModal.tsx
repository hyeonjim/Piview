"use client";

/**
 * components/common/CompareModal.tsx
 * 제품 2개 비교 바텀시트 모달 — search / recommend / product 상세 페이지 공용
 *
 * - POST /api/v1/products/compare API 연동
 * - 브랜드명, 알레르기 개수 표시
 * - 피부타입 한글 변환
 */

import Image from "next/image";
import { X, Sparkles } from "lucide-react";
import { SKIN_FUNCTION_COLORS } from "@/constants/categoryColors";
import { formatPrice } from "@/utils/format";
import { SkinTypeTag } from "@/components/common/ProductCard";
import { useProductCompare } from "@/hooks";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import type { ProductViewModel } from "@/types/product/myCos";

type CompareProduct = ProductViewModel;
export type { CompareProduct };

interface CompareModalProps {
  compareItems: [CompareProduct, CompareProduct];
  onClose: () => void;
  isRoutineCompare?: boolean;
}

// globals.css에 정확히 매핑되는 변수 없어서 상수 유지
const HIGHLIGHT_COLOR = "var(--color-highlight-strong)";

// ── 서브컴포넌트: 제품 헤더 ────────────────────────────────────────
function ProductHeader({ product }: { product: CompareProduct }) {
  return (
    <div className="flex flex-col items-center gap-2 flex-1 min-w-0">
      {/* w/h/shrink → Tailwind */}
      <div className="w-[100px] h-[100px] shrink-0 flex items-center justify-center overflow-hidden rounded-xl bg-bg-base">
        {product.imageUrl ? (
          <Image
            src={product.imageUrl}
            alt={product.name}
            width={100}
            height={100}
            className="object-cover"
          />
        ) : (
          <span className="text-4xl">{product.emoji ?? "🧴"}</span>
        )}
      </div>
      {product.brand && (
        <p className="text-[11px] text-text-muted text-center leading-tight px-1 truncate w-full">
          {product.brand}
        </p>
      )}
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function CompareModal({
  compareItems,
  onClose,
  isRoutineCompare = false,
}: CompareModalProps) {
  const [leftProduct, rightProduct] = compareItems;

  const productIds: [number, number] | null =
    leftProduct.id > 0 && rightProduct.id > 0
      ? [leftProduct.id, rightProduct.id]
      : null;

  const { data: compareData, isLoading } = useProductCompare(productIds);

  const apiLeft = compareData?.products?.[0];
  const apiRight = compareData?.products?.[1];

  type TableRow = {
    label: string;
    leftContent: React.ReactNode;
    rightContent: React.ReactNode;
    highlightIndex: 0 | 1 | null;
  };

  const rows: TableRow[] = [
    {
      label: "가격",
      leftContent:
        (apiLeft?.price ?? leftProduct.price)
          ? formatPrice(apiLeft?.price ?? leftProduct.price!)
          : "-",
      rightContent:
        (apiRight?.price ?? rightProduct.price)
          ? formatPrice(apiRight?.price ?? rightProduct.price!)
          : "-",
      highlightIndex: (() => {
        const lp = apiLeft?.price ?? leftProduct.price ?? null;
        const rp = apiRight?.price ?? rightProduct.price ?? null;
        if (lp != null && rp != null) return lp <= rp ? 0 : 1;
        return null;
      })(),
    },
    {
      label: "피부타입",
      leftContent: (
        <div className="flex flex-wrap gap-1 justify-center">
          {(apiLeft?.skinTypes ?? leftProduct.skinTypes ?? []).length > 0 ? (
            (apiLeft?.skinTypes ?? leftProduct.skinTypes).map((st) => (
              <SkinTypeTag key={st} label={fromSkinTypeEnum(st)} />
            ))
          ) : (
            <span className="text-sm text-[var(--color-nav-inactive)]">-</span>
          )}
        </div>
      ),
      rightContent: (
        <div className="flex flex-wrap gap-1 justify-center">
          {(apiRight?.skinTypes ?? rightProduct.skinTypes ?? []).length > 0 ? (
            (apiRight?.skinTypes ?? rightProduct.skinTypes).map((st) => (
              <SkinTypeTag key={st} label={fromSkinTypeEnum(st)} />
            ))
          ) : (
            <span className="text-sm text-[var(--color-nav-inactive)]">-</span>
          )}
        </div>
      ),
      highlightIndex: null,
    },
    {
      label: "피부기능",
      leftContent: (
        <div className="flex flex-wrap gap-1 justify-center">
          {(apiLeft?.skinConcerns ?? leftProduct.effects ?? []).length > 0 ? (
            (apiLeft?.skinConcerns ?? leftProduct.effects).map((effect) => {
              const colorConfig = SKIN_FUNCTION_COLORS[effect];
              return colorConfig ? (
                <span
                  key={effect}
                  className="text-[10px] px-1.5 py-px rounded-[4px] font-bold"
                  style={{
                    backgroundColor: colorConfig.chip,
                    color: colorConfig.accent,
                  }}
                >
                  {effect}
                </span>
              ) : (
                <span
                  key={effect}
                  className="text-[10px] px-1.5 py-px rounded-[4px] font-bold bg-brand-bg text-text-primary"
                >
                  {effect}
                </span>
              );
            })
          ) : (
            <span className="text-sm text-[var(--color-nav-inactive)]">-</span>
          )}
        </div>
      ),
      rightContent: (
        <div className="flex flex-wrap gap-1 justify-center">
          {(apiRight?.skinConcerns ?? rightProduct.effects ?? []).length > 0 ? (
            (apiRight?.skinConcerns ?? rightProduct.effects).map((effect) => {
              const colorConfig = SKIN_FUNCTION_COLORS[effect];
              return colorConfig ? (
                <span
                  key={effect}
                  className="text-[10px] px-1.5 py-px rounded-[4px] font-bold"
                  style={{
                    backgroundColor: colorConfig.chip,
                    color: colorConfig.accent,
                  }}
                >
                  {effect}
                </span>
              ) : (
                <span
                  key={effect}
                  className="text-[10px] px-1.5 py-px rounded-[4px] font-bold bg-brand-bg text-text-primary"
                >
                  {effect}
                </span>
              );
            })
          ) : (
            <span className="text-sm text-[var(--color-nav-inactive)]">-</span>
          )}
        </div>
      ),
      highlightIndex: null,
    },
    {
      label: "성분 위험도",
      leftContent: (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <span className="flex items-center gap-0.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-ewg-safe inline-block shrink-0" />
            {apiLeft?.ewgRisk?.low ?? leftProduct.ewgSafe ?? 0}
          </span>
          <span className="flex items-center gap-0.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-ewg-caution inline-block shrink-0" />
            {apiLeft?.ewgRisk?.medium ?? leftProduct.ewgCaution ?? 0}
          </span>
          <span className="flex items-center gap-0.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-ewg-danger inline-block shrink-0" />
            {apiLeft?.ewgRisk?.high ?? leftProduct.ewgDanger ?? 0}
          </span>
        </div>
      ),
      rightContent: (
        <div className="flex items-center gap-1.5 flex-wrap justify-center">
          <span className="flex items-center gap-0.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-ewg-safe inline-block shrink-0" />
            {apiRight?.ewgRisk?.low ?? rightProduct.ewgSafe ?? 0}
          </span>
          <span className="flex items-center gap-0.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-ewg-caution inline-block shrink-0" />
            {apiRight?.ewgRisk?.medium ?? rightProduct.ewgCaution ?? 0}
          </span>
          <span className="flex items-center gap-0.5 text-xs">
            <span className="w-2 h-2 rounded-full bg-ewg-danger inline-block shrink-0" />
            {apiRight?.ewgRisk?.high ?? rightProduct.ewgDanger ?? 0}
          </span>
        </div>
      ),
      highlightIndex: (() => {
        const lDanger = apiLeft?.ewgRisk?.high ?? leftProduct.ewgDanger ?? 0;
        const rDanger = apiRight?.ewgRisk?.high ?? rightProduct.ewgDanger ?? 0;
        const lCaution =
          apiLeft?.ewgRisk?.medium ?? leftProduct.ewgCaution ?? 0;
        const rCaution =
          apiRight?.ewgRisk?.medium ?? rightProduct.ewgCaution ?? 0;
        if (lDanger !== rDanger) return lDanger < rDanger ? 0 : 1;
        if (lCaution !== rCaution) return lCaution < rCaution ? 0 : 1;
        return null;
      })(),
    },
    {
      label: "알레르기",
      leftContent: apiLeft ? (
        apiLeft.allergy.count === 0 ? (
          <span className="text-sm text-text-hint">없음</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-danger">
              {apiLeft.allergy.count}개
            </span>
            <span className="text-[10px] text-text-muted text-center leading-relaxed">
              {apiLeft.allergy.ingredients.join(", ")}
            </span>
          </div>
        )
      ) : (
        <span className="text-sm text-text-hint">-</span>
      ),
      rightContent: apiRight ? (
        apiRight.allergy.count === 0 ? (
          <span className="text-sm text-text-hint">없음</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-sm font-semibold text-danger">
              {apiRight.allergy.count}개
            </span>
            <span className="text-[10px] text-text-muted text-center leading-relaxed">
              {apiRight.allergy.ingredients.join(", ")}
            </span>
          </div>
        )
      ) : (
        <span className="text-sm text-text-hint">-</span>
      ),
      highlightIndex: (() => {
        if (!apiLeft || !apiRight) return null;
        if (apiLeft.allergy.count !== apiRight.allergy.count)
          return apiLeft.allergy.count < apiRight.allergy.count ? 0 : 1;
        return null;
      })(),
    },
  ];

  return (
    <div
      className="fixed inset-0 z-60 flex flex-col justify-end items-center"
      style={{
        backgroundColor: "rgba(0,0,0,0.45)",
        backdropFilter: "blur(4px)",
      }}
      onClick={onClose}
    >
      {/* w/maxW/maxH → Tailwind (max-w-app은 globals.css 전역 변수) */}
      <div
        className="relative bg-white rounded-t-2xl flex flex-col w-full max-w-app max-h-[85dvh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 핸들 바 */}
        <div className="flex justify-center pt-3 pb-1 shrink-0">
          <div className="w-10 h-1 rounded-full bg-[var(--color-handle-bar)]" />
        </div>

        {/* 헤더 — text-text-primary 전역 변수 */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-modal)] shrink-0">
          <h2 className="m-0 text-base font-bold text-text-primary">
            제품 비교
          </h2>
          {/* bg-brand-bg 전역 변수 */}
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-bg border-none cursor-pointer"
          >
            <X size={16} className="text-text-hint" />
          </button>
        </div>

        {/* 콘텐츠 — [scrollbar-width:none] Tailwind arbitrary */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-6 pb-8 [scrollbar-width:none]">
          {/* 제품 이미지 영역 */}
          <div className="grid grid-cols-[90px_1fr_1px_1fr]">
            <div />
            <div className="flex flex-col items-center gap-1">
              {isRoutineCompare && (
                <span className="text-[14px] font-bold px-2 py-0.5 rounded-full text-brand">
                  내 제품
                </span>
              )}
              <ProductHeader product={leftProduct} />
            </div>
            <div className="bg-[var(--color-border-modal)] self-stretch" />
            <div className="flex flex-col items-center gap-1">
              {isRoutineCompare && (
                <span className="text-[14px] font-bold px-2 py-0.5 rounded-fullp text-text-hint">
                  비교 제품
                </span>
              )}
              <ProductHeader product={rightProduct} />
            </div>
          </div>

          {/* 비교 표 */}
          {isLoading ? (
            <div className="flex justify-center py-6 text-sm text-text-muted">
              비교 데이터 불러오는 중...
            </div>
          ) : (
            <div
              className="rounded-xl border border-[var(--color-border-table)]"
              style={{ overflow: "clip" }}
            >
              {/* 헤더 행 — grid-cols Tailwind arbitrary */}
              <div className="grid grid-cols-[90px_1fr_1fr] bg-[var(--color-table-label-bg)]">
                <div className="px-3 py-2 text-sm font-semibold text-text-hint text-left">
                  제품명
                </div>
                <div className="px-2 py-2 text-sm font-semibold text-center text-text-muted leading-tight line-clamp-2">
                  {leftProduct.name}
                </div>
                <div className="px-2 py-2 text-sm font-semibold text-center text-text-muted leading-tight line-clamp-2">
                  {rightProduct.name}
                </div>
              </div>

              {/* 스크롤 가능한 데이터 행 */}
              <div className="max-h-[320px] overflow-y-auto [scrollbar-width:none]">
                {rows.map((row) => (
                  // border-t border-bg-beige → 전역 변수 --color-bg-beige (#f2efe9)
                  <div
                    key={row.label}
                    className="grid grid-cols-[90px_1fr_1fr] border-t border-bg-beige"
                  >
                    <div className="px-3 py-3 text-sm font-semibold text-text-hint bg-[var(--color-table-label-bg)] flex items-center">
                      {row.label}
                    </div>
                    <div
                      className="px-2 py-3 text-sm text-center flex items-center justify-center text-text-primary"
                      style={
                        row.highlightIndex === 0
                          ? { fontWeight: 700, color: HIGHLIGHT_COLOR }
                          : undefined
                      }
                    >
                      {row.leftContent}
                    </div>
                    <div
                      className="px-2 py-3 text-sm text-center flex items-center justify-center text-text-primary"
                      style={
                        row.highlightIndex === 1
                          ? { fontWeight: 700, color: HIGHLIGHT_COLOR }
                          : undefined
                      }
                    >
                      {row.rightContent}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI 비교 분석 — bg-brand-pale, border-border-warm 전역 변수 */}
          <div className="rounded-xl bg-brand-pale border border-border-warm p-4">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles size={14} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-hint uppercase tracking-wider">
                AI 비교 분석
              </span>
            </div>
            <p className="m-0 text-sm leading-relaxed text-text-hint">
              <strong className="font-semibold text-text-primary">
                {leftProduct.name}
              </strong>
              은 수분 공급과 진정에 강점이 있어 건조하거나 민감한 피부에
              적합합니다. 반면{" "}
              <strong className="font-semibold text-text-primary">
                {rightProduct.name}
              </strong>
              은 피지 조절과 안티에이징 효과가 뛰어나 복합성·지성 피부에 더
              효과적입니다.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
