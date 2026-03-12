"use client";

/**
 * FilterModal.tsx
 * search / recommend 공통 필터 모달
 * - 모달 열릴 때 body 스크롤 차단
 * - 피그마 기준 UI (pill chip, 7열 초성 그리드, 가격 슬라이더)
 */

import { useEffect } from "react";
import { X, RotateCcw } from "lucide-react";
import { SKIN_FUNCTIONS, SKIN_TYPE_LABELS_FOR_FILTER } from "@/constants/categoryColors";

const P = "#A2AA7B", PBG = "#F0F2E8", PLT = "#C5CBA8";

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

// ── Props ────────────────────────────────────────────────────────────
export interface FilterState {
  filterSkin:    string | null;
  filterFns:     Set<string>;
  filterChosung: string | null;
  filterBrands:  Set<string>;
  priceRange:    [number, number];
}

interface FilterModalProps {
  open:           boolean;
  onClose:        () => void;
  state:          FilterState;
  onChange:       (next: Partial<FilterState>) => void;
  onReset:        () => void;
  resultCount:    number;
  availableBrands: string[];
}

export function FilterModal({ open, onClose, state, onChange, onReset, resultCount, availableBrands }: FilterModalProps) {
  const { filterSkin, filterFns, filterChosung, filterBrands, priceRange } = state;
  const { grouped, keys } = buildGroupedBrands(availableBrands);

  // body 스크롤 차단
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* 딤 배경 — BottomNav(z-50) 위로 */}
      <div
        className="fixed inset-0 z-[60]"
        style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(3px)" }}
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className="fixed inset-0 z-[70] flex items-center justify-center" style={{ padding: "24px 16px", pointerEvents: "none" }}>
        <div
          className="bg-white flex flex-col"
          style={{
            pointerEvents: "auto",
            borderRadius: 20,
            width: "100%",
            maxWidth: 440,
            maxHeight: "88vh",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 모달 헤더 */}
          <div className="flex items-center justify-between shrink-0" style={{ padding: "20px 20px 14px" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>필터</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={onReset}
                className="flex items-center gap-1 bg-transparent border-none cursor-pointer"
                style={{ fontSize: 13, color: "#9E9E9E", padding: "4px 8px" }}
              >
                <RotateCcw size={13} /> 초기화
              </button>
              <button
                onClick={onClose}
                className="flex items-center justify-center border-none cursor-pointer"
                style={{ width: 30, height: 30, borderRadius: "50%", backgroundColor: "#F5F5F5" }}
              >
                <X size={16} color="#757575" />
              </button>
            </div>
          </div>

          {/* 모달 바디 — 스크롤 */}
          <div className="overflow-y-auto flex-1" style={{ padding: "0 20px 8px", scrollbarWidth: "none" }}>

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
              <div className="grid gap-2 mb-2" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
                {keys.map((key) => {
                  const isActive = filterChosung === key;
                  return (
                    <button
                      key={key}
                      onClick={() => { onChange({ filterChosung: isActive ? null : key, filterBrands: new Set() }); }}
                      className="flex items-center justify-center cursor-pointer transition-all"
                      style={{
                        height: 36, borderRadius: 10,
                        backgroundColor: isActive ? P : "#F5F5F5",
                        color: isActive ? "#fff" : "#616161",
                        fontSize: 15, fontWeight: 700,
                        border: isActive ? "none" : "1px solid #E0E0E0",
                      }}
                    >
                      {key}
                    </button>
                  );
                })}
              </div>
              {filterChosung && grouped[filterChosung] && (
                <div className="flex flex-wrap gap-1.5 pt-2" style={{ borderTop: `1px solid ${P}25` }}>
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
                        className="shrink-0 cursor-pointer whitespace-nowrap transition-all"
                        style={{
                          height: 30, padding: "0 14px", borderRadius: 15,
                          backgroundColor: isActive ? PBG : "#F5F5F5",
                          color: isActive ? P : "#757575",
                          fontSize: 13, fontWeight: isActive ? 600 : 400,
                          border: isActive ? `1px solid ${PLT}` : "none",
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

            {/* 가격 슬라이더 */}
            <Section title="가격" rightLabel={`${priceRange[0].toLocaleString()}원 ~ ${priceRange[1].toLocaleString()}원`}>
              <div className="relative" style={{ height: 36, paddingTop: 14 }}>
                <div className="absolute" style={{ top: 14, left: 0, right: 0, height: 4, borderRadius: 2, backgroundColor: "#E0E0E0" }} />
                <div className="absolute" style={{ top: 14, height: 4, borderRadius: 2, backgroundColor: P, left: `${(priceRange[0] / 1000000) * 100}%`, right: `${100 - (priceRange[1] / 1000000) * 100}%` }} />
                <input type="range" min={0} max={1000000} step={10000} value={priceRange[0]}
                  onChange={(e) => { const v = Number(e.target.value); onChange({ priceRange: [Math.min(v, priceRange[1] - 10000), priceRange[1]] }); }}
                  className="absolute w-full"
                  style={{ top: 6, height: 20, appearance: "none", background: "transparent", zIndex: priceRange[0] > 500000 ? 5 : 3 }} />
                <input type="range" min={0} max={1000000} step={10000} value={priceRange[1]}
                  onChange={(e) => { const v = Number(e.target.value); onChange({ priceRange: [priceRange[0], Math.max(v, priceRange[0] + 10000)] }); }}
                  className="absolute w-full"
                  style={{ top: 6, height: 20, appearance: "none", background: "transparent", zIndex: 4 }} />
                <style>{`input[type="range"]::-webkit-slider-thumb{-webkit-appearance:none;width:22px;height:22px;border-radius:50%;background:${P};border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.25);cursor:pointer}`}</style>
              </div>
              <div className="flex items-center justify-between mt-1">
                <span style={{ fontSize: 11, color: "#9E9E9E" }}>0원</span>
                <span style={{ fontSize: 11, color: "#9E9E9E" }}>1,000,000원</span>
              </div>
            </Section>

            {/* 하단 여백 */}
            <div style={{ height: 8 }} />
          </div>

          {/* 적용 버튼 */}
          <div className="shrink-0" style={{ borderTop: "1px solid #F0F0F0", padding: "12px 20px" }}>
            <button
              onClick={onClose}
              className="w-full cursor-pointer border-none transition-all active:scale-[0.98]"
              style={{ height: 44, borderRadius: 22, backgroundColor: P, color: "#fff", fontSize: 14, fontWeight: 700 }}
            >
              {resultCount.toLocaleString()}개 제품 보기
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

// ── 내부 공통 컴포넌트 ───────────────────────────────────────────────
function Section({ title, rightLabel, children }: { title: string; rightLabel?: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: "#1A1A1A", margin: 0 }}>{title}</p>
        {rightLabel && <p style={{ fontSize: 12, color: "#757575", margin: 0 }}>{rightLabel}</p>}
      </div>
      {children}
    </div>
  );
}

function Divider() {
  return <div style={{ borderTop: "1px solid #F0F0F0", marginBottom: 20 }} />;
}

function Chip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 cursor-pointer transition-all"
      style={{
        height: 34, padding: "0 16px", borderRadius: 17,
        backgroundColor: active ? P : "#F5F5F5",
        color: active ? "#fff" : "#616161",
        fontSize: 13, fontWeight: active ? 600 : 400,
        border: active ? "none" : "1px solid #E0E0E0",
      }}
    >
      {label}
    </button>
  );
}
