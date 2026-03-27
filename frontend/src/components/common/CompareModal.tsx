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
import { X, Loader2, MessageSquareText } from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { formatPrice } from "@/utils/format";
import { SkinTypeTag } from "@/components/common/ProductCard";
import { useProductCompare, useAiComparisonSummary } from "@/hooks";
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

// AI 카드 — 3D 입체감 + 아래서 위로 fade in
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, rotateX: 6 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
  },
};

// 컨텐츠 — stagger 부모
const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } },
};

// 각 줄 — fade + 살짝 위로 + scale
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};

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
        <p className="text-[13px] text-[#5d5c5b] font-medium text-center leading-tight px-1 truncate w-full">
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

  // AI 비교 분석 — 모달 열릴 때 자동 호출
  const {
    data: aiComparison,
    isLoading: isAiLoading,
    isError: isAiError,
  } = useAiComparisonSummary(productIds);

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
            (apiLeft?.skinConcerns ?? leftProduct.effects).map((effect) => (
              <span
                key={effect}
                className="text-[10px] px-1.5 py-px rounded-[10px] border font-semibold bg-[#f9f8f6] text-[#726c67]"
              >
                {effect}
              </span>
            ))
          ) : (
            <span className="text-sm text-[var(--color-nav-inactive)]">-</span>
          )}
        </div>
      ),
      rightContent: (
        <div className="flex flex-wrap gap-1 justify-center">
          {(apiRight?.skinConcerns ?? rightProduct.effects ?? []).length > 0 ? (
            (apiRight?.skinConcerns ?? rightProduct.effects).map((effect) => (
              <span
                key={effect}
                className="text-[10px] px-1.5 py-px rounded-[10px] border font-semibold bg-[#f9f8f6] text-[#726c67]"
              >
                {effect}
              </span>
            ))
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
        <div className="flex items-center gap-1.5 flex-wrap justify-center font-normal">
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
        <div className="flex items-center gap-1.5 flex-wrap justify-center font-normal">
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
          <span className="text-[13px] text-text-hint">없음</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[13px] font-semibold text-[#dc6262]">
              {apiLeft.allergy.count}개
            </span>
            <span className="text-[13px] text-text-muted text-center font-semibold">
              {apiLeft.allergy.ingredients.join(", ")}
            </span>
          </div>
        )
      ) : (
        <span className="text-sm text-text-hint">-</span>
      ),
      rightContent: apiRight ? (
        apiRight.allergy.count === 0 ? (
          <span className="text-[13px] text-text-hint">없음</span>
        ) : (
          <div className="flex flex-col items-center gap-1">
            <span className="text-[13px] font-semibold text-[#dc6262]">
              {apiRight.allergy.count}개
            </span>
            <span className="text-[13px] text-text-muted text-center font-semibold">
              {apiRight.allergy.ingredients.join(", ")}
            </span>
          </div>
        )
      ) : (
        <span className="text-[13px] text-text-hint">-</span>
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
      className="fixed inset-0 z-[80] flex flex-col justify-end items-center"
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

        <div className="flex items-center justify-between px-4 py-1 border-b border-[var(--color-border-modal)] shrink-0">
          <h2 className="text-[14px] font-semibold text-[#6f6e6e]">
            제품 비교
          </h2>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer"
          >
            <X size={16} className="text-text-hint" />
          </button>
        </div>

        {/* 콘텐츠 — [scrollbar-width:none] Tailwind arbitrary */}
        <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 pb-8 [scrollbar-width:none]">
          {/* 제품 이미지 영역 */}
          <div className="grid grid-cols-[90px_1fr_1px_1fr]">
            <div />
            <div className="flex flex-col items-center">
              {isRoutineCompare && (
                <span className="text-[14px] font-semibold px-2 py-0.5 rounded-full text-[#5d5c5b]">
                  내 제품
                </span>
              )}
              <ProductHeader product={leftProduct} />
            </div>
            <div className="bg-[var(--color-border-modal)] self-stretch" />
            <div className="flex flex-col items-center">
              {isRoutineCompare && (
                <span className="text-[14px] font-semibold px-2 py-0.5 rounded-fullp text-[#5d5c5b]">
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
              className="rounded-xl border border-[#e2e0dc]"
              style={{ overflow: "clip" }}
            >
              {/* 헤더 행 — grid-cols Tailwind arbitrary */}
              <div className="grid grid-cols-[90px_1fr_1fr]">
                <div className="px-2 py-3 text-[14px] font-semibold text-text-hint bg-[#f2f2f1] flex items-center">
                  제품명
                </div>
                <div className="px-2 py-3 text-[12px] text-center flex items-center justify-center text-text-primary">
                  <span className="text-[14px] font-semibold text-[#535252] leading-tight line-clamp-2">
                    {leftProduct.name}
                  </span>
                </div>
                <div className="px-2 py-3 text-[12px] text-center flex items-center justify-center text-text-primary">
                  <span className="text-[14px] font-semibold text-[#535252] leading-tight line-clamp-2">
                    {rightProduct.name}
                  </span>
                </div>
              </div>

              {/* 스크롤 가능한 데이터 행 */}
              <div className="max-h-[320px] overflow-y-auto [scrollbar-width:none]">
                {rows.map((row) => (
                  // border-t border-bg-beige → 전역 변수 --color-bg-beige (#f2efe9)
                  <div
                    key={row.label}
                    className="grid grid-cols-[90px_1fr_1fr] border-t border-[#e2e0dc]"
                  >
                    <div className="px-2 py-3 text-[14px] font-semibold text-text-hint bg-[#f2f2f1] flex items-center">
                      {row.label}
                    </div>
                    <div
                      className="px-2 py-3 text-[12px] text-center flex items-center justify-center text-text-primary"
                      style={
                        row.highlightIndex === 0
                          ? { fontWeight: 700, color: HIGHLIGHT_COLOR }
                          : undefined
                      }
                    >
                      {row.leftContent}
                    </div>
                    <div
                      className="px-2 py-3 text-[12px] text-center flex items-center justify-center text-text-primary"
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

          {/* AI 비교 분석 */}
          <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            className="rounded-2xl p-5 mt-1 border border-[#dde6ef] bg-[#f8fafb]"
            style={{
              boxShadow:
                "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(115, 142, 174, 0.14), 0 1px 4px rgba(115, 142, 174, 0.08)",
            }}
          >
            {/* 헤더 */}
            <div className="flex items-center gap-2 mb-4">
              <div className="size-6 rounded-lg flex items-center justify-center bg-[#b8cbdb]">
                <MessageSquareText size={12} className="text-white" />
              </div>
              <p className="text-[16px] font-bold text-[#3c5061]">AI 비교 분석</p>
            </div>

            {isAiLoading && (
              <div className="flex items-center justify-center py-6 gap-2 text-text-muted">
                <Loader2 size={18} className="animate-spin opacity-50" />
                <p className="text-xs">AI가 두 제품을 비교 분석하고 있어요...</p>
              </div>
            )}

            {isAiError && !isAiLoading && (
              <p className="text-xs text-text-muted">
                AI 비교 분석을 불러오지 못했어요.
              </p>
            )}

            <AnimatePresence>
              {aiComparison && !isAiLoading && (
                <motion.div
                  variants={listVariants}
                  initial="hidden"
                  animate="visible"
                  className="flex flex-col gap-2.5"
                >
                  <motion.p
                    variants={itemVariants}
                    className="text-[14px] text-[#353b41] leading-[1.7]"
                  >
                    {aiComparison.comparisonText}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
