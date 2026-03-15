// ⚠️ 미연결 컴포넌트 — 백엔드 연동 시 페이지에 연결 예정
"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const OVERLAY_STYLE = {
  backgroundColor: "rgba(0,0,0,0.45)",
  backdropFilter: "blur(4px)",
};
const HANDLE_BAR_STYLE = {
  width: 36,
  height: 4,
  borderRadius: 2,
  backgroundColor: "#E0E0E0",
};
const CLOSE_BTN_STYLE = {
  width: 30,
  height: 30,
  borderRadius: "50%",
  backgroundColor: "#F5F5F5",
};
const PRODUCT_THUMB_STYLE = {
  width: 52,
  height: 52,
  borderRadius: 12,
  backgroundColor: "white",
  fontSize: "24px",
};
const PRODUCT_THUMB_IMG = {
  width: 52,
  height: 52,
  objectFit: "cover" as const,
};

/**
 * components/features/search/AddToRoutineModal.tsx
 *
 * "루틴추가" 버튼 클릭 시 표시되는 루틴 스텝 선택 바텀시트.
 * 피그마: ProductSearchPage.addToRoutine() 로직 + 스텝 UI
 *
 * 사용법:
 *   <AddToRoutineModal
 *     product={product}
 *     onClose={() => setOpen(false)}
 *     onAdd={(stepKey) => { ... }}
 *   />
 */

import { X, Check, Plus } from "lucide-react";
import { ROUTINE_STEPS, type RoutineStepKey } from "@/constants/routineSteps";

export type { RoutineStepKey };

interface ProductBase {
  id: string | number;
  name: string;
  brand: string;
  category: string;
  emoji?: string;
  imageUrl?: string;
}

interface Props {
  product: ProductBase;
  /** 현재 루틴에 이미 들어있는 스텝 키 목록 */
  occupiedSteps?: RoutineStepKey[];
  onAdd: (stepKey: RoutineStepKey) => void;
  onClose: () => void;
}

const COLORS = {
  primary: "#A2AA7B",
  primaryBg: "#F0F2E8",
  primaryLight: "#C5CBA8",
  text: "#1A1A1A",
  muted: "#AFAFAF",
  border: "#F0F0F0",
};

export function AddToRoutineModal({
  product,
  occupiedSteps = [],
  onAdd,
  onClose,
}: Props) {
  // 제품 카테고리에 매칭되는 스텝을 자동 추천
  const recommendedStep = ROUTINE_STEPS.find((s) =>
    s.categories.some(
      (c) => c === product.category || product.category?.includes(c),
    ),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* 백드롭 */}
      <div
        className="absolute inset-0"
        style={OVERLAY_STYLE}
        onClick={onClose}
      />

      {/* 바텀시트 */}
      <div
        className="relative bg-white w-full flex flex-col"
        style={{
          maxWidth: "500px",
          borderRadius: "20px 20px 0 0",
          paddingBottom: "env(safe-area-inset-bottom, 16px)",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.12)",
          zIndex: 1,
        }}
      >
        {/* 핸들 */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={HANDLE_BAR_STYLE} />
        </div>

        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-2 pb-3">
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: COLORS.text }}>
            루틴 단계 선택
          </h3>
          <button
            onClick={onClose}
            className="flex items-center justify-center cursor-pointer border-none"
            style={CLOSE_BTN_STYLE}
          >
            <X size={16} color="#757575" />
          </button>
        </div>

        {/* 제품 미리보기 */}
        <div
          className="flex items-center gap-3 mx-5 mb-4 p-3"
          style={{
            borderRadius: 14,
            backgroundColor: COLORS.primaryBg,
            border: `1px solid ${COLORS.primaryLight}40`,
          }}
        >
          <div
            className="flex items-center justify-center shrink-0 overflow-hidden"
            style={PRODUCT_THUMB_STYLE}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                style={PRODUCT_THUMB_IMG}
              />
            ) : (
              (product.emoji ?? "🧴")
            )}
          </div>
          <div className="min-w-0">
            <p style={{ fontSize: "11px", color: COLORS.muted }}>
              {product.brand}
            </p>
            <p
              className="truncate"
              style={{ fontSize: "14px", fontWeight: 600, color: COLORS.text }}
            >
              {product.name}
            </p>
            <p
              style={{
                fontSize: "11px",
                color: COLORS.primary,
                fontWeight: 500,
                marginTop: 2,
              }}
            >
              {product.category}
            </p>
          </div>
        </div>

        {/* 스텝 리스트 */}
        <div className="flex flex-col gap-2 px-5 pb-6">
          {recommendedStep && (
            <p
              style={{ fontSize: "12px", color: COLORS.muted, marginBottom: 4 }}
            >
              💡 카테고리 기준 추천 단계가 강조됩니다
            </p>
          )}
          {ROUTINE_STEPS.map((step) => {
            const isOccupied = occupiedSteps.includes(step.key);
            const isRecommended = recommendedStep?.key === step.key;

            return (
              <button
                key={step.key}
                onClick={() => {
                  onAdd(step.key);
                  onClose();
                }}
                className="flex items-center gap-3 w-full cursor-pointer transition-all duration-200 active:scale-[0.98]"
                style={{
                  padding: "12px 14px",
                  borderRadius: 14,
                  backgroundColor: isRecommended
                    ? COLORS.primaryBg
                    : isOccupied
                      ? "#FAFAFA"
                      : "white",
                  border: isRecommended
                    ? `1.5px solid ${COLORS.primary}`
                    : `1px solid ${COLORS.border}`,
                  textAlign: "left",
                }}
              >
                {/* 스텝 아이콘 */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: isRecommended ? COLORS.primary : "#F5F0E8",
                    fontSize: "18px",
                  }}
                >
                  {isRecommended ? (
                    <span style={{ fontSize: "18px" }}>{step.icon}</span>
                  ) : (
                    <span style={{ fontSize: "18px", opacity: 0.6 }}>
                      {step.icon}
                    </span>
                  )}
                </div>

                {/* 스텝 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      style={{
                        fontSize: "14px",
                        fontWeight: 600,
                        color: isOccupied ? COLORS.muted : COLORS.text,
                      }}
                    >
                      {step.label}
                    </span>
                    {isRecommended && (
                      <span
                        style={{
                          fontSize: "10px",
                          padding: "1px 7px",
                          borderRadius: 10,
                          backgroundColor: COLORS.primary,
                          color: "white",
                          fontWeight: 600,
                        }}
                      >
                        추천
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "11px",
                      color: COLORS.muted,
                      marginTop: 2,
                    }}
                  >
                    {step.code} · {step.categories.slice(0, 3).join(", ")}
                  </p>
                </div>

                {/* 상태 아이콘 */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: "50%",
                    backgroundColor: isOccupied
                      ? "#F0F0F0"
                      : isRecommended
                        ? COLORS.primary
                        : "#F5F5F5",
                  }}
                >
                  {isOccupied ? (
                    <Check size={14} color={COLORS.muted} />
                  ) : (
                    <Plus
                      size={14}
                      color={isRecommended ? "white" : COLORS.muted}
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
