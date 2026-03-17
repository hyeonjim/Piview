// ⚠️ 미연결 컴포넌트 — 백엔드 연동 시 페이지에 연결 예정
/**
 * components/features/routine/RoutineStepCard.tsx
 *
 * 루틴 페이지의 단계별 카드.
 * 제품이 있으면 제품 정보, 없으면 추가 유도 UI.
 */

"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const STEP_DIVIDER_STYLE = {
  padding: "12px 0",
  borderBottom: "1px solid rgba(0,0,0,0.05)",
};
const STEP_NUM_SIZE = { width: "28px", height: "28px", borderRadius: "50%" };
const STEP_NUM_TEXT_FIRST = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#fff",
};
const STEP_NUM_TEXT_DEFAULT = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#B8A99A",
};
const THUMB_FILLED_STYLE = {
  width: "64px",
  height: "64px",
  borderRadius: "10px",
  backgroundColor: "#F8F5EF",
};
const THUMB_IMG_STYLE = {
  width: "100%",
  height: "100%",
  objectFit: "cover" as const,
};
const THUMB_EMOJI_STYLE = { fontSize: "24px" };
const STEP_LABEL_STYLE = {
  fontSize: "11px",
  fontWeight: 500,
  color: "var(--color-brand)",
  margin: 0,
};
const PRODUCT_NAME_STYLE = {
  fontSize: "14px",
  fontWeight: 500,
  color: "#1A1A1A",
  margin: "1px 0 0",
};
const BRAND_TEXT_STYLE = { fontSize: "11px", color: "#B8A99A", margin: 0 };
const REMOVE_BTN_STYLE = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  backgroundColor: "#F5F5F5",
  border: "none",
};
const THUMB_EMPTY_STYLE = {
  width: "64px",
  height: "64px",
  borderRadius: "10px",
  backgroundColor: "#F5F0E8",
};
const THUMB_EMPTY_EMOJI = { fontSize: "24px", opacity: 0.5 };
const EMPTY_HINT_STYLE = {
  fontSize: "13px",
  color: "#B8A99A",
  margin: "2px 0 0",
};
const ADD_BTN_STYLE = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  backgroundColor: "var(--color-brand)",
  border: "none",
};

import { Plus, X } from "lucide-react";
import Link from "next/link";

export interface RoutineStepCardProduct {
  id: string | number;
  name: string;
  brand: string;
  emoji: string;
  imageUrl?: string;
}

interface Props {
  stepNumber: number;
  stepLabel: string; // ex: "클렌저"
  stepIcon: string; // ex: "🫧"
  category: string; // 검색 링크용
  product?: RoutineStepCardProduct | null;
  isFirst?: boolean;
  onRemove?: () => void;
  onAdd?: () => void;
}

export function RoutineStepCard({
  stepNumber,
  stepLabel,
  stepIcon,
  product,
  isFirst = false,
  onRemove,
  onAdd,
}: Props) {
  return (
    <div className="flex items-center gap-3" style={STEP_DIVIDER_STYLE}>
      {/* 번호 */}
      <div
        className="flex items-center justify-center shrink-0"
        style={{
          ...STEP_NUM_SIZE,
          backgroundColor: isFirst ? "var(--color-brand)" : "#F5F0E8",
        }}
      >
        <span style={isFirst ? STEP_NUM_TEXT_FIRST : STEP_NUM_TEXT_DEFAULT}>
          {stepNumber}
        </span>
      </div>

      {product ? (
        <>
          {/* 제품 이미지 */}
          <div
            className="flex items-center justify-center overflow-hidden shrink-0"
            style={THUMB_FILLED_STYLE}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={THUMB_IMG_STYLE}
              />
            ) : (
              <span style={THUMB_EMOJI_STYLE}>{product.emoji}</span>
            )}
          </div>

          {/* 제품 정보 */}
          <div className="flex-1 min-w-0">
            <p style={STEP_LABEL_STYLE}>{stepLabel}</p>
            <Link href={`/product/${product.id}`}>
              <p className="truncate" style={PRODUCT_NAME_STYLE}>
                {product.name}
              </p>
            </Link>
            <p style={BRAND_TEXT_STYLE}>{product.brand}</p>
          </div>

          {/* 제거 버튼 */}
          <button
            onClick={onRemove}
            className="shrink-0 flex items-center justify-center cursor-pointer transition-all active:scale-90"
            style={REMOVE_BTN_STYLE}
          >
            <X size={14} color="#9E9E9E" />
          </button>
        </>
      ) : (
        <>
          {/* 빈 슬롯 아이콘 */}
          <div
            className="flex items-center justify-center shrink-0"
            style={THUMB_EMPTY_STYLE}
          >
            <span style={THUMB_EMPTY_EMOJI}>{stepIcon}</span>
          </div>

          {/* 안내 텍스트 */}
          <div className="flex-1 min-w-0">
            <p style={STEP_LABEL_STYLE}>{stepLabel}</p>
            <p style={EMPTY_HINT_STYLE}>제품을 추가해보세요</p>
          </div>

          {/* 추가 버튼 */}
          <button
            onClick={onAdd}
            className="shrink-0 flex items-center justify-center cursor-pointer transition-all active:scale-90"
            style={ADD_BTN_STYLE}
          >
            <Plus size={14} color="#fff" />
          </button>
        </>
      )}
    </div>
  );
}
