/**
 * components/common/FilterModal.tsx
 * 검색/추천 페이지 공용 필터 모달
 *
 * - 내부 draft 상태로 관리 → "N개 제품 보기" 버튼 눌러야 onChange 호출 (API 1회)
 * - 듀얼 레인지 슬라이더: 마우스/터치 다운 시 어느 thumb에 가까운지 판별해서 이동
 */
"use client";

import React, { useEffect, useState, useRef } from "react";
import { X, RotateCcw } from "lucide-react";
import { SKIN_TYPE_LABELS_FOR_FILTER } from "@/constants/categoryColors";
import type { FilterState } from "@/types/common";
import { PRICE_MAX, FILTER_INITIAL_STATE } from "@/types/common";
import { useProductFilters } from "@/hooks";

export type { FilterState };
export { FILTER_INITIAL_STATE } from "@/types/common";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  state: FilterState;
  onChange: (next: FilterState) => void;
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
  // ── 내부 draft — 버튼 누를 때까지 API 호출 안 함 ──────────────
  const [draft, setDraft] = useState<FilterState>(state);

  // 모달 열릴 때마다 현재 적용된 state로 draft 동기화
  useEffect(() => {
    if (open) setDraft(state);
  }, [open]);

  const { data: filterMeta } = useProductFilters();
  const tags = filterMeta?.tags ?? [];

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  // ── 듀얼 레인지 슬라이더 ───────────────────────────────────────
  const trackRef = useRef<HTMLDivElement>(null);
  const dragging = useRef<"min" | "max" | null>(null);

  const getValueFromPosition = (clientX: number): number => {
    const track = trackRef.current;
    if (!track) return 0;
    const { left, width } = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - left) / width));
    return Math.round((ratio * PRICE_MAX) / 1000) * 1000;
  };

  const handleTrackPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const value = getValueFromPosition(e.clientX);
    const [min, max] = draft.priceRange;
    // 클릭 지점이 min/max 중 어느 쪽에 가까운지 판별
    const distToMin = Math.abs(value - min);
    const distToMax = Math.abs(value - max);
    dragging.current = distToMin <= distToMax ? "min" : "max";
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const handleTrackPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    const value = getValueFromPosition(e.clientX);
    setDraft((prev) => {
      const [min, max] = prev.priceRange;
      if (dragging.current === "min") {
        return { ...prev, priceRange: [Math.min(value, max - 1000), max] };
      } else {
        return { ...prev, priceRange: [min, Math.max(value, min + 1000)] };
      }
    });
  };

  const handleTrackPointerUp = () => {
    dragging.current = null;
  };

  // ── 적용 ──────────────────────────────────────────────────────
  const handleApply = () => {
    onChange(draft);
    onClose();
  };

  const handleReset = () => {
    setDraft(FILTER_INITIAL_STATE);
    onReset();
    onClose();
  };

  if (!open) return null;

  const { filterSkin, tagIds, priceRange } = draft;
  const minPct = (priceRange[0] / PRICE_MAX) * 100;
  const maxPct = (priceRange[1] / PRICE_MAX) * 100;

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
                onClick={handleReset}
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
                        setDraft((prev) => ({
                          ...prev,
                          filterSkin:
                            skinType === "전체"
                              ? null
                              : prev.filterSkin === skinType
                                ? null
                                : skinType,
                        }))
                      }
                    />
                  );
                })}
              </div>
            </FilterSection>

            <div className="h-px bg-gray-100" />

            {/* 피부고민 태그 */}
            <FilterSection
              title="피부고민"
              rightLabel={
                Object.values(tagIds).filter(Boolean).length > 0
                  ? `${Object.values(tagIds).filter(Boolean).length}/4`
                  : undefined
              }
            >
              <div className="flex flex-wrap gap-2">
                {tags.map((t) => {
                  const isActive = tagIds[t.tagId] === true;
                  const activeCount =
                    Object.values(tagIds).filter(Boolean).length;
                  const isDisabled = !isActive && activeCount >= 4;
                  return (
                    <FilterChip
                      key={t.tagId}
                      label={t.tag}
                      active={isActive}
                      disabled={isDisabled}
                      onClick={() => {
                        if (isDisabled) return;
                        setDraft((prev) => ({
                          ...prev,
                          tagIds: {
                            ...prev.tagIds,
                            [t.tagId]: !prev.tagIds[t.tagId],
                          },
                        }));
                      }}
                    />
                  );
                })}
              </div>
            </FilterSection>

            <div className="h-px bg-gray-100" />

            {/* 가격 슬라이더 */}
            <FilterSection
              title="가격"
              rightLabel={
                priceRange[0] === 0 && priceRange[1] === PRICE_MAX
                  ? "전체"
                  : `${priceRange[0] === 0 ? "0원" : priceRange[0].toLocaleString() + "원"} ~ ${priceRange[1] === PRICE_MAX ? "제한없음" : priceRange[1].toLocaleString() + "원"}`
              }
            >
              {/* 커스텀 듀얼 슬라이더 — pointer 이벤트로 min/max 판별 */}
              <div
                ref={trackRef}
                className="relative h-9 pt-[14px] cursor-pointer select-none"
                onPointerDown={handleTrackPointerDown}
                onPointerMove={handleTrackPointerMove}
                onPointerUp={handleTrackPointerUp}
                onPointerLeave={handleTrackPointerUp}
              >
                {/* 배경 트랙 */}
                <div className="absolute top-[14px] left-0 right-0 h-0.5 rounded-[1px] bg-gray-200" />
                {/* 선택 구간 */}
                <div
                  className="absolute top-[14px] h-0.5 rounded-[1px] bg-gray-900 pointer-events-none"
                  style={{ left: `${minPct}%`, right: `${100 - maxPct}%` }}
                />
                {/* min thumb */}
                <div
                  className="absolute top-[5px] w-[18px] h-[18px] rounded-full bg-gray-800 border-2 border-white shadow-[0_1px_6px_rgba(0,0,0,.2)] pointer-events-none"
                  style={{ left: `calc(${minPct}% - 9px)` }}
                />
                {/* max thumb */}
                <div
                  className="absolute top-[5px] w-[18px] h-[18px] rounded-full bg-gray-800 border-2 border-white shadow-[0_1px_6px_rgba(0,0,0,.2)] pointer-events-none"
                  style={{ left: `calc(${maxPct}% - 9px)` }}
                />
              </div>
              <div className="flex items-center justify-between mt-1">
                <span className="text-[14px] text-gray-500">0원</span>
                <span className="text-[14px] text-gray-500">1,000,000원+</span>
              </div>
            </FilterSection>

            <div className="h-2" />
          </div>

          {/* 적용 버튼 — 여기서만 onChange 호출 → API 1회 */}
          <div className="px-5 pt-3 pb-6 border-t border-gray-100">
            <button
              onClick={handleApply}
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
