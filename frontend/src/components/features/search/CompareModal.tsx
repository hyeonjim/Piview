// ⚠️ 미연결 컴포넌트 — 백엔드 연동 시 페이지에 연결 예정
/**
 * components/features/search/CompareModal.tsx
 *
 * 제품 2개 비교 모달. search / recommend 페이지 공용.
 * Product 타입 대신 제네릭 구조로 작성하여 mock/실제 타입 모두 수용.
 */

"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const MODAL_OVERLAY_BG = {
  backgroundColor: "rgba(0,0,0,0.5)",
  backdropFilter: "blur(4px)",
};
const MODAL_CONTAINER = {
  borderRadius: "20px",
  width: "100%",
  maxWidth: "420px",
  maxHeight: "80vh",
  overflow: "hidden",
};
const MODAL_HEADER_TITLE = {
  fontSize: "17px",
  fontWeight: 600,
  color: "#1A1A1A",
};
const CLOSE_BTN_STYLE = {
  borderRadius: "50%",
  backgroundColor: "#F5F5F5",
  border: "none",
};
const SCROLL_BODY_STYLE = { scrollbarWidth: "none" as const };
const THUMB_CONTAINER = {
  height: "80px",
  borderRadius: "12px",
  backgroundColor: "#F5F5F5",
  fontSize: "36px",
};
const THUMB_IMG_STYLE = {
  width: "80px",
  height: "80px",
  objectFit: "cover" as const,
  borderRadius: "12px",
};
const BRAND_TEXT_STYLE = {
  fontSize: "10px",
  color: "#757575",
  marginTop: "8px",
};
const NAME_TEXT_STYLE = {
  fontSize: "12px",
  fontWeight: 600,
  color: "#1A1A1A",
  marginTop: "2px",
  lineHeight: 1.3,
};
const COMPARE_ROW_STYLE = {
  gridTemplateColumns: "70px 1fr 1fr",
  borderBottom: "1px solid #F0F0F0",
};
const COMPARE_LABEL_STYLE = { fontSize: "11px", color: "#757575" };
const OUTER_PAD_STYLE = { padding: "40px 20px" };
const SKIN_FN_LABEL_STYLE = {
  fontSize: "11px",
  color: "#757575",
  paddingTop: "2px",
};
const MATCH_BADGE_STYLE = { borderRadius: "12px", backgroundColor: "#F0F2E8" };
const MATCH_TITLE_STYLE = {
  fontSize: "13px",
  fontWeight: 600,
  color: "#1A1A1A",
  marginBottom: "4px",
};
const MATCH_DESC_STYLE = {
  fontSize: "12px",
  color: "#424242",
  lineHeight: 1.5,
};

import { X } from "lucide-react";
import { SKIN_FUNCTION_COLORS } from "@/constants/categoryColors";
import { formatPrice } from "@/utils/format";

export interface CompareProduct {
  id: string | number;
  brand: string;
  name: string;
  emoji?: string;
  imageUrl?: string;
  matchScore: number;
  price: number;
  volume: string;
  rating?: number;
  concerns?: Record<string, boolean>;
}

interface Props {
  items: [CompareProduct, CompareProduct];
  onClose: () => void;
}

export function CompareModal({ items, onClose }: Props) {
  const rows: { label: string; values: string[]; hiIndex?: number }[] = [
    {
      label: "매칭 점수",
      values: items.map((product) => `${product.matchScore}점`),
      hiIndex: items[0].matchScore >= items[1].matchScore ? 0 : 1,
    },
    {
      label: "가격",
      values: items.map((product) => formatPrice(product.price)),
      hiIndex: items[0].price <= items[1].price ? 0 : 1,
    },
    {
      label: "용량",
      values: items.map((product) => product.volume),
    },
    ...(items[0].rating != null
      ? [
          {
            label: "평점",
            values: items.map((product) => product.rating?.toFixed(1) ?? "-"),
            hiIndex: (items[0].rating ?? 0) >= (items[1].rating ?? 0) ? 0 : 1,
          },
        ]
      : []),
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={OUTER_PAD_STYLE}
    >
      <div
        className="absolute inset-0"
        style={MODAL_OVERLAY_BG}
        onClick={onClose}
      />
      <div className="relative bg-white flex flex-col" style={MODAL_CONTAINER}>
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 style={MODAL_HEADER_TITLE}>제품 비교</h3>
          <button
            onClick={onClose}
            className="p-1.5 cursor-pointer"
            style={CLOSE_BTN_STYLE}
          >
            <X size={16} color="#757575" />
          </button>
        </div>

        <div
          className="px-5 pb-6 overflow-y-auto flex-1"
          style={SCROLL_BODY_STYLE}
        >
          {/* 제품 이미지 */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {items.map((product) => (
              <div key={product.id} className="flex flex-col items-center">
                <div
                  className="flex items-center justify-center w-full"
                  style={THUMB_CONTAINER}
                >
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      style={THUMB_IMG_STYLE}
                    />
                  ) : (
                    (product.emoji ?? "🧴")
                  )}
                </div>
                <p style={BRAND_TEXT_STYLE}>{product.brand}</p>
                <p className="text-center" style={NAME_TEXT_STYLE}>
                  {product.name}
                </p>
              </div>
            ))}
          </div>

          {/* 비교 행 */}
          {rows.map((row) => (
            <div
              key={row.label}
              className="grid items-center py-2.5"
              style={COMPARE_ROW_STYLE}
            >
              <p style={COMPARE_LABEL_STYLE}>{row.label}</p>
              {row.values.map((value, index) => (
                <p
                  key={index}
                  className="text-center"
                  style={{
                    fontSize: "13px",
                    fontWeight: row.hiIndex === index ? 700 : 400,
                    color: row.hiIndex === index ? "var(--color-brand)" : "#1A1A1A",
                  }}
                >
                  {value}
                </p>
              ))}
            </div>
          ))}

          {/* 피부기능 비교 (concerns 있을 때만) */}
          {items[0].concerns && (
            <div className="grid items-start py-2.5" style={COMPARE_ROW_STYLE}>
              <p style={SKIN_FN_LABEL_STYLE}>피부기능</p>
              {items.map((product) => {
                const active = Object.entries(product.concerns ?? {})
                  .filter(([, isActive]) => isActive)
                  .map(([functionName]) => functionName);
                return (
                  <div
                    key={product.id}
                    className="flex flex-wrap gap-1 justify-center"
                  >
                    {active.length > 0 ? (
                      active.map((functionName) => {
                        const colorConfig = SKIN_FUNCTION_COLORS[functionName];
                        return (
                          <span
                            key={functionName}
                            style={{
                              fontSize: "10px",
                              padding: "2px 6px",
                              borderRadius: "6px",
                              backgroundColor: colorConfig?.chip ?? "#F0F0F0",
                              color: colorConfig?.accent ?? "#616161",
                              fontWeight: 500,
                            }}
                          >
                            {functionName}
                          </span>
                        );
                      })
                    ) : (
                      <span style={{ fontSize: "10px", color: "#BDBDBD" }}>
                        -
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* 추천 코멘트 */}
          <div className="mt-3 p-4" style={MATCH_BADGE_STYLE}>
            <p style={MATCH_TITLE_STYLE}>💡 PiView 추천</p>
            <p style={MATCH_DESC_STYLE}>
              {items[0].matchScore >= items[1].matchScore
                ? `${items[0].brand} ${items[0].name}이(가) 매칭 점수가 더 높아 더 적합합니다.`
                : `${items[1].brand} ${items[1].name}이(가) 매칭 점수가 더 높아 더 적합합니다.`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
