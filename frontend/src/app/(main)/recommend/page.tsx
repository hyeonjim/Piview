"use client";

import { useState, useMemo } from "react";
import {
  Sparkles,
  Heart,
  Plus,
  Check,
  Package,
  GitCompareArrows,
  SlidersHorizontal,
  Search,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Link from "next/link";
import {
  CATEGORY_COLORS,
  SKIN_FUNCTION_COLORS,
  SKIN_TYPE_TAG_COLORS,
} from "@/constants/categoryColors";
import {
  COLOR_BRAND,
  COLOR_BRAND_BG,
  COLOR_BRAND_LIGHT,
  COLOR_TEXT_MUTED,
} from "@/constants/colors";
import { MAIN_CATEGORIES, BRANDS } from "@/constants/productCategories";
import { DEFAULT_FILTER } from "@/constants/filterDefaults";
import { FilterModal, FilterState } from "@/components/common/FilterModal";
import {
  MOCK_RECOMMEND,
  type RecommendProduct,
} from "@/constants/_mock/recommend";

const P = COLOR_BRAND,
  PBG = COLOR_BRAND_BG,
  PLT = COLOR_BRAND_LIGHT,
  MUTED = COLOR_TEXT_MUTED;

export default function RecommendPage() {
  const [selectedMain, setSelectedMain] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const PAGE_SIZE = 10;
  const [selectedSub, setSelectedSub] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>(DEFAULT_FILTER);

  const [inRoutine, setInRoutine] = useState<Set<string>>(new Set());
  const [wished, setWished] = useState<Set<string>>(new Set());
  const [owned, setOwned] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState("");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  };
  const addRoutine = (id: string, name: string) => {
    setInRoutine((p) => new Set([...p, id]));
    showToast(`✓ ${name} 루틴에 추가됨!`);
  };
  const toggleWish = (id: string) =>
    setWished((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleOwned = (id: string) =>
    setOwned((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const filterCount =
    (filter.filterSkin ? 1 : 0) +
    (filter.filterFns.size > 0 ? 1 : 0) +
    (filter.filterBrands.size > 0 ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < 1000000 ? 1 : 0);

  const filtered = useMemo(() => {
    let list = MOCK_RECOMMEND;
    if (selectedSub) list = list.filter((p) => p.category === selectedSub);
    else if (selectedMain)
      list = list.filter((p) =>
        (MAIN_CATEGORIES[selectedMain] ?? []).includes(p.category),
      );
    if (filter.filterSkin)
      list = list.filter((p) => p.skinTypes.includes(filter.filterSkin!));
    if (filter.filterFns.size > 0)
      list = list.filter((p) =>
        [...filter.filterFns].some((f) => p.effects.includes(f)),
      );
    if (filter.filterBrands.size > 0)
      list = list.filter((p) => filter.filterBrands.has(p.brand));
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q),
      );
    }
    return [...list].sort((a, b) => b.matchScore - a.matchScore);
  }, [selectedMain, selectedSub, filter, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div
      className="flex flex-col min-h-full"
      style={{ backgroundColor: "#FFFAF5" }}
    >
      {toast && (
        <div
          className="fixed top-16 left-1/2 z-[60] -translate-x-1/2 pointer-events-none"
          style={{
            padding: "10px 18px",
            borderRadius: 40,
            backgroundColor: "rgba(40,40,40,0.88)",
            color: "white",
            fontSize: "13px",
            fontWeight: 600,
            boxShadow: "0 4px 20px rgba(0,0,0,0.25)",
            backdropFilter: "blur(8px)",
            whiteSpace: "nowrap",
          }}
        >
          {toast}
        </div>
      )}

      {/* 헤더 */}
      <div
        className="px-6 pt-5 pb-3"
        style={{
          background: "linear-gradient(135deg, #FFF8EE 0%, #F5F2EA 100%)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} color={P} />
              <h1
                style={{
                  fontSize: "20px",
                  fontWeight: 600,
                  color: "#1A1A1A",
                  margin: 0,
                }}
              >
                맞춤 추천
              </h1>
            </div>
            <p style={{ fontSize: "13px", color: "#757575", margin: 0 }}>
              루틴에 없는 카테고리 위주로 추천해드려요
            </p>
          </div>
          <button
            onClick={() => setShowFilter(true)}
            className="relative flex items-center justify-center border-none cursor-pointer"
            style={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              backgroundColor: filterCount > 0 ? P : "#F0EDE8",
            }}
          >
            <SlidersHorizontal
              size={17}
              color={filterCount > 0 ? "#fff" : "#616161"}
            />
            {filterCount > 0 && (
              <span
                className="absolute flex items-center justify-center"
                style={{
                  top: -2,
                  right: -2,
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  backgroundColor: "#FF5252",
                  color: "#fff",
                  fontSize: "9px",
                  fontWeight: 700,
                  border: "2px solid #fff",
                }}
              >
                {filterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* 검색바 */}
      <div className="px-6 pt-3 pb-2">
        <div className="relative">
          <Search
            size={16}
            color="#9E9E9E"
            className="absolute left-3.5 top-1/2 -translate-y-1/2"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="제품명, 브랜드 검색..."
            className="w-full outline-none"
            style={{
              height: 42,
              paddingLeft: 36,
              paddingRight: search ? 36 : 16,
              borderRadius: 12,
              backgroundColor: "#F5F5F5",
              border: "none",
              fontSize: "13px",
              color: "#1A1A1A",
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-transparent border-none cursor-pointer"
            >
              <X size={14} color="#9E9E9E" />
            </button>
          )}
        </div>
      </div>

      {/* 대분류 */}
      <div className="px-6 pb-2">
        <div className="flex flex-wrap gap-2 mb-2">
          {Object.keys(MAIN_CATEGORIES).map((main) => {
            const isActive = selectedMain === main;
            return (
              <button
                key={main}
                onClick={() => {
                  setSelectedMain(isActive ? null : main);
                  setSelectedSub(null);
                }}
                className="shrink-0 cursor-pointer border-none transition-all"
                style={{
                  height: 32,
                  padding: "0 12px",
                  borderRadius: 16,
                  backgroundColor: isActive ? P : "#F5F5F5",
                  color: isActive ? "#fff" : "#616161",
                  fontSize: "13px",
                  fontWeight: isActive ? 600 : 500,
                }}
              >
                {main}
              </button>
            );
          })}
        </div>
        {selectedMain && (
          <div className="flex flex-wrap gap-1.5 pb-1">
            {MAIN_CATEGORIES[selectedMain].map((sub) => {
              const isActive = selectedSub === sub;
              const catC = CATEGORY_COLORS[sub];
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSub(isActive ? null : sub)}
                  className="shrink-0 cursor-pointer transition-all"
                  style={{
                    height: 28,
                    padding: "0 13px",
                    borderRadius: 14,
                    backgroundColor: isActive
                      ? "#6B7A54"
                      : catC
                        ? catC.chip
                        : "#ECEADE",
                    color: isActive ? "#fff" : catC ? catC.accent : "#616161",
                    fontSize: "13px",
                    fontWeight: isActive ? 600 : 500,
                    border: `1px solid ${isActive ? "transparent" : P + "22"}`,
                  }}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 제품 카드 */}
      <div className="px-6 flex flex-col gap-2.5 pb-28">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-16">
            <span style={{ fontSize: "40px" }}>🔍</span>
            <p
              className="text-center mt-3"
              style={{ fontSize: "13px", color: "#9E9E9E" }}
            >
              해당하는 제품이 없어요.
              <br />
              필터를 바꿔보세요
            </p>
          </div>
        ) : (
          paginated.map((product) => {
            const isInRoute = inRoutine.has(product.id);
            const isWished = wished.has(product.id);
            const isOwn = owned.has(product.id);
            const catC = CATEGORY_COLORS[product.category];
            return (
              <div
                key={product.id}
                className="p-4"
                style={{
                  borderRadius: 16,
                  backgroundColor: "white",
                  border: "1px solid #E8E0D0",
                }}
              >
                <Link
                  href={`/product/${product.id}`}
                  style={{ textDecoration: "none" }}
                >
                  <div className="flex items-center gap-3 cursor-pointer">
                    <div
                      className="flex items-center justify-center shrink-0"
                      style={{
                        width: 100,
                        height: 100,
                        borderRadius: 12,
                        backgroundColor: "#F8F6F0",
                        fontSize: "38px",
                      }}
                    >
                      {product.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span
                          style={{
                            fontSize: "13px",
                            color: MUTED,
                            fontWeight: 500,
                          }}
                        >
                          {product.brand}
                        </span>
                        {catC && (
                          <span
                            style={{
                              fontSize: "13px",
                              padding: "1px 7px",
                              borderRadius: 4,
                              backgroundColor: catC.chip,
                              color: catC.accent,
                              fontWeight: 500,
                            }}
                          >
                            {product.category}
                          </span>
                        )}
                        <span
                          style={{
                            fontSize: "13px",
                            padding: "1px 7px",
                            borderRadius: 4,
                            backgroundColor: PBG,
                            color: P,
                            fontWeight: 600,
                          }}
                        >
                          추천
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: "16px",
                          fontWeight: 600,
                          color: "#2A2A2A",
                          margin: 0,
                          marginTop: 2,
                          lineHeight: 1.3,
                        }}
                      >
                        {product.name}
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {product.skinTypes.map((st) => {
                          const c = SKIN_TYPE_TAG_COLORS[st] ?? {
                            bg: "#F0EDE8",
                            text: "#7A7060",
                          };
                          return (
                            <span
                              key={st}
                              style={{
                                fontSize: "13px",
                                padding: "1px 7px",
                                borderRadius: 4,
                                backgroundColor: c.bg,
                                color: c.text,
                                fontWeight: 600,
                                letterSpacing: "0.2px",
                              }}
                            >
                              {st}
                            </span>
                          );
                        })}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {product.effects.slice(0, 4).map((fn) => {
                          const fc = SKIN_FUNCTION_COLORS[fn];
                          return fc ? (
                            <span
                              key={fn}
                              style={{
                                fontSize: "13px",
                                padding: "1px 7px",
                                borderRadius: 4,
                                backgroundColor: fc.chip,
                                color: fc.accent,
                                fontWeight: 500,
                              }}
                            >
                              {fn}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col items-center shrink-0">
                      <span
                        style={{ fontSize: "16px", fontWeight: 700, color: P }}
                      >
                        {product.matchScore}
                      </span>
                      <span
                        style={{
                          fontSize: "15px",
                          color: MUTED,
                          letterSpacing: "0.5px",
                          textTransform: "uppercase" as const,
                        }}
                      >
                        score
                      </span>
                    </div>
                  </div>
                </Link>
                <p
                  style={{
                    fontSize: "15px",
                    color: P,
                    marginTop: 8,
                    lineHeight: 1.55,
                    wordBreak: "keep-all",
                  }}
                >
                  {product.reason}
                </p>
                <div className="flex gap-1.5 mt-2.5 flex-wrap">
                  <button
                    onClick={() =>
                      !isInRoute && addRoutine(product.id, product.name)
                    }
                    className="flex items-center justify-center gap-1 flex-1 cursor-pointer transition-all active:scale-[0.97] border-none"
                    style={{
                      height: 32,
                      borderRadius: 40,
                      minWidth: 80,
                      backgroundColor: isInRoute ? PBG : P,
                      color: isInRoute ? P : "#fff",
                      fontSize: "15px",
                      fontWeight: 700,
                    }}
                  >
                    {isInRoute ? (
                      <>
                        <Check size={11} /> 루틴추가됨
                      </>
                    ) : (
                      <>
                        <Plus size={11} /> 루틴추가
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => toggleOwned(product.id)}
                    className="flex items-center justify-center gap-1 cursor-pointer transition-all active:scale-[0.97]"
                    style={{
                      height: 32,
                      padding: "0 10px",
                      borderRadius: 40,
                      border: isOwn ? `1px solid ${PLT}` : "1px solid #E8E0D0",
                      backgroundColor: isOwn ? PBG : "white",
                      color: isOwn ? P : MUTED,
                      fontSize: "15px",
                      fontWeight: 600,
                    }}
                  >
                    <Package size={11} /> {isOwn ? "보유 중" : "보유추가"}
                  </button>
                  <button
                    onClick={() => toggleWish(product.id)}
                    className="flex items-center justify-center cursor-pointer transition-all active:scale-[0.97]"
                    style={{
                      height: 32,
                      padding: "0 10px",
                      borderRadius: 40,
                      border: isWished
                        ? "1px solid #FFCDD2"
                        : "1px solid #E8E0D0",
                      backgroundColor: isWished ? "#FFF0F3" : "white",
                    }}
                  >
                    <Heart
                      size={16}
                      color={isWished ? "#E57373" : MUTED}
                      fill={isWished ? "#E57373" : "none"}
                    />
                  </button>
                  <button
                    className="flex items-center justify-center cursor-pointer transition-all active:scale-[0.97]"
                    style={{
                      height: 32,
                      padding: "0 10px",
                      borderRadius: 40,
                      border: "1px solid #E8E0D0",
                      backgroundColor: "white",
                    }}
                  >
                    <GitCompareArrows size={16} color={MUTED} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 py-4 pb-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center justify-center cursor-pointer border-none transition-all active:scale-[0.92] disabled:opacity-30 disabled:cursor-default"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#F5F5F5",
            }}
          >
            <ChevronLeft size={16} color="#616161" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              onClick={() => setPage(n)}
              className="flex items-center justify-center cursor-pointer border-none transition-all"
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: page === n ? "#A2AA7B" : "#F5F5F5",
                color: page === n ? "#fff" : "#616161",
                fontSize: "13px",
                fontWeight: page === n ? 700 : 400,
              }}
            >
              {n}
            </button>
          ))}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex items-center justify-center cursor-pointer border-none transition-all active:scale-[0.92] disabled:opacity-30 disabled:cursor-default"
            style={{
              width: 32,
              height: 32,
              borderRadius: "50%",
              backgroundColor: "#F5F5F5",
            }}
          >
            <ChevronRight size={16} color="#616161" />
          </button>
        </div>
      )}

      <FilterModal
        open={showFilter}
        onClose={() => setShowFilter(false)}
        state={filter}
        onChange={(next) => setFilter((prev) => ({ ...prev, ...next }))}
        onReset={() => setFilter(DEFAULT_FILTER)}
        resultCount={filtered.length}
        availableBrands={BRANDS}
      />
    </div>
  );
}
