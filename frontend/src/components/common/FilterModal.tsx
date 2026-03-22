/**
 * components/common/FilterModal.tsx
 * 검색/추천 페이지 공용 필터 모달
 */
"use client";

const RANGE_SLIDER_BASE_STYLE: React.CSSProperties = {
  top: 6,
  height: 20,
  appearance: "none",
  background: "transparent",
};

import React, { useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { SKIN_TYPE_LABELS_FOR_FILTER } from "@/constants/categoryColors";
import type { FilterState } from "@/types/common";
import { PRICE_MAX } from "@/types/common";
import { useProductFilters } from "@/hooks";

export type { FilterState };
export { FILTER_INITIAL_STATE } from "@/types/common";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  state: FilterState;
  onChange: (next: Partial<FilterState>) => void;
  onReset: () => void;
  resultCount: number;
}

export function FilterModal({
  open,
  onClose,
  state,
  onChange,
  onReset,
  resultCount,
}: FilterModalProps) {
  const { filterSkin, tagIds, priceRange } = state;
  const { data: filterMeta } = useProductFilters();
  const tags = filterMeta?.tags ?? [];

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
        className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none p-0">
        <div
          className="flex flex-col pointer-events-auto w-full max-w-app max-h-[88vh] bg-white rounded-t-2xl shadow-[0_-8px_40px_rgba(0,0,0,0.12)] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 드래그 핸들 */}
          <div className="flex justify-center pt-3">
            <div className="w-9 h-1 rounded-sm bg-gray-200" />
          </div>

          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 pt-3 pb-[14px] border-b border-gray-100">
            <h3 className="m-0 text-base font-bold text-gray-900 tracking-tight">
              필터
            </h3>
            <div className="flex items-center gap-3">
              <button
                onClick={onReset}
                className="flex items-center gap-1 border-none bg-transparent cursor-pointer text-xs text-gray-400"
              >
                <RotateCcw size={12} /> 초기화
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center cursor-pointer border-none w-7 h-7 rounded-full bg-gray-100"
              >
                <X size={14} className="text-gray-500" />
              </button>
            </div>
          </div>

          {/* 바디 */}
          <div className="overflow-y-auto flex-1 px-5">
            {/* 피부타입 */}
            <FilterSection title="피부타입">
              <div className="flex flex-wrap gap-2">
                {["전체", ...SKIN_TYPE_LABELS_FOR_FILTER].map((skinType) => {
                  const isActive =
                    skinType === "전체" ? !filterSkin : filterSkin === skinType;
                  return (
                    <FilterChip
                      key={skinType}
                      label={skinType}
                      active={isActive}
                      onClick={() =>
                        onChange({
                          filterSkin:
                            skinType === "전체"
                              ? null
                              : filterSkin === skinType
                                ? null
                                : skinType,
                        })
                      }
                    />
                  );
                })}
              </div>
            </FilterSection>

            <div className="h-px bg-gray-100" />

            {/* 피부고민 태그 — API */}
            <FilterSection
              title="피부고민"
              rightLabel={Object.values(tagIds).filter(Boolean).length > 0 ? `${Object.values(tagIds).filter(Boolean).length}/4` : undefined}
            >
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const isActive = tagIds[t.tagId] === true;
                  const activeCount = Object.values(tagIds).filter(Boolean).length;
                  const isDisabled = !isActive && activeCount >= 4;
                  return (
                    <FilterChip
                      key={t.tagId}
                      label={t.tag}
                      active={isActive}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        onChange({ tagIds: { ...tagIds, [t.tagId]: !tagIds[t.tagId] } });
                      }}
                    />
                  );
                })}
              </div>
            </FilterSection>

            <div className="h-px bg-gray-100" />

            {/* 가격 */}
            <FilterSection
              title="가격"
              rightLabel={
                priceRange[0] === 0 && priceRange[1] === PRICE_MAX
                  ? "전체"
                  : `${priceRange[0] === 0 ? "0원" : priceRange[0].toLocaleString() + "원"} ~ ${priceRange[1] === PRICE_MAX ? "제한없음" : priceRange[1].toLocaleString() + "원"}`
              }
            >
              <div className="relative h-9 pt-[14px]">
                <div className="absolute top-[14px] left-0 right-0 h-0.5 rounded-[1px] bg-gray-200" />
                <div
                  className="absolute top-[14px] h-0.5 rounded-[1px] bg-gray-900"
                  style={{
                    left: `${(priceRange[0] / PRICE_MAX) * 100}%`,
                    right: `${100 - (priceRange[1] / PRICE_MAX) * 100}%`,
                  }}
                />
                <input
                  type="range"
                  min={0}
                  max={PRICE_MAX}
                  step={1000}
                  value={priceRange[0]}
                  onChange={(e) => {
                    const value = Number(e.target.value);
                    onChange({
                      priceRange: [
                        Math.min(value, priceRange[1] - 1000),
                        priceRange[1],
                      ],
                    });
                  }}
                  className="absolute w-full"
                  style={{
                    ...RANGE_SLIDER_BASE_STYLE,
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
                    const value = Number(e.target.value);
                    onChange({
                      priceRange: [
                        priceRange[0],
                        Math.max(value, priceRange[0] + 1000),
                      ],
                    });
                  }}
                  className="absolute w-full"
                  style={{ ...RANGE_SLIDER_BASE_STYLE, zIndex: 4 }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance:none; width:18px; height:18px; border-radius:50%;
                    background:#374151; border:2px solid #fff;
                    box-shadow:0 1px 6px rgba(0,0,0,.2); cursor:pointer;
                  }
                  input[type="range"]::-moz-range-thumb {
                    width:18px; height:18px; border-radius:50%;
                    background:#374151; border:2px solid #fff;
                    box-shadow:0 1px 6px rgba(0,0,0,.2); cursor:pointer;
                  }
                `}</style>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[14px] text-gray-500">0원</span>
                <span className="text-[14px] text-gray-500">1,000,000원+</span>
              </div>
            </FilterSection>

            <div className="h-2" />
          </div>

          {/* 적용 버튼 */}
          <div className="px-5 pt-3 pb-6 border-t border-gray-100">
            <button
              onClick={onClose}
              className="w-full cursor-pointer border-none transition-all active:scale-[0.98] h-11 rounded-lg bg-gray-900 text-white text-sm font-bold tracking-wide"
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
    <div className="py-[18px]">
      <div className="flex items-center justify-between mb-3">
        <p className="m-0 text-base font-bold text-gray-900 tracking-tight">
          {title}
        </p>
        {rightLabel && (
          <p className="m-0 text-sm text-gray-400">{rightLabel}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function FilterChip({
  label,
  active,
  onClick,
  disabled = false,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`h-8 px-[14px] rounded-md text-[16px] font-semibold transition-all border ${
        active
          ? "bg-gray-100 border-gray-400 text-gray-700"
          : disabled
            ? "bg-gray-100 border-gray-200 text-gray-400 cursor-not-allowed opacity-50"
            : "bg-gray-50 border-gray-200 text-gray-500 cursor-pointer"
      }`}
    >
      {label}
    </button>
  );
}
