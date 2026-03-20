/**
 * components/common/FilterModal.tsx
 * 검색/추천 페이지 공용 필터 모달
 */
"use client";

const RANGE_INPUT_BASE: React.CSSProperties = {
  top: 6,
  height: 20,
  appearance: "none",
  background: "transparent",
};

import React, { useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import {
  SKIN_FUNCTIONS,
  SKIN_TYPE_LABELS_FOR_FILTER,
} from "@/constants/categoryColors";
import type { FilterState } from "@/types/common";
import { PRICE_MAX } from "@/types/common";

export type { FilterState };
export { FILTER_INITIAL_STATE } from "@/types/common";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  state: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onReset: () => void;
  resultCount: number;
  availableBrands: string[];
}

export function FilterModal({
  open,
  onClose,
  state,
  onChange,
  onReset,
  resultCount,
}: FilterModalProps) {
  const { filterSkin, filterFns, priceRange } =
    state;

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-black/30"
        onClick={onClose}
        style={{ backdropFilter: "blur(4px)" }}
      />

      <div
        className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none"
        style={{ padding: "0" }}
      >
        <div
          className="flex flex-col pointer-events-auto w-full"
          style={{
            maxWidth: "500px",
            maxHeight: "88vh",
            backgroundColor: "#FFFFFF",
            borderRadius: "16px 16px 0 0",
            boxShadow: "0 -8px 40px rgba(0,0,0,0.12)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 드래그 핸들 */}
          <div className="flex justify-center" style={{ padding: "12px 0 0" }}>
            <div
              style={{
                width: "36px",
                height: "4px",
                borderRadius: "2px",
                backgroundColor: "#E8E4DF",
              }}
            />
          </div>

          {/* 헤더 */}
          <div
            className="flex items-center justify-between"
            style={{
              padding: "12px 20px 14px",
              borderBottom: "1px solid #F4F2EF",
            }}
          >
            <h3
              style={{
                margin: 0,
                fontSize: "16px",
                fontWeight: 700,
                color: "#1C1C1E",
                letterSpacing: "-0.2px",
              }}
            >
              필터
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={onReset}
                className="flex items-center gap-1 border-none bg-transparent cursor-pointer"
                style={{
                  fontSize: "12px",
                  color: "#A8A39D",
                }}
              >
                <RotateCcw size={12} /> 초기화
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center cursor-pointer border-none"
                style={{
                  width: "28px",
                  height: "28px",
                  borderRadius: "50%",
                  backgroundColor: "#F4F2EF",
                }}
              >
                <X size={14} style={{ color: "#8A8278" }} />
              </button>
            </div>
          </div>

          {/* 바디 */}
          <div style={{ overflowY: "auto", flex: 1, padding: "0 20px" }}>
            {/* 피부타입 */}
            <FilterSection title="피부타입">
              <div className="flex flex-wrap" style={{ gap: "8px" }}>
                {["전체", ...SKIN_TYPE_LABELS_FOR_FILTER].map((st) => {
                  const isActive =
                    st === "전체" ? !filterSkin : filterSkin === st;
                  return (
                    <FilterChip
                      key={st}
                      label={st}
                      active={isActive}
                      variant="skin"
                      onClick={() =>
                        onChange({
                          filterSkin:
                            st === "전체"
                              ? null
                              : filterSkin === st
                                ? null
                                : st,
                        })
                      }
                    />
                  );
                })}
              </div>
            </FilterSection>

            <div style={{ height: "1px", backgroundColor: "#F4F2EF" }} />

            {/* 피부고민 — 최대 4개 중복 선택 */}
            <FilterSection
              title="피부고민"
              rightLabel={
                filterFns.size > 0 ? `${filterFns.size}/4` : undefined
              }
            >
              <div className="flex flex-wrap" style={{ gap: "8px" }}>
                {SKIN_FUNCTIONS.map((fn) => {
                  const isActive = filterFns.has(fn);
                  const isDisabled = !isActive && filterFns.size >= 4;
                  return (
                    <FilterChip
                      key={fn}
                      label={fn}
                      active={isActive}
                      disabled={isDisabled}
                      variant="concern"
                      onClick={() => {
                        if (isDisabled) return;
                        const newSet = new Set(filterFns);
                        newSet.has(fn) ? newSet.delete(fn) : newSet.add(fn);
                        onChange({ filterFns: newSet });
                      }}
                    />
                  );
                })}
              </div>
            </FilterSection>

            <div style={{ height: "1px", backgroundColor: "#F4F2EF" }} />

            {/* 가격 */}
            <FilterSection
              title="가격"
              rightLabel={
                priceRange[0] === 0 && priceRange[1] === PRICE_MAX
                  ? "전체"
                  : `${priceRange[0] === 0 ? "0원" : priceRange[0].toLocaleString() + "원"} ~ ${priceRange[1] === PRICE_MAX ? "제한없음" : priceRange[1].toLocaleString() + "원"}`
              }
            >
              <div
                style={{
                  position: "relative",
                  height: "36px",
                  paddingTop: "14px",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: 0,
                    right: 0,
                    height: "2px",
                    borderRadius: "1px",
                    backgroundColor: "#EDEBE8",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    top: "14px",
                    left: `${(priceRange[0] / PRICE_MAX) * 100}%`,
                    right: `${100 - (priceRange[1] / PRICE_MAX) * 100}%`,
                    height: "2px",
                    borderRadius: "1px",
                    backgroundColor: "#1C1C1E",
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={PRICE_MAX}
                  step={1000}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({
                      priceRange: [
                        Math.min(v, priceRange[1] - 1000),
                        priceRange[1],
                      ],
                    });
                  }}
                  className="absolute w-full"
                  style={{
                    ...RANGE_INPUT_BASE,
                    zIndex: priceRange[0] > PRICE_MAX * 0.5 ? 5 : 3,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={PRICE_MAX}
                  step={1000}
                  value={priceRange[1]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({
                      priceRange: [
                        priceRange[0],
                        Math.max(v, priceRange[0] + 1000),
                      ],
                    });
                  }}
                  className="absolute w-full"
                  style={{ ...RANGE_INPUT_BASE, zIndex: 4 }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance:none; width:18px; height:18px; border-radius:50%;
                    background:#1C1C1E; border:2px solid #fff;
                    box-shadow:0 1px 6px rgba(0,0,0,.2); cursor:pointer;
                  }
                  input[type="range"]::-moz-range-thumb {
                    width:18px; height:18px; border-radius:50%;
                    background:#1C1C1E; border:2px solid #fff;
                    box-shadow:0 1px 6px rgba(0,0,0,.2); cursor:pointer;
                  }
                `}</style>
              </div>
              <div
                className="flex items-center justify-between"
                style={{ marginTop: "4px" }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    color: "#C4BEB7",
                  }}
                >
                  0원
                </span>
                <span
                  style={{
                    fontSize: "11px",
                    color: "#C4BEB7",
                  }}
                >
                  1,000,000원+
                </span>
              </div>
            </FilterSection>

            <div style={{ height: "8px" }} />
          </div>

          {/* 적용 버튼 */}
          <div
            style={{
              padding: "12px 20px 24px",
              borderTop: "1px solid #F4F2EF",
            }}
          >
            <button
              onClick={onClose}
              className="w-full cursor-pointer border-none transition-all active:scale-[0.98]"
              style={{
                height: "44px",
                borderRadius: "8px",
                backgroundColor: "#1C1C1E",
                color: "#FFFFFF",
                fontSize: "14px",
                fontWeight: 700,
                letterSpacing: "0.01em",
              }}
            >
              {resultCount.toLocaleString()}개 제품 보기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

function FilterSection({
  title,
  rightLabel,
  children,
}: {
  title: string;
  rightLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div style={{ padding: "18px 0" }}>
      <div
        className="flex items-center justify-between"
        style={{ marginBottom: "12px" }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "13px",
            fontWeight: 700,
            color: "#1C1C1E",
            letterSpacing: "-0.1px",
          }}
        >
          {title}
        </p>
        {rightLabel && (
          <p
            style={{
              margin: 0,
              fontSize: "11px",
              color: "#B0A99F",
            }}
          >
            {rightLabel}
          </p>
        )}
      </div>
      {children}
    </div>
  );
}

// variant별 활성 색상 팔레트
const CHIP_ACTIVE_STYLE: Record<
  string,
  { bg: string; border: string; color: string }
> = {
  // 피부타입 — 따뜻한 테라코타 계열
  skin: { bg: "#F5EDE8", border: "#D4A090", color: "#9B6A54" },
  // 피부고민 — 뮤트 세이지 계열
  concern: { bg: "#E4EAE0", border: "#A0B898", color: "#5A7850" },
  // 기본(브랜드 등) — 다크 브라운
  default: { bg: "#5A504A", border: "#5A504A", color: "#FFFFFF" },
};

function FilterChip({
  label,
  active,
  onClick,
  variant = "default",
  disabled = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  variant?: "default" | "skin" | "concern";
  disabled?: boolean;
}) {
  const activeStyle = CHIP_ACTIVE_STYLE[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: "32px",
        padding: "0 14px",
        borderRadius: "6px",
        border: `1px solid ${active ? activeStyle.border : "#EDEBE8"}`,
        backgroundColor: active
          ? activeStyle.bg
          : disabled
            ? "#F7F6F4"
            : "#FAFAF8",
        color: active ? activeStyle.color : disabled ? "#C8C3BC" : "#8A8278",
        fontSize: "12px",
        fontWeight: active ? 600 : 400,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {label}
    </button>
  );
}
