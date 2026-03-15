/**
 * components/common/FilterModal.tsx
 * 검색/추천 페이지 공용 필터 모달 (피부타입 / 피부기능 / 브랜드 / 가격)
 *
 * ⚠️ SearchFilterModal.tsx는 이 파일로 통합됨 — 삭제 가능
 *
 * 사용처:
 *   - app/(main)/search/page.tsx
 *   - app/(main)/recommend/page.tsx
 */
"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const RANGE_INPUT_BASE: React.CSSProperties = {
  top: 6,
  height: 20,
  appearance: "none",
  background: "transparent",
};

import React, { useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { getGroupKey, GROUP_ORDER } from "@/utils/chosung";
import {
  SKIN_FUNCTIONS,
  SKIN_TYPE_LABELS_FOR_FILTER,
} from "@/constants/categoryColors";

const PRICE_MAX = 1_000_000;

export interface FilterState {
  filterSkin: string | null;
  filterFns: Set<string>;
  filterChosung: string | null;
  filterBrands: Set<string>;
  priceRange: [number, number];
}

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
  availableBrands,
}: FilterModalProps) {
  const { filterSkin, filterFns, filterChosung, filterBrands, priceRange } =
    state;

  // 브랜드 초성 그룹핑 — chosungUtils 활용
  const grouped: Record<string, string[]> = {};
  availableBrands.forEach((brand) => {
    const groupKey = getGroupKey(brand);
    if (!grouped[groupKey]) grouped[groupKey] = [];
    grouped[groupKey].push(brand);
  });
  const groupKeys = GROUP_ORDER.filter((groupKey) => grouped[groupKey]);

  // 모달 열릴 때 body 스크롤 차단
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* 딤 */}
      <div
        className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
        onClick={onClose}
      />

      {/* 모달 */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 pointer-events-none">
        <div
          className="relative bg-white flex flex-col w-full max-w-[440px] max-h-[90vh] rounded-modal shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
            <h3 className="text-base font-bold text-text-primary m-0">필터</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-xs text-text-muted"
              >
                <RotateCcw size={13} /> 초기화
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center w-[30px] h-[30px] rounded-full bg-bg-chip border-none cursor-pointer"
              >
                <X size={16} className="text-text-hint" />
              </button>
            </div>
          </div>

          {/* 바디 */}
          <div className="overflow-y-auto flex-1 px-5 pb-2">
            {/* 피부타입 */}
            <Section title="피부타입">
              <div className="flex flex-wrap gap-2">
                {["전체", ...SKIN_TYPE_LABELS_FOR_FILTER].map((st) => {
                  const isActive =
                    st === "전체" ? !filterSkin : filterSkin === st;
                  return (
                    <Chip
                      key={st}
                      label={st}
                      active={isActive}
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
            </Section>

            <Divider />

            {/* 피부기능 */}
            <Section title="피부기능">
              <div className="flex flex-wrap gap-2">
                {SKIN_FUNCTIONS.map((functionName) => (
                  <Chip
                    key={functionName}
                    label={functionName}
                    active={filterFns.has(functionName)}
                    onClick={() => {
                      const newSet = new Set(filterFns);
                      newSet.has(functionName) ? newSet.delete(functionName) : newSet.add(functionName);
                      onChange({ filterFns: newSet });
                    }}
                  />
                ))}
              </div>
            </Section>

            <Divider />

            {/* 브랜드 초성 */}
            <Section title="브랜드">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {groupKeys.map((key) => {
                  const isActive = filterChosung === key;
                  return (
                    <button
                      key={key}
                      onClick={() =>
                        onChange({
                          filterChosung: isActive ? null : key,
                          filterBrands: new Set(),
                        })
                      }
                      className={`flex items-center justify-center w-[45px] h-[30px] rounded-[10px] cursor-pointer text-sm font-bold border ${
                        isActive
                          ? "bg-brand text-white border-transparent"
                          : "bg-bg-chip text-text-sub border-border"
                      }`}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
              {filterChosung && grouped[filterChosung] && (
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-brand/15">
                  {grouped[filterChosung].map((brand) => {
                    const isActive = filterBrands.has(brand);
                    return (
                      <button
                        key={brand}
                        onClick={() => {
                          const newSet = new Set(filterBrands);
                          newSet.has(brand) ? newSet.delete(brand) : newSet.add(brand);
                          onChange({ filterBrands: newSet });
                        }}
                        className={`h-[30px] px-3 rounded-[15px] cursor-pointer text-xs border transition-all ${
                          isActive
                            ? "bg-brand-bg text-brand border-brand-light font-semibold"
                            : "bg-bg-chip text-text-hint border-transparent font-normal"
                        }`}
                      >
                        {brand}
                      </button>
                    );
                  })}
                </div>
              )}
            </Section>

            <Divider />

            {/* 가격 슬라이더 — step 1000원 */}
            <Section
              title="가격"
              rightLabel={`${priceRange[0].toLocaleString()}원 ~ ${priceRange[1].toLocaleString()}원`}
            >
              <div className="relative h-9 pt-3.5">
                <div className="absolute top-3.5 left-0 right-0 h-1 rounded-sm bg-border" />
                <div
                  className="absolute top-3.5 h-1 rounded-sm bg-brand"
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
                    const value = Number(e.target.value);
                    onChange({
                      priceRange: [
                        priceRange[0],
                        Math.max(value, priceRange[0] + 1000),
                      ],
                    });
                  }}
                  className="absolute w-full"
                  style={{ ...RANGE_INPUT_BASE, zIndex: 4 }}
                />
                <style>{`
                  input[type="range"]::-webkit-slider-thumb {
                    -webkit-appearance:none; width:20px; height:20px; border-radius:50%;
                    background:var(--color-brand); border:3px solid #fff;
                    box-shadow:0 1px 4px rgba(0,0,0,.2); cursor:pointer;
                  }
                  input[type="range"]::-moz-range-thumb {
                    width:20px; height:20px; border-radius:50%;
                    background:var(--color-brand); border:3px solid #fff;
                    box-shadow:0 1px 4px rgba(0,0,0,.2); cursor:pointer;
                  }
                `}</style>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[11px] text-text-muted">0원</span>
                <span className="text-[11px] text-text-muted">1,000,000원</span>
              </div>
            </Section>

            <div className="h-2" />
          </div>

          {/* 적용 버튼 */}
          <div className="shrink-0 border-t border-border px-5 py-3">
            <button
              onClick={onClose}
              className="w-full h-11 rounded-[22px] bg-brand text-white text-sm font-bold border-none cursor-pointer transition-all active:scale-[0.98]"
            >
              {resultCount.toLocaleString()}개 제품 보기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── 내부 컴포넌트 ─────────────────────────────────────────────────────
function Section({
  title,
  rightLabel,
  children,
}: {
  title: string;
  rightLabel?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-text-primary m-0">{title}</p>
        {rightLabel && (
          <p className="text-xs text-text-hint m-0">{rightLabel}</p>
        )}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border mb-5" />;
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 h-[34px] px-4 rounded-[17px] cursor-pointer transition-all text-xs border ${
        active
          ? "bg-brand text-white border-transparent font-semibold"
          : "bg-bg-chip text-text-sub border-border font-normal"
      }`}
    >
      {label}
    </button>
  );
}
