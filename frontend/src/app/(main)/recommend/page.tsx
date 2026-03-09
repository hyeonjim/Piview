"use client";

import { useState } from "react";
import { Sparkles, Heart, Plus, SlidersHorizontal } from "lucide-react";
import Link from "next/link";

const PRIMARY = "#A2AA7B";
const PRIMARY_BG = "#F0F2E8";

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

const EWG_COLOR: Record<number, string> = {
  1: "#6B9E6B",
  2: "#6B9E6B",
  3: "#D4A84B",
  4: "#D4A84B",
  5: "#D94F3D",
};

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
      style={{ backgroundColor: "#FFFAF5" }}
    >
      {/* Header */}
      <div className="px-5 pt-14 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={18} color={PRIMARY} />
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: PRIMARY,
              letterSpacing: "1.5px",
              textTransform: "uppercase",
            }}
          >
            AI Recommend
          </span>
        </div>
        <h1
          style={{
            fontSize: "24px",
            fontWeight: 700,
            color: "#1a1a1a",
            letterSpacing: "-0.3px",
            margin: 0,
          }}
        >
          맞춤 추천
        </h1>
        <p style={{ fontSize: "14px", color: "#9E9E9E", marginTop: "4px" }}>
          내 피부 타입에 맞는 제품을 추천해드려요
        </p>
      </div>

      {/* Skin type filter */}
      <div className="px-5 mb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedSkin(null)}
            className="px-3 py-1.5 cursor-pointer transition-all"
            style={{
              borderRadius: "30px",
              fontSize: "13px",
              fontWeight: selectedSkin === null ? 700 : 400,
              backgroundColor: selectedSkin === null ? PRIMARY : "white",
              color: selectedSkin === null ? "white" : "#9E9E9E",
              border: `1px solid ${selectedSkin === null ? PRIMARY : "#E8E0D0"}`,
            }}
          >
            전체
          </button>
          {SKIN_TYPES.map((s) => (
            <button
              key={s}
              onClick={() => setSelectedSkin(s === selectedSkin ? null : s)}
              className="px-3 py-1.5 cursor-pointer transition-all"
              style={{
                borderRadius: "30px",
                fontSize: "13px",
                fontWeight: selectedSkin === s ? 700 : 400,
                backgroundColor: selectedSkin === s ? PRIMARY : "white",
                color: selectedSkin === s ? "white" : "#9E9E9E",
                border: `1px solid ${selectedSkin === s ? PRIMARY : "#E8E0D0"}`,
              }}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Category tabs */}
      <div
        className="overflow-x-auto px-5 mb-4"
        style={{ scrollbarWidth: "none" }}
      >
        <div className="flex gap-2 pb-1" style={{ width: "max-content" }}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCat(cat)}
              className="px-4 py-2 cursor-pointer transition-all whitespace-nowrap"
              style={{
                borderRadius: "12px",
                fontSize: "13px",
                fontWeight: selectedCat === cat ? 700 : 400,
                backgroundColor: selectedCat === cat ? PRIMARY_BG : "white",
                color: selectedCat === cat ? PRIMARY : "#9E9E9E",
                border: `1px solid ${selectedCat === cat ? PRIMARY : "#E8E0D0"}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product count */}
      <div className="px-5 mb-3 flex items-center justify-between">
        <span style={{ fontSize: "13px", color: "#9E9E9E" }}>
          총 <strong style={{ color: "#1a1a1a" }}>{filtered.length}</strong>개
          제품
        </span>
        <button
          className="flex items-center gap-1 bg-transparent border-none cursor-pointer"
          style={{ color: "#9E9E9E", fontSize: "13px" }}
        >
          <SlidersHorizontal size={13} /> 필터
        </button>
      </div>

      {/* Product list */}
      <div className="px-5 flex flex-col gap-3 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span style={{ fontSize: "40px" }}>🔍</span>
            <p
              style={{
                fontSize: "14px",
                color: "#9E9E9E",
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
          filtered.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.id}`}
              style={{ textDecoration: "none" }}
            >
              <div
                className="flex items-center gap-3 p-4"
                style={{
                  borderRadius: "16px",
                  backgroundColor: "white",
                  border: "1px solid #F0F0F0",
                  boxShadow: "0px 2px 8px rgba(0,0,0,0.04)",
                }}
              >
                {/* Product image placeholder */}
                <div
                  className="flex items-center justify-center shrink-0"
                  style={{
                    width: "72px",
                    height: "72px",
                    borderRadius: "12px",
                    backgroundColor: PRIMARY_BG,
                  }}
                >
                  <span style={{ fontSize: "28px" }}>{product.emoji}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      style={{
                        fontSize: "12px",
                        color: "#9E9E9E",
                        fontWeight: 500,
                      }}
                    >
                      {product.brand}
                    </span>
                    <span
                      style={{
                        fontSize: "10px",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        backgroundColor: EWG_COLOR[product.ewg] + "20",
                        color: EWG_COLOR[product.ewg],
                        fontWeight: 600,
                      }}
                    >
                      EWG {product.ewg}
                    </span>
                  </div>
                  <p
                    className="truncate"
                    style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      color: "#1a1a1a",
                      margin: 0,
                    }}
                  >
                    {product.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span style={{ fontSize: "13px", color: "#9E9E9E" }}>
                      ⭐ {product.rating}
                    </span>
                    <span style={{ fontSize: "12px", color: "#BDBDBD" }}>
                      ({product.reviews.toLocaleString()})
                    </span>
                    <span
                      style={{
                        fontSize: "13px",
                        fontWeight: 600,
                        color: "#1a1a1a",
                      }}
                    >
                      {product.price}원
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      toggleWish(product.id);
                    }}
                    className="flex items-center justify-center border-none cursor-pointer"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: wishlisted.has(product.id)
                        ? "#FFF0F0"
                        : "#F5F5F5",
                    }}
                  >
                    <Heart
                      size={16}
                      color={wishlisted.has(product.id) ? "#E57373" : "#BDBDBD"}
                      fill={wishlisted.has(product.id) ? "#E57373" : "none"}
                    />
                  </button>
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="flex items-center justify-center border-none cursor-pointer"
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "50%",
                      backgroundColor: PRIMARY_BG,
                    }}
                  >
                    <Plus size={16} color={PRIMARY} />
                  </button>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
