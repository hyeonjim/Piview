"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const SEARCH_INPUT_PADDING_CLEAR = 36;
const SEARCH_INPUT_PADDING_DEFAULT = 12;
const MODAL_CATEGORY_CHIP_BASE = {
  height: "32px",
  padding: "0 14px",
  borderRadius: "20px",
  fontSize: "13px",
  cursor: "pointer",
  border: "none",
  whiteSpace: "nowrap" as const,
};
const MODAL_ACTION_ICON_BTN = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  border: "1px solid var(--color-border-warm)",
  backgroundColor: "white",
  cursor: "pointer",
};
// 스텝별 카테고리 필터 칩 — SR(세럼/에센스), LT(로션/에멀전)는 카테고리 단일이라 칩 없음
const STEP_CATEGORY_CHIPS: Record<string, string[]> = {
  CL: ["폼", "오일", "밤", "젤", "워터", "로션"],
  PR: ["토너", "미스트", "패드"],
  SR: [],
  LT: [],
  CR: ["크림", "오일", "아이크림"],
  SC: ["스틱", "스프레이"],
};

import { useState, useMemo } from "react";
import { X, Search, Package, Heart, GitCompare } from "lucide-react";
import {
  SKIN_FUNCTION_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";
import { MYPAGE_ROUTINE_STEPS, ROUTINE_STEPS } from "@/constants/routineSteps";
import { STEP_PRODUCTS } from "@/constants/_mock/mypageProducts";
import type { LocalProduct } from "@/stores/useLocalRoutineStore";

interface RoutineAddModalProps {
  openStep: string;
  routine: Record<string, LocalProduct | null>;
  onClose: () => void;
  onAdd: (product: LocalProduct) => void;
}

export default function RoutineAddModal({
  openStep,
  routine,
  onClose,
  onAdd,
}: RoutineAddModalProps) {
  const [addSearch, setAddSearch] = useState("");
  const [isPiview, setIsPiview] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const currentLabel =
    MYPAGE_ROUTINE_STEPS.find((step) => step.code === openStep)?.label ?? "";

  // 스텝에 해당하는 카테고리 제품 필터링
  const modalProducts = useMemo(() => {
    const cats =
      ROUTINE_STEPS.find((step) => step.code === openStep)?.categories ?? [];
    return STEP_PRODUCTS.filter((product) =>
      cats.some(
        (category) =>
          product.category === category || product.category.includes(category),
      ),
    );
  }, [openStep]);

  // 선택된 카테고리 칩으로 필터링
  const categoryFilteredProducts = useMemo(() => {
    if (!selectedCategory) return modalProducts;
    return modalProducts.filter((product) =>
      product.category.includes(selectedCategory),
    );
  }, [modalProducts, selectedCategory]);

  // 검색 + 피뷰추천 필터 적용
  const displayProducts = useMemo(() => {
    let list = categoryFilteredProducts;
    if (addSearch) {
      const keyword = addSearch.toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(keyword) ||
          product.brand.toLowerCase().includes(keyword),
      );
    }
    const sorted = [...list].sort((a, b) => b.matchScore - a.matchScore);
    return isPiview ? sorted.slice(0, 5) : sorted;
  }, [categoryFilteredProducts, addSearch, isPiview]);

  return (
    <>
      {/* 배경 오버레이 */}
      <div
        className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none py-10 px-5">
        <div className="bg-white flex flex-col pointer-events-auto rounded-[20px] w-full max-w-[420px] max-h-full shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden">
          <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
            {/* 헤더 */}
            <div className="flex items-center justify-between mt-[15px]">
              <h3 className="text-base font-bold text-text-primary">
                {currentLabel} 선택
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPiview((prev) => !prev)}
                  className={`flex items-center gap-1 cursor-pointer transition-all active:scale-95 px-3 py-[5px] rounded-[20px] text-xs font-semibold ${
                    isPiview
                      ? "bg-brand text-white border-none"
                      : "bg-white text-brand border border-brand"
                  }`}
                >
                  ☆ 피뷰추천
                </button>
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-bg-muted-warm)] border-none cursor-pointer"
                >
                  <X size={14} color="#888" />
                </button>
              </div>
            </div>

            {/* 검색바 */}
            <div className="relative mt-3 mb-3">
              <Search
                size={16}
                color="var(--color-text-stone)"
                className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
              />
              <input
                type="text"
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="제품명 또는 브랜드 검색"
                className="w-full h-10 pl-9 pr-3 rounded-xl border border-border-warm bg-[#FAF8F5] text-xs text-[#2A2A2A] outline-none"
                style={{
                  paddingRight: addSearch
                    ? SEARCH_INPUT_PADDING_CLEAR
                    : SEARCH_INPUT_PADDING_DEFAULT,
                }}
              />
              {addSearch && (
                <button
                  onClick={() => setAddSearch("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-border-warm border-none cursor-pointer"
                >
                  <X size={12} color="#888" />
                </button>
              )}
            </div>

            {/* 카테고리 필터 칩 — SR/LT는 칩 없음 */}
            {STEP_CATEGORY_CHIPS[openStep]?.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 mb-3 scrollbar-hide">
                {STEP_CATEGORY_CHIPS[openStep].map((chip) => (
                  <button
                    key={chip}
                    onClick={() =>
                      setSelectedCategory((prev) =>
                        prev === chip ? null : chip,
                      )
                    }
                    style={{
                      ...MODAL_CATEGORY_CHIP_BASE,
                      backgroundColor:
                        selectedCategory === chip
                          ? "var(--color-brand)"
                          : "var(--color-chip-base)",
                      color:
                        selectedCategory === chip
                          ? "white"
                          : "var(--color-text-secondary)",
                      fontWeight: selectedCategory === chip ? 600 : 400,
                    }}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            )}

            {/* 제품 목록 */}
            {displayProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-stone)]">
                <Package size={32} className="mb-2 opacity-50" />
                <p className="text-xs">해당 카테고리에 제품이 없습니다</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {displayProducts.map((product) => {
                  const isAdded =
                    !!routine[openStep] && routine[openStep]?.id === product.id;
                  return (
                    <div
                      key={product.id}
                      className="rounded-[14px] p-4 border"
                      style={{
                        borderColor: isAdded
                          ? "var(--color-brand-light)"
                          : "var(--color-border-warm)",
                        backgroundColor: isAdded
                          ? "var(--color-brand-bg)"
                          : "white",
                      }}
                    >
                      {/* 제품 정보 행 */}
                      <div className="flex gap-3">
                        {/* 이미지/코드 배지 */}
                        <div
                          className="shrink-0 flex items-center justify-center rounded-xl text-xs font-bold text-text-muted"
                          style={{ width: 72, height: 72 }}
                        >
                          {product.emoji ?? product.category.slice(0, 2)}
                        </div>
                        {/* 텍스트 */}
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-text-muted mb-0.5">
                            {product.brand}
                          </p>
                          <p className="text-sm font-semibold text-text-primary leading-snug">
                            {product.name}
                          </p>
                          {/* 피부타입 칩 */}
                          {product.skinTypes.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1.5">
                              {product.skinTypes.map((skinType) => {
                                const tc = SKIN_TYPE_TAG_COLORS[skinType];
                                return tc ? (
                                  <span
                                    key={skinType}
                                    className="text-[11px] px-2 py-[2px] rounded-[4px] font-semibold"
                                    style={{
                                      backgroundColor: tc.bg,
                                      color: tc.text,
                                    }}
                                  >
                                    {skinType}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                          {/* 기능 칩 */}
                          {product.effects.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {product.effects.slice(0, 3).map((fn) => {
                                const fc = SKIN_FUNCTION_COLORS[fn];
                                return fc ? (
                                  <span
                                    key={fn}
                                    className="text-[11px] px-2 py-[2px] rounded-[4px] font-medium"
                                    style={{
                                      backgroundColor: fc.chip,
                                      color: fc.accent,
                                    }}
                                  >
                                    {fn}
                                  </span>
                                ) : null;
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 추천 이유 텍스트 */}
                      {/* ⚠️ API 연동 시 product.reason으로 교체 */}
                      <p className="text-xs text-text-muted mt-3 leading-relaxed">
                        복합성 피부에도 사용 가능하며, 특정 고민 해결에 도움을
                        줄 수 있는 제품이에요.
                      </p>

                      {/* 액션 버튼 행 */}
                      <div className="flex items-center gap-2 mt-3">
                        {/* 루틴추가 */}
                        <button
                          onClick={() => onAdd(product)}
                          disabled={isAdded}
                          className="flex items-center justify-center gap-1 flex-1 h-9 rounded-[40px] border-none cursor-pointer transition-all text-sm font-bold"
                          style={{
                            backgroundColor: isAdded
                              ? "var(--color-brand-bg)"
                              : "var(--color-brand)",
                            color: isAdded ? "var(--color-brand)" : "white",
                          }}
                        >
                          + {isAdded ? "추가됨" : "루틴추가"}
                        </button>
                        {/* 보유추가 */}
                        <button className="flex items-center gap-1 h-9 px-3 rounded-[40px] border border-border text-xs text-text-secondary cursor-pointer bg-white">
                          {/* ⚠️ API 연동 시 보유추가 기능 연결 */}
                          🧴 보유추가
                        </button>
                        {/* 찜 */}
                        <button
                          className="flex items-center justify-center cursor-pointer"
                          style={MODAL_ACTION_ICON_BTN}
                        >
                          {/* ⚠️ API 연동 시 찜 기능 연결 */}
                          <Heart size={15} className="text-text-muted" />
                        </button>
                        {/* 비교 */}
                        <button
                          className="flex items-center justify-center cursor-pointer"
                          style={MODAL_ACTION_ICON_BTN}
                        >
                          {/* ⚠️ API 연동 시 비교 기능 연결 */}
                          <GitCompare size={15} className="text-text-muted" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
