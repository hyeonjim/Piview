/**
 * components/features/search/SearchFilterModal.tsx
 *
 * 검색 페이지의 필터 모달 (피부타입 / 피부기능 / 브랜드 / 가격).
 * search/page.tsx 에서 분리해 독립 컴포넌트로 관리.
 */

"use client";

import { X, RotateCcw } from "lucide-react";
import { getGroupKey, GROUP_ORDER } from "@/utils/chosungUtils";

const PRICE_MAX = 1_000_000;
const FILTER_SKIN_TYPES = ["건성", "지성", "복합성", "수부지"] as const;
const FILTER_SKIN_FUNCTIONS = [
  "아토피","여드름","미백","색소침착","안티에이징","피지","블랙헤드","수분","영양","진정",
] as const;

export interface SearchFilterState {
  skinType: string | null;
  skinFunctions: Set<string>;
  brands: Set<string>;
  brandChosung: string | null;
  priceRange: [number, number];
}

interface Props {
  state: SearchFilterState;
  onChange: (next: Partial<SearchFilterState>) => void;
  availableBrands: string[];
  filteredCount: number;
  onReset: () => void;
  onClose: () => void;
}

export function SearchFilterModal({
  state, onChange, availableBrands, filteredCount, onReset, onClose,
}: Props) {
  // 브랜드 초성 그룹핑
  const grouped: Record<string, string[]> = {};
  availableBrands.forEach((b) => {
    const k = getGroupKey(b);
    if (!grouped[k]) grouped[k] = [];
    grouped[k].push(b);
  });
  const allKeys = [
    ...GROUP_ORDER.filter((k) => grouped[k]),
    ...(grouped["기타"] ? ["기타"] : []),
  ];

  const chipStyle = (isActive: boolean) => ({
    height: "30px",
    padding: "0 16px",
    borderRadius: "17px",
    backgroundColor: isActive ? "var(--color-brand)" : "#F5F5F5",
    color: isActive ? "#FFFFFF" : "#616161",
    fontSize: "13px",
    fontWeight: isActive ? 600 : 400,
    border: isActive ? "none" : "1px solid #E0E0E0",
    cursor: "pointer" as const,
    transition: "all 0.2s",
  });

  const toggleSet = (set: Set<string>, val: string): Set<string> => {
    const next = new Set(set);
    next.has(val) ? next.delete(val) : next.add(val);
    return next;
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ padding: "24px 16px" }}>
      {/* backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        onClick={onClose}
      />

      <div
        className="relative bg-white flex flex-col"
        style={{ borderRadius: "20px", width: "100%", maxWidth: "420px", maxHeight: "90vh", overflow: "hidden", zIndex: 1 }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
          <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#1A1A1A" }}>필터</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={onReset}
              className="flex items-center gap-1 bg-transparent border-none cursor-pointer"
              style={{ fontSize: "12px", color: "#9E9E9E" }}
            >
              <RotateCcw size={13} /> 초기화
            </button>
            <button
              onClick={onClose}
              className="p-1.5 cursor-pointer"
              style={{ borderRadius: "50%", backgroundColor: "#F5F5F5", border: "none" }}
            >
              <X size={16} color="#757575" />
            </button>
          </div>
        </div>

        {/* 스크롤 바디 */}
        <div className="overflow-y-auto flex-1 px-5 pb-4" style={{ scrollbarWidth: "none" }}>

          {/* 피부타입 */}
          <Section title="피부타입">
            <div className="flex flex-wrap gap-2">
              <button onClick={() => onChange({ skinType: null })} style={chipStyle(!state.skinType)}>전체</button>
              {FILTER_SKIN_TYPES.map((st) => (
                <button
                  key={st}
                  onClick={() => onChange({ skinType: state.skinType === st ? null : st })}
                  style={chipStyle(state.skinType === st)}
                >
                  {st}
                </button>
              ))}
            </div>
          </Section>

          <Divider />

          {/* 피부기능 */}
          <Section title="피부기능">
            <div className="flex flex-wrap gap-2">
              {FILTER_SKIN_FUNCTIONS.map((fn) => (
                <button
                  key={fn}
                  onClick={() => onChange({ skinFunctions: toggleSet(state.skinFunctions, fn) })}
                  style={chipStyle(state.skinFunctions.has(fn))}
                >
                  {fn}
                </button>
              ))}
            </div>
          </Section>

          <Divider />

          {/* 브랜드 */}
          <Section title="브랜드">
            <div className="flex flex-wrap gap-1.5 mb-2">
              {allKeys.map((key) => {
                const isActive = state.brandChosung === key;
                return (
                  <button
                    key={key}
                    onClick={() => onChange({ brandChosung: isActive ? null : key })}
                    className="flex items-center justify-center cursor-pointer"
                    style={{
                      width: "45px", height: "30px", borderRadius: "10px",
                      backgroundColor: isActive ? "var(--color-brand)" : "#F5F5F5",
                      color: isActive ? "#FFFFFF" : "#616161",
                      fontSize: "14px", fontWeight: 700,
                      border: isActive ? "none" : "1px solid #E0E0E0",
                    }}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
            {state.brandChosung && grouped[state.brandChosung] && (
              <div className="flex flex-wrap gap-1.5 pt-2 pb-1" style={{ borderTop: "1px solid #A2AA7B20" }}>
                {grouped[state.brandChosung].map((brand) => {
                  const isActive = state.brands.has(brand);
                  return (
                    <button
                      key={brand}
                      onClick={() => onChange({ brands: toggleSet(state.brands, brand) })}
                      style={{
                        height: "30px", padding: "0 12px", borderRadius: "15px",
                        backgroundColor: isActive ? "var(--color-brand)" : "#F5F5F5",
                        color: isActive ? "#FFFFFF" : "#757575",
                        fontSize: "12px", fontWeight: isActive ? 600 : 400,
                        border: "none", cursor: "pointer",
                      }}
                    >
                      {brand}
                    </button>
                  );
                })}
              </div>
            )}
          </Section>

          <Divider />

          {/* 가격 */}
          <Section title="가격" subtitle={`${state.priceRange[0].toLocaleString()}원 ~ ${state.priceRange[1].toLocaleString()}원`}>
            <div className="relative" style={{ height: "36px", paddingTop: "14px" }}>
              <div style={{ position: "absolute", top: "14px", left: 0, right: 0, height: "4px", borderRadius: "2px", backgroundColor: "#E0E0E0" }} />
              <div style={{
                position: "absolute", top: "14px", height: "4px", borderRadius: "2px",
                backgroundColor: "var(--color-brand)",
                left: `${(state.priceRange[0] / PRICE_MAX) * 100}%`,
                right: `${100 - (state.priceRange[1] / PRICE_MAX) * 100}%`,
              }} />
              <input
                type="range" min={0} max={PRICE_MAX} step={1000} value={state.priceRange[0]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onChange({ priceRange: [Math.min(v, state.priceRange[1] - 1000), state.priceRange[1]] });
                }}
                className="absolute w-full"
                style={{ top: "6px", height: "20px", appearance: "none", background: "transparent", zIndex: state.priceRange[0] > PRICE_MAX * 0.5 ? 5 : 3 }}
              />
              <input
                type="range" min={0} max={PRICE_MAX} step={1000} value={state.priceRange[1]}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  onChange({ priceRange: [state.priceRange[0], Math.max(v, state.priceRange[0] + 1000)] });
                }}
                className="absolute w-full"
                style={{ top: "6px", height: "20px", appearance: "none", background: "transparent", zIndex: 4 }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span style={{ fontSize: "11px", color: "#9E9E9E" }}>0원</span>
              <span style={{ fontSize: "11px", color: "#9E9E9E" }}>1,000,000원</span>
            </div>
          </Section>
        </div>

        {/* 하단 적용 버튼 */}
        <div className="shrink-0 px-5 py-3" style={{ borderTop: "1px solid #F0F0F0" }}>
          <button
            onClick={onClose}
            className="w-full cursor-pointer transition-all active:scale-[0.98]"
            style={{ height: "43px", borderRadius: "14px", backgroundColor: "var(--color-brand)", color: "#FFFFFF", fontSize: "15px", fontWeight: 700, border: "none" }}
          >
            {filteredCount}개 제품 보기
          </button>
        </div>
      </div>

      <style>{`
        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none; width: 20px; height: 20px; border-radius: 50%;
          background: var(--color-brand); border: 3px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2); cursor: pointer;
        }
        input[type="range"]::-moz-range-thumb {
          width: 20px; height: 20px; border-radius: 50%;
          background: var(--color-brand); border: 3px solid #FFFFFF;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2); cursor: pointer;
        }
      `}</style>
    </div>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-2.5">
        <p style={{ fontSize: "13px", fontWeight: 600, color: "#1A1A1A" }}>{title}</p>
        {subtitle && <p style={{ fontSize: "12px", color: "#757575" }}>{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid #F0F0F0", marginBottom: "16px" }} />;
}
