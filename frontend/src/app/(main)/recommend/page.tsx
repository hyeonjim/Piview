"use client";

import { useState } from "react";
import { Sparkles, Heart, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

/* ── 색상 토큰 (피그마 ThemeContext) ── */
const C = {
  primary: "#A2AA7B",
  primaryBg: "#F0F2E8",
  primaryDark: "#8A9468",
  warmBg: "#FFFAF5",
  warningBg: "#FDF6E8",
  text: "#1A1A1A",
  textMuted: "#9E9E9E",
  textSub: "#616161",
  border: "#F0F0F0",
  chip: "#F5F5F5",
};

const CATEGORIES = [
  "전체",
  "스킨/토너",
  "세럼/에센스",
  "크림",
  "클렌저",
  "선케어",
];
const SKIN_TYPES = ["건성", "지성", "복합성", "민감성"];

const DUMMY_PRODUCTS = [
  {
    id: "1",
    brand: "이니스프리",
    name: "그린티 씨드 세럼",
    category: "세럼/에센스",
    price: "32,000",
    rating: 4.8,
    reviews: 2341,
    skinType: "건성",
    ewg: 2,
    emoji: "🌿",
  },
  {
    id: "2",
    brand: "아누아",
    name: "어성초 77 토너",
    category: "스킨/토너",
    price: "24,000",
    rating: 4.7,
    reviews: 5892,
    skinType: "지성",
    ewg: 1,
    emoji: "💧",
  },
  {
    id: "3",
    brand: "코스알엑스",
    name: "달팽이 뮤신 96 에센스",
    category: "세럼/에센스",
    price: "28,000",
    rating: 4.9,
    reviews: 8123,
    skinType: "복합성",
    ewg: 1,
    emoji: "✨",
  },
  {
    id: "4",
    brand: "라운드랩",
    name: "독도 토너",
    category: "스킨/토너",
    price: "18,000",
    rating: 4.6,
    reviews: 3412,
    skinType: "민감성",
    ewg: 2,
    emoji: "💦",
  },
  {
    id: "5",
    brand: "넘버즈인",
    name: "1번 비타민C 세럼",
    category: "세럼/에센스",
    price: "38,000",
    rating: 4.7,
    reviews: 1234,
    skinType: "건성",
    ewg: 2,
    emoji: "🍋",
  },
  {
    id: "6",
    brand: "메디힐",
    name: "티트리 케어 솔루션",
    category: "크림",
    price: "22,000",
    rating: 4.5,
    reviews: 2109,
    skinType: "지성",
    ewg: 1,
    emoji: "🌱",
  },
];

function getEwgColor(ewg: number) {
  if (ewg <= 2) return { bg: "#E8F5E9", text: "#2E7D32" };
  if (ewg <= 6) return { bg: "#FFF8E1", text: "#F57F17" };
  return { bg: "#FFEBEE", text: "#C62828" };
}

export default function RecommendPage() {
  const [selectedCat, setSelectedCat] = useState("전체");
  const [selectedSkin, setSelectedSkin] = useState<string | null>(null);
  const [wishlisted, setWishlisted] = useState<Set<string>>(new Set());

  const filtered = DUMMY_PRODUCTS.filter((p) => {
    if (selectedCat !== "전체" && p.category !== selectedCat) return false;
    if (selectedSkin && p.skinType !== selectedSkin) return false;
    return true;
  });

  const toggleWish = (id: string) => {
    setWishlisted((prev) => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ backgroundColor: C.warmBg }}
    >
      {/* ── 헤더 (피그마: px-6 pt-5 pb-3, gradient warningBg→surfaceWarm) ── */}
      <div
        className="px-6 pt-5 pb-3"
        style={{
          background: `linear-gradient(135deg, ${C.warningBg} 0%, ${C.warmBg} 100%)`,
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} color={C.primary} />
              {/* 피그마: fontSize 20px fontWeight 600 */}
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: C.text,
                  margin: 0,
                }}
              >
                맞춤 추천
              </h1>
            </div>
            <p style={{ fontSize: "13px", color: C.textMuted, margin: 0 }}>
              내 피부 타입에 맞는 제품을 추천해드려요
            </p>
          </div>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: "4px",
              height: "32px",
              padding: "0 12px",
              borderRadius: "16px",
              backgroundColor: "#F5F5F5",
              color: C.textSub,
              fontSize: "12px",
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            <SlidersHorizontal size={13} /> 필터
          </button>
        </div>
      </div>

      {/* ── 피부타입 필터 (피그마: height 34px, borderRadius 17px, inactive #F5F5F5) ── */}
      <div
        className="px-5 py-3"
        style={{ borderBottom: `1px solid ${C.border}` }}
      >
        <div className="flex gap-1.5">
          {["전체", ...SKIN_TYPES].map((s) => {
            const isActive =
              s === "전체" ? selectedSkin === null : selectedSkin === s;
            return (
              <button
                key={s}
                onClick={() =>
                  setSelectedSkin(
                    s === "전체" ? null : s === selectedSkin ? null : s,
                  )
                }
                style={{
                  height: "34px",
                  padding: "0 12px",
                  borderRadius: "17px",
                  backgroundColor: isActive ? C.primary : C.chip,
                  color: isActive ? "#FFFFFF" : C.textSub,
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 카테고리 탭 (피그마: active #A2AA7B + white, inactive #F5F5F5 + #616161) ── */}
      <div className="overflow-x-auto px-5 pt-3 pb-2">
        <div className="flex gap-1.5" style={{ width: "max-content" }}>
          {CATEGORIES.map((cat) => {
            const isActive = selectedCat === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                style={{
                  height: "34px",
                  padding: "0 16px",
                  borderRadius: "17px",
                  backgroundColor: isActive ? C.primary : C.chip,
                  color: isActive ? "#FFFFFF" : C.textSub,
                  fontSize: "13px",
                  fontWeight: isActive ? 700 : 500,
                  border: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 제품 수 ── */}
      <div className="px-5 mb-2">
        <span style={{ fontSize: "13px", color: C.textMuted }}>
          총 <strong style={{ color: C.text }}>{filtered.length}</strong>개 제품
        </span>
      </div>

      {/* ── 제품 목록 (피그마 ProductCard 기반) ── */}
      <div className="px-5 flex flex-col gap-3 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span style={{ fontSize: "40px" }}>🔍</span>
            <p
              style={{
                fontSize: "14px",
                color: C.textMuted,
                marginTop: "12px",
                textAlign: "center",
              }}
            >
              해당하는 제품이 없어요.
              <br />
              필터를 바꿔보세요
            </p>
          </div>
        ) : (
          filtered.map((product) => {
            const ewgColor = getEwgColor(product.ewg);
            const isWished = wishlisted.has(product.id);
            return (
              <Link
                key={product.id}
                href={`/product/${product.id}`}
                style={{ textDecoration: "none" }}
              >
                <div
                  className="flex items-center gap-3 p-4"
                  style={{
                    borderRadius: "16px",
                    backgroundColor: "#FFFFFF",
                    border: `1px solid ${C.border}`,
                    boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  {/* 이미지 (피그마: 72×72, borderRadius 12px) */}
                  <div
                    className="flex items-center justify-center shrink-0"
                    style={{
                      width: "72px",
                      height: "72px",
                      borderRadius: "12px",
                      backgroundColor: C.primaryBg,
                    }}
                  >
                    <span style={{ fontSize: "28px" }}>{product.emoji}</span>
                  </div>

                  <div className="flex-1 min-w-0">
                    {/* 브랜드 + EWG */}
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        style={{
                          fontSize: "12px",
                          color: C.textMuted,
                          fontWeight: 500,
                        }}
                      >
                        {product.brand}
                      </span>
                      <span
                        style={{
                          fontSize: "11px",
                          padding: "1px 6px",
                          borderRadius: "4px",
                          backgroundColor: ewgColor.bg,
                          color: ewgColor.text,
                          fontWeight: 600,
                        }}
                      >
                        EWG {product.ewg}
                      </span>
                    </div>
                    {/* 제품명 (피그마: 15px fontWeight 600) */}
                    <p
                      className="truncate"
                      style={{
                        fontSize: "15px",
                        fontWeight: 600,
                        color: C.text,
                        margin: 0,
                      }}
                    >
                      {product.name}
                    </p>
                    {/* 평점 + 가격 */}
                    <div className="flex items-center gap-2 mt-1">
                      <span style={{ fontSize: "13px", color: C.textMuted }}>
                        ⭐ {product.rating}
                      </span>
                      <span style={{ fontSize: "12px", color: "#BDBDBD" }}>
                        ({product.reviews.toLocaleString()})
                      </span>
                      <span
                        style={{
                          fontSize: "13px",
                          fontWeight: 600,
                          color: C.text,
                        }}
                      >
                        {product.price}원
                      </span>
                    </div>
                  </div>

                  {/* 찜 + 루틴추가 */}
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        toggleWish(product.id);
                      }}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: isWished ? "#FFF0F0" : C.chip,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Heart
                        size={16}
                        color={isWished ? "#E57373" : "#BDBDBD"}
                        fill={isWished ? "#E57373" : "none"}
                      />
                    </button>
                    <button
                      onClick={(e) => e.preventDefault()}
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: C.primaryBg,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Plus size={16} color={C.primary} />
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
