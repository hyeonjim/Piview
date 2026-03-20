"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, Scale } from "lucide-react";
import { BRANDS } from "@/constants/productCategories";
import { PAGE_SIZE } from "@/constants/pagination";
import { FilterModal, FilterState, FILTER_INITIAL_STATE } from "@/components/common/FilterModal";
import { CategoryFilter } from "@/components/common/CategoryFilter";
import ProductCard from "@/components/common/ProductCard";
import { Pagination } from "@/components/common/Pagination";
import EmptyState from "@/components/common/EmptyState";
import SearchBar from "@/components/common/SearchBar";
import CompareModal, { type CompareProduct } from "@/components/common/CompareModal";
import { useCompare, useProductSearch } from "@/hooks";
import { useOwnedStore } from "@/stores/useOwnedStore";
import { useRoutineStore } from "@/stores";
import { ROUTINE_STEPS } from "@/constants/routineSteps";

import { toSkinTypeParam } from "@/utils/enumConvert";
import { PRICE_MAX } from "@/types/common";
import type { SkinType } from "@/types/user";

export default function RecommendPage() {
  const [selectedMain, setSelectedMain] = useState<string | null>("스킨케어");
  const [selectedSub, setSelectedSub] = useState<string | null>("스킨/토너");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showFilter, setShowFilter] = useState(false);
  const [filter, setFilter] = useState<FilterState>(FILTER_INITIAL_STATE);

  // ── API 연동 ───────────────────────────────────────────────────
  const { products, hasNext, isLoading, isError } = useProductSearch({
    q: searchQuery.trim() || undefined,
    skinType: filter.filterSkin
      ? toSkinTypeParam(filter.filterSkin as SkinType)
      : undefined,
    minPrice: filter.priceRange[0] > 0 ? filter.priceRange[0] : undefined,
    maxPrice: filter.priceRange[1] < PRICE_MAX ? filter.priceRange[1] : undefined,
    page: page - 1,
    size: PAGE_SIZE,
    // ⚠️ 추천 페이지 전용 파라미터 (skinType 기반 서버 추천)
    //    → 백엔드 추천 API 별도 엔드포인트 확정 후 분리 예정
  });

  // 루틴 상태
  const routineMap = useRoutineStore((state) => state.localRoutine);
  const addStepProduct = useRoutineStore((state) => state.addStepProduct);
  const isInRoutine = (productId: number) =>
    Object.values(routineMap).flat().filter(Boolean).some((p) => p.id === String(productId));

  // 보유 상태
  const { toggleOwned, ownedProducts } = useOwnedStore();
  const isOwned = (id: number) => ownedProducts.some((p) => p.id === String(id));

  const { compareItems, showCompare, toggleCompare, clearCompare, openCompare, closeCompare, canCompare } =
    useCompare<CompareProduct>();

  const filterCount =
    (filter.filterSkin ? 1 : 0) +
    (filter.filterFns.size > 0 ? 1 : 0) +
    (filter.filterBrands.size > 0 ? 1 : 0) +
    (filter.priceRange[0] > 0 || filter.priceRange[1] < PRICE_MAX ? 1 : 0);

  const handleSearchChange = (v: string) => { setSearchQuery(v); setPage(1); };
  const handleMainSelect = (m: string | null) => { setSelectedMain(m); setSelectedSub(null); setPage(1); };
  const handleSubSelect = (s: string | null) => { setSelectedSub(s); setPage(1); };

  const handleAddRoutine = (productId: number) => {
    if (isInRoutine(productId)) return;
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const matchedStep = ROUTINE_STEPS.find((step) => step.categories.includes(product.category));
    addStepProduct(matchedStep?.code ?? "PR", {
      id: String(product.id),
      brand: product.brand,
      name: product.name,
      category: product.category,
      emoji: "",
      skinTypes: product.skinTypes,
      effects: product.effects,
      matchScore: 0,
      imageUrl: product.imageUrl ?? undefined,
    });
  };

  const handleToggleCompare = (product: CompareProduct) => {
    const isAlreadySelected = compareItems.some((item) => item.id === product.id);
    toggleCompare(product);
    if (!isAlreadySelected && compareItems.length === 1) openCompare();
  };

  const totalPages = hasNext ? page + 1 : page;

  return (
    <div className="flex-1" style={{ backgroundColor: "#F5F2EC" }}>

      {showCompare && canCompare && (
        <CompareModal compareItems={compareItems as [CompareProduct, CompareProduct]} onClose={closeCompare} />
      )}

      {/* 상단 헤더 */}
      <div style={{ backgroundColor: "#F5F2EC", borderBottom: "1px solid #E2DDD8", paddingTop: "5px" }}>
        <div style={{ padding: "16px 16px 12px" }}>
          <h1 style={{ margin: "3px 0 12px", fontSize: "22px", fontWeight: 700, color: "#2A2118", letterSpacing: "-0.4px", lineHeight: 1.2 }}>
            맞춤 추천
          </h1>
          <div className="flex items-center gap-5">
            <div className="flex-1">
              <SearchBar value={searchQuery} onChange={handleSearchChange} placeholder="제품명, 브랜드 검색..." />
            </div>
            <button
              onClick={() => setShowFilter(true)}
              className="flex items-center gap-1.5 cursor-pointer border transition-all active:scale-[0.96] shrink-0"
              style={{
                height: "38px", padding: "0 12px", borderRadius: "10px", fontSize: "14px", fontWeight: 600,
                borderColor: filterCount > 0 ? "#A69D92" : "#E2DDD8",
                backgroundColor: filterCount > 0 ? "#A69D92" : "#FFFFFF",
                color: filterCount > 0 ? "#FFFFFF" : "#8A8278",
              }}
            >
              <SlidersHorizontal size={13} />
              필터
              {filterCount > 0 && (
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "16px", height: "16px", borderRadius: "50%", backgroundColor: "rgba(255,255,255,0.25)", fontSize: "10px", fontWeight: 700 }}>
                  {filterCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </div>

      <CategoryFilter selectedMain={selectedMain} selectedSub={selectedSub} onMainSelect={handleMainSelect} onSubSelect={handleSubSelect} />

      {/* 비교 힌트 바 */}
      {compareItems.length === 1 && (
        <div className="flex items-center justify-between mx-4 mt-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "#F2EFE9", border: "1px solid #D9D5D0" }}>
          <div className="flex items-center gap-2">
            <Scale size={13} style={{ color: "#8A8278" }} />
            <span style={{ fontSize: "12px", color: "#6B6258", fontWeight: 600 }}>비교할 제품을 1개 더 선택하세요</span>
          </div>
          <button onClick={clearCompare} style={{ fontSize: "11px", color: "#A69D92", border: "none", background: "none", cursor: "pointer" }}>취소</button>
        </div>
      )}
      {canCompare && (
        <div className="flex items-center justify-between mx-4 mt-3 px-3 py-2.5 rounded-xl" style={{ backgroundColor: "#3D3028" }}>
          <div className="flex items-center gap-2">
            <Scale size={13} style={{ color: "#F2EFE9" }} />
            <span style={{ fontSize: "12px", color: "#F2EFE9", fontWeight: 600 }}>2개 제품 선택 완료</span>
          </div>
          <div className="flex gap-2">
            <button onClick={clearCompare} style={{ fontSize: "11px", color: "#BFB6AA", border: "none", background: "none", cursor: "pointer" }}>취소</button>
            <button onClick={openCompare} style={{ fontSize: "12px", fontWeight: 700, color: "#3D3028", backgroundColor: "#F2EFE9", border: "none", borderRadius: "6px", padding: "4px 10px", cursor: "pointer" }}>비교하기</button>
          </div>
        </div>
      )}

      {/* 제품 그리드 */}
      <div style={{ padding: "16px 16px 24px" }}>
        {isLoading ? (
          <div className="flex justify-center py-20" style={{ color: "#A69D92", fontSize: "14px" }}>불러오는 중...</div>
        ) : isError ? (
          <div className="flex justify-center py-20" style={{ color: "#A69D92", fontSize: "14px" }}>오류가 발생했어요. 다시 시도해 주세요.</div>
        ) : products.length === 0 ? (
          <div style={{ backgroundColor: "#FFFFFF", borderRadius: "12px", border: "1px solid #E2DDD8", marginTop: "8px" }}>
            <EmptyState icon={Search} title="해당하는 제품이 없어요" description="검색어나 필터를 바꿔보세요" />
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", alignItems: "start" }}>
            {products.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                brand={product.brand}
                name={product.name}
                category={product.category}
                imageUrl={product.imageUrl ?? undefined}
                skinTypes={product.skinTypes}
                effects={product.effects}
                layout="grid"
                showActions={true}
                inRoutine={isInRoutine(product.id)}
                onAddRoutine={() => handleAddRoutine(product.id)}
                isOwned={isOwned(product.id)}
                onToggleOwned={() => toggleOwned({
                  id: String(product.id),
                  brand: product.brand,
                  name: product.name,
                  category: product.category,
                })}
                isInCompare={compareItems.some((item) => item.id === product.id)}
                onToggleCompare={() =>
                  handleToggleCompare({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    imageUrl: product.imageUrl ?? undefined,
                    skinTypes: product.skinTypes,
                    effects: product.effects,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onChange={(p) => { setPage(p); window.scrollTo(0, 0); }} />

      <FilterModal
        open={showFilter}
        onClose={() => setShowFilter(false)}
        state={filter}
        onChange={(next) => { setFilter((prev) => ({ ...prev, ...next })); setPage(1); }}
        onReset={() => { setFilter(FILTER_INITIAL_STATE); setPage(1); }}
        resultCount={products.length}
        availableBrands={BRANDS}
      />
    </div>
  );
}
