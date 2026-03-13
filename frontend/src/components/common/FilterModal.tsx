"use client";

import { useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { SKIN_FUNCTIONS, SKIN_TYPE_LABELS_FOR_FILTER } from "@/constants/categoryColors";

// ── 초성 유틸 ────────────────────────────────────────────────────────
const GROUP_ORDER = ["ㄱ","ㄴ","ㄷ","ㄹ","ㅁ","ㅂ","ㅅ","ㅇ","ㅈ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ","A-Z","기타"];

function getChosung(str: string): string {
  const code = str.charCodeAt(0);
  if (code >= 0xAC00 && code <= 0xD7A3) {
    const idx = Math.floor((code - 0xAC00) / 28 / 21);
    return ["ㄱ","ㄲ","ㄴ","ㄷ","ㄸ","ㄹ","ㅁ","ㅂ","ㅃ","ㅅ","ㅆ","ㅇ","ㅈ","ㅉ","ㅊ","ㅋ","ㅌ","ㅍ","ㅎ"][idx] ?? "기타";
  }
  if ((code >= 65 && code <= 90) || (code >= 97 && code <= 122)) return "A-Z";
  return "기타";
}

export function getGroupKey(b: string) {
  const cs = getChosung(b);
  return (["ㄲ","ㄸ","ㅃ","ㅆ","ㅉ"].includes(cs) || !GROUP_ORDER.includes(cs)) ? "기타" : cs;
}

export function buildGroupedBrands(brands: string[]) {
  const grouped: Record<string, string[]> = {};
  brands.forEach((b) => {
    const k = getGroupKey(b);
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(b);
  });
  return { grouped, keys: GROUP_ORDER.filter((k) => grouped[k]) };
}

export interface FilterState {
  filterSkin:    string | null;
  filterFns:     Set<string>;
  filterChosung: string | null;
  filterBrands:  Set<string>;
  priceRange:    [number, number];
}

interface FilterModalProps {
  open:            boolean;
  onClose:         () => void;
  state:           FilterState;
  onChange:        (next: Partial<FilterState>) => void;
  onReset:         () => void;
  resultCount:     number;
  availableBrands: string[];
}

export function FilterModal({ open, onClose, state, onChange, onReset, resultCount, availableBrands }: FilterModalProps) {
  const { filterSkin, filterFns, filterChosung, filterBrands, priceRange } = state;
  const { grouped, keys } = buildGroupedBrands(availableBrands);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* 딤 배경 */}
      <div
        className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.45)] backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 py-6 pointer-events-none">
        <div
          className="bg-white flex flex-col w-full max-w-[440px] max-h-[88vh] rounded-modal shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 헤더 */}
          <div className="flex items-center justify-between shrink-0 px-5 pt-5 pb-3.5">
            <h3 className="text-base font-bold text-text-primary m-0">필터</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="flex items-center gap-1 bg-transparent border-none cursor-pointer text-xs text-text-muted px-2 py-1"
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
                  const isActive = st === "전체" ? !filterSkin : filterSkin === st;
                  return (
                    <Chip
                      key={st}
                      label={st}
                      active={isActive}
                      onClick={() => onChange({ filterSkin: st === "전체" ? null : st === filterSkin ? null : st })}
                    />
                  );
                })}
              </div>
            </Section>

            <Divider />

            {/* 피부기능 */}
            <Section title="피부기능">
              <div className="flex flex-wrap gap-2">
                {SKIN_FUNCTIONS.map((fn) => {
                  const isActive = filterFns.has(fn);
                  return (
                    <Chip
                      key={fn}
                      label={fn}
                      active={isActive}
                      onClick={() => {
                        const n = new Set(filterFns);
                        n.has(fn) ? n.delete(fn) : n.add(fn);
                        onChange({ filterFns: n });
                      }}
                    />
                  );
                })}
              </div>
            </Section>

            <Divider />

            {/* 브랜드 초성 */}
            <Section title="브랜드">
              <div className="grid grid-cols-7 gap-2 mb-2">
                {keys.map((key) => {
                  const isActive = filterChosung === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { onChange({ filterChosung: isActive ? null : key, filterBrands: new Set() }); }}
                      className={`flex items-center justify-center h-9 rounded-[10px] cursor-pointer transition-all text-[15px] font-bold border ${
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
                          const n = new Set(filterBrands);
                          n.has(brand) ? n.delete(brand) : n.add(brand);
                          onChange({ filterBrands: n });
                        }}
                        className={`shrink-0 h-[30px] px-3.5 rounded-[15px] cursor-pointer whitespace-nowrap transition-all text-xs border ${
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

            {/* 가격 슬라이더 */}
            <Section
              title="가격"
              rightLabel={`${priceRange[0].toLocaleString()}원 ~ ${priceRange[1].toLocaleString()}원`}
            >
              <div className="relative h-9 pt-3.5">
                <div className="absolute top-3.5 left-0 right-0 h-1 rounded-sm bg-border" />
                <div
                  className="absolute top-3.5 h-1 rounded-sm bg-brand"
                  style={{
                    left: `${(priceRange[0] / 1000000) * 100}%`,
                    right: `${100 - (priceRange[1] / 1000000) * 100}%`,
                  }}
                />
                <input
                  type="range" min={0} max={1000000} step={10000} value={priceRange[0]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({ priceRange: [Math.min(v, priceRange[1] - 10000), priceRange[1]] });
                  }}
                  className="absolute w-full"
                  style={{ top: 6, height: 20, appearance: "none", background: "transparent", zIndex: priceRange[0] > 500000 ? 5 : 3 }}
                />
                <input
                  type="range" min={0} max={1000000} step={10000} value={priceRange[1]}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    onChange({ priceRange: [priceRange[0], Math.max(v, priceRange[0] + 10000)] });
                  }}
                  className="absolute w-full"
                  style={{ top: 6, height: 20, appearance: "none", background: "transparent", zIndex: 4 }}
                />
                <style>{`input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:var(--color-brand);border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.25);cursor:pointer}`}</style>
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

// ── 내부 컴포넌트 ────────────────────────────────────────────────────
function Section({ title, rightLabel, children }: { title: string; rightLabel?: string; children: React.ReactNode }) {
  return (
    <div className="mb-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-bold text-text-primary m-0">{title}</p>
        {rightLabel && <p className="text-xs text-text-hint m-0">{rightLabel}</p>}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-border mb-5" />;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
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
