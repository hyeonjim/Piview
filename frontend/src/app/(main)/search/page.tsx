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
import CompareModal, { type CompareProduct } from "@/components/common/CompareModal";
import { useToast } from "@/hooks";
import { useCompare } from "@/hooks/useCompare";
import { useOwnedStore } from "@/stores/useOwnedStore";
import { SlidersHorizontal, Search, Scale } from "lucide-react";

// 2열 그리드: 페이지당 12개 (짝수)
const PAGE_SIZE = 12;

// matchScore 보완 — ⚠️ API 연동 시 서버 계산값으로 교체
const PRODUCTS = MOCK_SEARCH_PRODUCTS.map((product, index) => ({
  ...product,
  matchScore: product.matchScore ?? 78 + (index % 18),
}));

export default function SearchPage() {
  const [selectedMain, setSelectedMain] = useState<string | null>("스킨케어");
  const [selectedSub, setSelectedSub]   = useState<string | null>("스킨/토너");
  const [searchQuery, setSearchQuery]   = useState("");
  const [page, setPage]                 = useState(1);
  const [showFilter, setShowFilter]     = useState(false);
  const [filter, setFilter]             = useState<FilterState>(DEFAULT_FILTER);
  // 제품별 루틴추가 상태 — ⚠️ API 연동 시 서버 상태로 교체
  const [routineMap, setRoutineMap]     = useState<Record<string, boolean>>({});
  // 보유 상태 — 전역 store로 마이페이지와 공유
  const { toggleOwned, isOwned } = useOwnedStore();

  const { toastMessage } = useToast();

  // 기존 useCompare 훅 사용 — 비교 선택/모달 상태를 페이지 단위로 관리
  const {
    compareItems,
    showCompare,
    toggleCompare,
    clearCompare,
    openCompare,
    closeCompare,
    canCompare,
  } = useCompare<CompareProduct>();

  const filterCount =
    (filter.filterSkin ? 1 : 0) +
    (filter.filterFns.size > 0 ? 1 : 0) +
    (filter.filterBrands.size > 0 ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < 1000000 ? 1 : 0);

  const filteredProducts = useMemo(() => {
    let list = PRODUCTS;
    if (searchQuery.trim()) {
      const keyword = searchQuery.toLowerCase();
      list = list.filter(
        (product) =>
          product.name.toLowerCase().includes(keyword) ||
          product.brand.toLowerCase().includes(keyword),
      );
    }
    if (selectedSub) {
      list = list.filter((product) => product.category === selectedSub);
    } else if (selectedMain) {
      list = list.filter((product) =>
        (MAIN_CATEGORIES[selectedMain] ?? []).includes(product.category),
      );
    }
    if (filter.filterSkin) {
      list = list.filter((product) => product.skinTypes.includes(filter.filterSkin!));
    }
    if (filter.filterFns.size > 0) {
      list = list.filter((product) =>
        [...filter.filterFns].some((effectName) => product.effects.includes(effectName)),
      );
    }
    if (filter.filterBrands.size > 0) {
      list = list.filter((product) => filter.filterBrands.has(product.brand));
    }
    return list;
  }, [selectedMain, selectedSub, searchQuery, filter]);

  const totalPages = Math.ceil(filteredProducts.length / PAGE_SIZE);
  const paginatedProducts = filteredProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  const handleSearchChange = (value: string) => { setSearchQuery(value); setPage(1); };
  const handleMainSelect   = (main: string | null) => { setSelectedMain(main); setPage(1); };
  const handleSubSelect    = (sub: string | null)  => { setSelectedSub(sub);   setPage(1); };

  const handleAddRoutine = (productId: string) => {
    setRoutineMap((prev) => ({ ...prev, [productId]: true }));
  };


  /** 비교 토글 — 2개 선택 완료 시 모달 자동 오픈 */
  const handleToggleCompare = (product: CompareProduct) => {
    const isAlreadySelected = compareItems.some((item) => item.id === product.id);
    toggleCompare(product);
    // 추가로 2개가 되는 시점에 모달 오픈
    if (!isAlreadySelected && compareItems.length === 1) {
      openCompare();
    }
  };

  return (
    <div className="flex-1" style={{ backgroundColor: "#F5F2EC" }}>
      <Toast msg={toastMessage} />

      {/* 비교 모달 — 2개 선택 완료 후 표시 */}
      {showCompare && canCompare && (
        <CompareModal
          compareItems={compareItems as [CompareProduct, CompareProduct]}
          onClose={closeCompare}
        />
      )}

      {/* ── 상단 헤더 ────────────────────────────────────── */}
      <div style={{ backgroundColor: "#F5F2EC", borderBottom: "1px solid #E2DDD8", paddingTop: "5px" }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <h1
            style={{
              margin: "3px 0 12px",
              fontSize: "22px",
              fontWeight: 700,
              color: "#2A2118",
              letterSpacing: "-0.4px",
              lineHeight: 1.2,
            }}
          >
            전체 제품
          </h1>

          {/* 검색바 + 필터 버튼 한 줄 */}
          <div className="flex items-center gap-5">
            <div className="flex-1">
              <SearchBar
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="제품명, 브랜드 검색..."
              />
            </div>

            {/* 필터 버튼 — 검색바 오른쪽 끝 */}
            <button
              onClick={() => setShowFilter(true)}
              className="flex items-center gap-1.5 cursor-pointer border transition-all active:scale-[0.96] shrink-0"
              style={{
                height: "38px",
                padding: "0 12px",
                borderRadius: "10px",
                fontSize: "14px",
                fontWeight: 500,
                borderColor: filterCount > 0 ? "#A69D92" : "#E2DDD8",
                backgroundColor: filterCount > 0 ? "#A69D92" : "#FFFFFF",
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
        </div>
      </div>

      {/* 카테고리 필터 */}
      <CategoryFilter
        selectedMain={selectedMain}
        selectedSub={selectedSub}
        onMainSelect={handleMainSelect}
        onSubSelect={handleSubSelect}
      />

      {/* ── 비교 선택 힌트 바 — 1개 선택 시 표시 ──────────── */}
      {compareItems.length === 1 && (
        <div
          className="flex items-center justify-between mx-4 mt-3 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: "#F2EFE9", border: "1px solid #D9D5D0" }}
        >
          <div className="flex items-center gap-2">
            <Scale size={13} style={{ color: "#8A8278" }} />
            <span style={{ fontSize: "12px", color: "#6B6258", fontWeight: 500 }}>
              비교할 제품을 1개 더 선택하세요
            </span>
          </div>
          <button
            onClick={clearCompare}
            style={{
              fontSize: "11px",
              color: "#A69D92",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            취소
          </button>
        </div>
      )}

      {/* 2개 선택 완료 시 비교하기 버튼 바 */}
      {canCompare && (
        <div
          className="flex items-center justify-between mx-4 mt-3 px-3 py-2.5 rounded-xl"
          style={{ backgroundColor: "#3D3028" }}
        >
          <div className="flex items-center gap-2">
            <Scale size={13} style={{ color: "#F2EFE9" }} />
            <span style={{ fontSize: "12px", color: "#F2EFE9", fontWeight: 500 }}>
              2개 제품 선택 완료
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={clearCompare}
              style={{
                fontSize: "11px",
                color: "#BFB6AA",
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
            >
              취소
            </button>
            <button
              onClick={openCompare}
              style={{
                fontSize: "12px",
                fontWeight: 700,
                color: "#3D3028",
                backgroundColor: "#F2EFE9",
                border: "none",
                borderRadius: "6px",
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              비교하기
            </button>
          </div>
        </div>
      )}

      {/* ── 제품 그리드 ─────────────────────────────────── */}
      <div style={{ padding: "16px 20px 24px" }}>
        {filteredProducts.length === 0 ? (
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2DDD8", marginTop: "8px" }}>
            <EmptyState
              icon={Search}
              title="해당하는 제품이 없어요"
              description="검색어나 필터를 바꿔보세요"
            />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
            {paginatedProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                brand={product.brand}
                name={product.name}
                category={product.category}
                emoji={product.emoji}
                skinTypes={product.skinTypes}
                effects={product.effects}
                layout="grid"
                showActions={true}
                inRoutine={routineMap[product.id] ?? false}
                onAddRoutine={() => handleAddRoutine(product.id)}
                isOwned={isOwned(product.id)}
                onToggleOwned={() => toggleOwned(product)}
                isInCompare={compareItems.some((item) => item.id === product.id)}
                onToggleCompare={() =>
                  handleToggleCompare({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    emoji: product.emoji,
                    price: product.price,
                    skinTypes: product.skinTypes,
                    effects: product.effects,
                    ewgSafe: product.ewgSafe,
                    ewgCaution: product.ewgCaution,
                    ewgDanger: product.ewgDanger,
                  })
                }
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
        resultCount={filteredProducts.length}
        availableBrands={BRANDS}
      />
    </div>
  );
}
