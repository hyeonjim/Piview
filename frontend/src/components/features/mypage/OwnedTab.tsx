"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const OWNED_PRODUCT_CARD_STYLE = {
  borderRadius: "14px",
  border: "1px solid #E2E1DC",
  backgroundColor: "var(--color-warm-bg)",
};
const AVOID_PRODUCT_CARD_STYLE = {
  borderRadius: "14px",
  border: "1px solid var(--color-bg-like)",
  backgroundColor: "#FFFCFC",
};
const AVOID_SECTION_HEADER_ICON = { color: "var(--color-danger)" };
const AVOID_ADD_BTN_STYLE = {
  fontSize: "13px",
  padding: "4px 12px",
  borderRadius: "20px",
  border: "none",
  backgroundColor: "var(--color-bg-like)",
  color: "var(--color-danger)",
  cursor: "pointer",
  fontWeight: 600,
};
const AVOID_MINUS_BTN_STYLE = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  border: "none",
  backgroundColor: "var(--color-bg-like)",
  color: "var(--color-danger)",
  cursor: "pointer",
};
const PRODUCT_CODE_BADGE = {
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  backgroundColor: "var(--color-bg-muted-warm)",
  fontSize: "10px",
  fontWeight: 700,
};

import { Package, ShieldAlert, Minus } from "lucide-react";
import { EmptyState } from "@/components/common";
import {
  CATEGORY_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";
import type { SearchProduct } from "@/constants/_mock/searchProducts";
import type { LocalProduct } from "@/stores/useLocalRoutineStore";

interface OwnedTabProps {
  routine: Record<string, LocalProduct | null>;
  ownedProducts: SearchProduct[];
  avoidProducts: SearchProduct[];
  onRemoveOwned: (id: string) => void;
  onRemoveAvoid: (id: string) => void;
  onOpenAvoidModal: () => void;
}

export default function OwnedTab({
  routine,
  ownedProducts,
  avoidProducts,
  onRemoveOwned,
  onRemoveAvoid,
  onOpenAvoidModal,
}: OwnedTabProps) {
  return (
    <div className="px-5 pb-24 pt-4 flex flex-col gap-6">
      {/* ── 보유제품 섹션 ── */}
      <div>
        <p className="text-base font-bold text-text-primary">보유제품</p>
        <p className="text-xs text-text-muted mt-0.5">
          {ownedProducts.length}개 보유 중
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {ownedProducts.length === 0 ? (
            <div className="border border-dashed border-border rounded-2xl py-12">
              <EmptyState
                icon={Package}
                title="보유한 제품이 없습니다"
                description={
                  "제품 상세에서 보유중 버튼을 눌러\n제품을 등록해보세요"
                }
              />
            </div>
          ) : (
            ownedProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 bg-bg-card"
                style={OWNED_PRODUCT_CARD_STYLE}
              >
                {/* 이미지/코드 배지 */}
                <div
                  className="shrink-0 flex items-center justify-center text-text-muted"
                  style={PRODUCT_CODE_BADGE}
                >
                  {product.emoji}
                </div>
                {/* 제품 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[11px] text-text-muted">
                      {product.brand}
                    </span>
                    {CATEGORY_COLORS[product.category] && (
                      <span
                        className="text-[10px] px-1.5 py-[1px] rounded-[4px] font-medium"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[product.category].chip,
                          color: CATEGORY_COLORS[product.category].accent,
                        }}
                      >
                        {product.category}
                      </span>
                    )}
                    {/* 루틴 등록 여부 표시 */}
                    {Object.values(routine).some(
                      (routineProduct) => routineProduct?.id === product.id,
                    ) && (
                      <span className="text-[10px] px-1.5 py-[1px] rounded-[4px] font-medium bg-brand-bg text-brand">
                        루틴
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {product.name}
                  </p>
                  {product.skinTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.skinTypes.map((skinType) => {
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
                </div>
                {/* 삭제 버튼 */}
                <button
                  onClick={() => onRemoveOwned(product.id)}
                  className="shrink-0 flex items-center justify-center"
                  style={AVOID_MINUS_BTN_STYLE}
                >
                  <Minus size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── 피해야 할 제품 섹션 ── */}
      <div>
        <div className="flex items-center justify-between mb-0.5">
          <div className="flex items-center gap-1.5">
            <ShieldAlert size={16} style={AVOID_SECTION_HEADER_ICON} />
            <p className="text-base font-bold text-text-primary">
              피해야 할 제품
            </p>
          </div>
          <button onClick={onOpenAvoidModal} style={AVOID_ADD_BTN_STYLE}>
            + 추가
          </button>
        </div>
        <p className="text-xs text-text-muted">
          {avoidProducts.length}개 등록됨
        </p>
        <div className="mt-3 flex flex-col gap-2">
          {avoidProducts.length === 0 ? (
            <div
              className="border border-dashed rounded-2xl py-12"
              style={{ borderColor: "var(--color-bg-like)" }}
            >
              <EmptyState
                icon={ShieldAlert}
                title="등록된 제품이 없습니다"
                description={
                  "트러블을 유발했거나 맞지 않았던\n제품을 등록해보세요"
                }
              />
            </div>
          ) : (
            avoidProducts.map((product) => (
              <div
                key={product.id}
                className="flex items-center gap-3 p-3 bg-white"
                style={AVOID_PRODUCT_CARD_STYLE}
              >
                {/* 방패 아이콘 + 코드 배지 */}
                <div className="shrink-0 flex flex-col items-center gap-1">
                  <ShieldAlert size={14} style={AVOID_SECTION_HEADER_ICON} />
                  <div
                    className="flex items-center justify-center text-text-muted"
                    style={PRODUCT_CODE_BADGE}
                  >
                    {product.emoji}
                  </div>
                </div>
                {/* 제품 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                    <span className="text-[11px] text-text-muted">
                      {product.brand}
                    </span>
                    {CATEGORY_COLORS[product.category] && (
                      <span
                        className="text-[10px] px-1.5 py-[1px] rounded-[4px] font-medium"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[product.category].chip,
                          color: CATEGORY_COLORS[product.category].accent,
                        }}
                      >
                        {product.category}
                      </span>
                    )}
                  </div>
                  <p className="truncate text-sm font-semibold text-text-primary">
                    {product.name}
                  </p>
                  {product.skinTypes.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {product.skinTypes.map((skinType) => {
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
                </div>
                {/* 삭제 버튼 */}
                <button
                  onClick={() => onRemoveAvoid(product.id)}
                  className="shrink-0 flex items-center justify-center"
                  style={AVOID_MINUS_BTN_STYLE}
                >
                  <Minus size={13} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
