"use client";

import { useState } from "react";
import { Sparkles, Heart, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { PRODUCT_CATEGORIES, SKIN_TYPE_LABELS } from "@/constants";
import { getEwgStyle } from "@/constants";
import { MOCK_PRODUCTS } from "@/constants/_mock/products";

export default function RecommendPage() {
  const [selectedCat,  setSelectedCat]  = useState("전체");
  const [selectedSkin, setSelectedSkin] = useState<string | null>(null);
  const [wishlisted,   setWishlisted]   = useState<Set<string>>(new Set());

  const filtered = MOCK_PRODUCTS.filter((p) => {
    if (selectedCat !== "전체" && p.category !== selectedCat) return false;
    if (selectedSkin && p.skinType !== selectedSkin) return false;
    return true;
  });

  const toggleWish = (id: string) => {
    setWishlisted((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="flex flex-col min-h-full bg-warm-bg">

      {/* 헤더 */}
      <div className="px-6 pt-5 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-brand" />
              <h1 className="text-text-primary font-semibold" style={{ fontSize: "20px", margin: 0 }}>맞춤 추천</h1>
            </div>
            <p className="text-text-muted" style={{ fontSize: "13px", margin: 0 }}>내 피부 타입에 맞는 제품을 추천해드려요</p>
          </div>
          <button className="flex items-center gap-1 bg-bg-chip text-text-sub font-semibold border-none cursor-pointer"
            style={{ height: "32px", padding: "0 12px", borderRadius: "16px", fontSize: "12px" }}>
            <SlidersHorizontal size={13} /> 필터
          </button>
        </div>
      </div>

      {/* 피부타입 필터 */}
      <div className="px-5 py-3 border-b border-border">
        <div className="flex gap-1.5">
          {["전체", ...SKIN_TYPE_LABELS].map((s) => {
            const isActive = s === "전체" ? selectedSkin === null : selectedSkin === s;
            return (
              <button key={s}
                onClick={() => setSelectedSkin(s === "전체" ? null : s === selectedSkin ? null : s)}
                className="cursor-pointer border-none transition-all"
                style={{ height: "34px", padding: "0 12px", borderRadius: "17px",
                  backgroundColor: isActive ? "var(--color-brand)" : "var(--color-bg-chip)",
                  color: isActive ? "#FFFFFF" : "var(--color-text-sub)",
                  fontSize: "13px", fontWeight: isActive ? 700 : 500 }}>
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* 카테고리 탭 */}
      <div className="overflow-x-auto px-5 pt-3 pb-2">
        <div className="flex gap-1.5" style={{ width: "max-content" }}>
          {PRODUCT_CATEGORIES.map((cat) => {
            const isActive = selectedCat === cat;
            return (
              <button key={cat} onClick={() => setSelectedCat(cat)}
                className="cursor-pointer border-none transition-all whitespace-nowrap"
                style={{ height: "34px", padding: "0 16px", borderRadius: "17px",
                  backgroundColor: isActive ? "var(--color-brand)" : "var(--color-bg-chip)",
                  color: isActive ? "#FFFFFF" : "var(--color-text-sub)",
                  fontSize: "13px", fontWeight: isActive ? 700 : 500 }}>
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* 제품 수 */}
      <div className="px-5 mb-2">
        <span className="text-text-muted" style={{ fontSize: "13px" }}>
          총 <strong className="text-text-primary">{filtered.length}</strong>개 제품
        </span>
      </div>

      {/* 제품 목록 */}
      <div className="px-5 flex flex-col gap-3 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span style={{ fontSize: "40px" }}>🔍</span>
            <p className="text-text-muted text-center mt-3" style={{ fontSize: "14px" }}>
              해당하는 제품이 없어요.<br />필터를 바꿔보세요
            </p>
          </div>
        ) : (
          filtered.map((product) => {
            const ewg = getEwgStyle(product.ewg);
            const isWished = wishlisted.has(product.id);
            return (
              <Link key={product.id} href={`/product/${product.id}`} style={{ textDecoration: "none" }}>
                <div className="flex items-center gap-3 p-4 bg-white border border-border"
                  style={{ borderRadius: "16px", boxShadow: "0px 2px 8px rgba(0,0,0,0.04)" }}>
                  <div className="flex items-center justify-center shrink-0 bg-brand-bg"
                    style={{ width: "72px", height: "72px", borderRadius: "12px" }}>
                    <span style={{ fontSize: "28px" }}>{product.emoji}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-text-muted font-medium" style={{ fontSize: "12px" }}>{product.brand}</span>
                      <span className="font-semibold"
                        style={{ fontSize: "11px", padding: "1px 6px", borderRadius: "4px", backgroundColor: ewg.bg, color: ewg.text }}>
                        EWG {product.ewg}
                      </span>
                    </div>
                    <p className="truncate text-text-primary font-semibold" style={{ fontSize: "15px", margin: 0 }}>{product.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-text-muted" style={{ fontSize: "13px" }}>⭐ {product.rating}</span>
                      <span className="text-text-disabled" style={{ fontSize: "12px" }}>({product.reviews.toLocaleString()})</span>
                      <span className="text-text-primary font-semibold" style={{ fontSize: "13px" }}>{product.price}원</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button onClick={(e) => { e.preventDefault(); toggleWish(product.id); }}
                      className="flex items-center justify-center border-none cursor-pointer"
                      style={{ width: "36px", height: "36px", borderRadius: "50%",
                        backgroundColor: isWished ? "#FFF0F0" : "var(--color-bg-chip)" }}>
                      <Heart size={16} color={isWished ? "#E57373" : "var(--color-text-disabled)"} fill={isWished ? "#E57373" : "none"} />
                    </button>
                    <button onClick={(e) => e.preventDefault()}
                      className="flex items-center justify-center border-none cursor-pointer bg-brand-bg"
                      style={{ width: "36px", height: "36px", borderRadius: "50%" }}>
                      <Plus size={16} className="text-brand" />
                    </button>
                  </div>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
