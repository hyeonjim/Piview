"use client";

import { useState, useMemo } from "react";
import { MOCK_SEARCH_PRODUCTS } from "@/constants/_mock/searchProducts";
import { MAIN_CATEGORIES, BRANDS } from "@/constants/productCategories";
import { DEFAULT_FILTER } from "@/constants/filterDefaults";
import { FilterModal } from "@/components/common/FilterModal";
import { FilterState } from "@/components/common/FilterModal";
import { CategoryFilter } from "@/components/common/CategoryFilter";
import ProductCard from "@/components/common/ProductCard";
import { Pagination } from "@/components/common/Pagination";
import { Toast } from "@/components/common/Toast";
import EmptyState from "@/components/common/EmptyState";
import SearchBar from "@/components/common/SearchBar";
import { useToast } from "@/hooks";
import { useLike } from "@/hooks/useLike";
import { SlidersHorizontal, Search, X } from "lucide-react";

// 2열 그리드: 페이지당 12개 (짝수)
const PAGE_SIZE = 12;

// matchScore 보완 — ⚠️ API 연동 시 서버 계산값으로 교체
const PRODUCTS = MOCK_SEARCH_PRODUCTS.map((product, index) => ({
  ...product,
  matchScore: product.matchScore ?? 78 + (index % 18),
}));

export default function SearchPage() {
  // 초기값: 스킨케어 대분류 + 스킨/토너 소분류 고정
  const [selectedMain, setSelectedMain] = useState<string | null>("스킨케어");
  const [selectedSub, setSelectedSub]   = useState<string | null>("스킨/토너");
  const [searchQuery, setSearchQuery]   = useState("");
  const [page, setPage]                 = useState(1);
  const [showFilter, setShowFilter]     = useState(false);
  const [filter, setFilter]             = useState<FilterState>(DEFAULT_FILTER);

  const { toggleLike, isLiked } = useLike();
  const { toastMessage, showToast } = useToast();

  const filterCount =
    (filter.filterSkin ? 1 : 0) +
    (filter.filterFns.size > 0 ? 1 : 0) +
    (filter.filterBrands.size > 0 ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < 1000000 ? 1 : 0);

  const filtered = useMemo(() => {
    let list = PRODUCTS;
    if (searchQuery.trim()) {
      const keyword = searchQuery.toLowerCase();
      list = list.filter(
        (p) => p.name.toLowerCase().includes(keyword) || p.brand.toLowerCase().includes(keyword),
      );
    }
    if (selectedSub) {
      list = list.filter((p) => p.category === selectedSub);
    } else if (selectedMain) {
      list = list.filter((p) =>
        (MAIN_CATEGORIES[selectedMain] ?? []).includes(p.category),
      );
    }
    if (filter.filterSkin)     list = list.filter((p) => p.skinTypes.includes(filter.filterSkin!));
    if (filter.filterFns.size > 0) list = list.filter((p) => [...filter.filterFns].some((e) => p.effects.includes(e)));
    if (filter.filterBrands.size > 0) list = list.filter((p) => filter.filterBrands.has(p.brand));
    return list;
  }, [selectedMain, selectedSub, searchQuery, filter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated  = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleSearchChange = (value: string) => { setSearchQuery(value); setPage(1); };
  const handleMainSelect = (main: string | null) => { setSelectedMain(main); setPage(1); };
  const handleSubSelect  = (sub: string | null)  => { setSelectedSub(sub);   setPage(1); };

  return (
    <div style={{ minHeight: "100%", backgroundColor: "#FAFAF8" }}>
      <Toast msg={toastMessage} />

      {/* ── 상단 헤더 ────────────────────────────────────── */}
      <div style={{ backgroundColor: "#FFFFFF", borderBottom: "1px solid #EDEBE8", paddingTop: "56px" }}>
        {/* 타이틀 행 */}
        <div className="flex items-end justify-between" style={{ padding: "16px 16px 12px" }}>
          <div>
            {/* 영문 에디토리얼 서브타이틀 */}
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 400,
                color: "#B0A99F",
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                fontFamily: "var(--font-cormorant), serif",
                fontStyle: "italic",
              }}
            >
              Skincare Collection
            </p>
            {/* 한국어 타이틀 */}
            <h1
              style={{
                margin: "3px 0 0",
                fontSize: "22px",
                fontWeight: 700,
                color: "#1C1C1E",
                letterSpacing: "-0.4px",
                lineHeight: 1.2,
                fontFamily: "var(--font-pretendard), sans-serif",
              }}
            >
              전체 제품
            </h1>
            {filtered.length > 0 && (
              <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#B0A99F", fontFamily: "var(--font-pretendard), sans-serif" }}>
                {filtered.length.toLocaleString()}개
              </p>
            )}
          </div>

          {/* 필터 버튼 */}
          <button
            onClick={() => setShowFilter(true)}
            className="flex items-center gap-1.5 cursor-pointer border transition-all active:scale-[0.96]"
            style={{
              height: "34px",
              padding: "0 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 500,
              fontFamily: "var(--font-pretendard), sans-serif",
              borderColor: filterCount > 0 ? "#1C1C1E" : "#E8E4DF",
              backgroundColor: filterCount > 0 ? "#1C1C1E" : "#FFFFFF",
              color: filterCount > 0 ? "#FFFFFF" : "#8A8278",
            }}
          >
            <SlidersHorizontal size={13} />
            필터
            {filterCount > 0 && (
              <span style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.25)",
                fontSize: "10px",
                fontWeight: 700,
              }}>
                {filterCount}
              </span>
            )}
          </button>
        </div>

        {/* 검색바 */}
        <div style={{ padding: "0 16px 12px" }}>
          <SearchBar value={searchQuery} onChange={handleSearchChange} placeholder="제품명, 브랜드 검색..." />
        </div>
      </div>

      {/* 카테고리 필터 */}
      <CategoryFilter
        selectedMain={selectedMain}
        selectedSub={selectedSub}
        onMainSelect={handleMainSelect}
        onSubSelect={handleSubSelect}
      />

      {/* ── 제품 그리드 ─────────────────────────────────── */}
      <div style={{ padding: "16px 14px 24px" }}>
        {filtered.length === 0 ? (
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #EDEBE8", marginTop: "8px" }}>
            <EmptyState icon={Search} title="해당하는 제품이 없어요" description="검색어나 필터를 바꿔보세요" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
            {paginated.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                brand={product.brand}
                name={product.name}
                category={product.category}
                emoji={product.emoji}
                skinTypes={product.skinTypes}
                effects={product.effects}
                liked={isLiked(product.id)}
                onLike={() => toggleLike(product.id)}
                layout="grid"
              />
            ))}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={setPage} />

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
