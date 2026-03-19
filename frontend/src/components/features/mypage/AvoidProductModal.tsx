"use client";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const AVOID_SECTION_HEADER_ICON = { color: "var(--color-danger)" };
const AVOID_MINUS_BTN_STYLE = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  border: "none",
  backgroundColor: "var(--color-bg-like)",
  color: "var(--color-danger)",
  cursor: "pointer",
};
const PRODUCT_CODE_BADGE = {
  width: "40px",
  height: "40px",
  borderRadius: "8px",
  backgroundColor: "var(--color-bg-muted-warm)",
  fontSize: "10px",
  fontWeight: 700,
};

import { useMemo } from "react";
import { X, Search, ShieldAlert, Minus, Plus } from "lucide-react";
import { CATEGORY_COLORS } from "@/constants/categoryColors";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/searchProducts";
import type { OwnedProduct } from "@/stores/useOwnedStore";

interface AvoidProductModalProps {
  avoidProducts: OwnedProduct[];
  avoidSearch: string;
  onSearchChange: (value: string) => void;
  onClose: () => void;
  onToggle: (product: OwnedProduct) => void;
}

export default function AvoidProductModal({
  avoidProducts,
  avoidSearch,
  onSearchChange,
  onClose,
  onToggle,
}: AvoidProductModalProps) {
  const searchResults = useMemo(
    () =>
      avoidSearch
        ? MOCK_SEARCH_PRODUCTS.filter(
            (product) =>
              product.name.toLowerCase().includes(avoidSearch.toLowerCase()) ||
              product.brand.toLowerCase().includes(avoidSearch.toLowerCase()),
          )
        : MOCK_SEARCH_PRODUCTS.slice(0, 8),
    [avoidSearch],
  );

  return (
    <>
      <div
        className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
        onClick={onClose}
      />
      <div className="fixed inset-0 z-[70] flex items-end justify-center pointer-events-none pb-0">
        <div className="bg-white pointer-events-auto rounded-t-[20px] w-full max-w-[430px] max-h-[80vh] flex flex-col shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
          {/* 헤더 */}
          <div className="flex items-center justify-between px-5 pt-5 pb-3">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} style={AVOID_SECTION_HEADER_ICON} />
              <h3 className="text-base font-bold text-text-primary">
                피해야 할 제품 추가
              </h3>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-7 h-7 rounded-full bg-[var(--color-bg-muted-warm)] border-none cursor-pointer"
            >
              <X size={14} color="#888" />
            </button>
          </div>

          {/* 검색바 */}
          <div className="relative px-5 pb-3">
            <Search
              size={16}
              color="var(--color-text-stone)"
              className="absolute left-8 top-1/2 -translate-y-1/2 pointer-events-none"
            />
            <input
              type="text"
              value={avoidSearch}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="제품명 또는 브랜드 검색"
              className="w-full h-10 pl-9 pr-9 rounded-xl border border-border-warm bg-[#FAF8F5] text-sm text-text-primary outline-none"
            />
            {avoidSearch && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-border-warm border-none cursor-pointer"
              >
                <X size={12} color="#888" />
              </button>
            )}
          </div>

          {/* 검색 결과 */}
          <div className="overflow-y-auto flex-1 px-5 pb-6 flex flex-col gap-2">
            {searchResults.map((product) => {
              const isAdded = avoidProducts.some((p) => p.id === product.id);
              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 bg-white rounded-[12px] border border-border"
                >
                  <div
                    className="shrink-0 flex items-center justify-center text-text-muted"
                    style={PRODUCT_CODE_BADGE}
                  >
                    {product.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-text-muted">{product.brand}</p>
                    <p className="text-sm font-semibold text-text-primary truncate">
                      {product.name}
                    </p>
                    {CATEGORY_COLORS[product.category] && (
                      <span
                        className="inline-block text-[10px] px-1.5 py-[1px] rounded-[4px] font-bold mt-0.5"
                        style={{
                          backgroundColor:
                            CATEGORY_COLORS[product.category].chip,
                          color: CATEGORY_COLORS[product.category].accent,
                        }}
                      >
                        {product.category}
                      </span>
                    )}
                  </div>
                  {/* 추가/제거 토글 버튼 */}
                  <button
                    onClick={() => onToggle(product)}
                    className="shrink-0 flex items-center justify-center"
                    style={{
                      ...AVOID_MINUS_BTN_STYLE,
                      backgroundColor: isAdded ? "#FEF2F2" : "#F5F3EE",
                      color: isAdded
                        ? "var(--color-danger)"
                        : "var(--color-text-muted)",
                    }}
                  >
                    {isAdded ? <Minus size={13} /> : <Plus size={13} />}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
