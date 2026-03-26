"use client";

import { Heart } from "lucide-react";
import { useMyCosQuery, useAddMyCos, useRemoveMyCos } from "@/hooks";
import { useLikedProducts, useCompare } from "@/hooks";
import { useLikeStore } from "@/stores";
import ProductCard from "@/components/common/ProductCard";
import CompareModal from "@/components/common/CompareModal";
import type { ProductViewModel } from "@/types/product/myCos";
import { Pagination } from "@/components/common/Pagination";
import { PAGE_SIZE } from "@/constants/pagination";
import { mapProductSummaryList } from "@/utils/productMapper";

export default function LikesPage() {
  const { page, setPage } = useLikeStore();
  const { data: rawLikedProducts = [], isLoading } = useLikedProducts();

  // API 원본 데이터 → 한글 변환 + 카테고리별 태그 필터링 적용
  const likedProducts = mapProductSummaryList(rawLikedProducts);

  // 페이지네이션 — 프론트에서 slice
  const totalPages = Math.ceil(likedProducts.length / PAGE_SIZE) || 1;
  const pagedProducts = likedProducts.slice(
    (page - 1) * PAGE_SIZE,
    page * PAGE_SIZE,
  );

  // 보유 상태 — API 연동
  const { data: myCosData = [] } = useMyCosQuery();
  const { mutate: addMyCos } = useAddMyCos();
  const { mutate: removeMyCos } = useRemoveMyCos();

  const isOwned = (productId: number) =>
    myCosData.some((item) => item.productInfo.productId === productId);

  const handleToggleOwned = (productId: number) => {
    const owned = myCosData.find(
      (item) => item.productInfo.productId === productId,
    );
    if (owned) removeMyCos(owned.myCosId);
    else addMyCos(productId);
  };

  // 비교 모달
  const {
    compareItems,
    showCompare,
    toggleCompare,
    clearCompare,
    openCompare,
    closeCompare,
    canCompare,
  } = useCompare<ProductViewModel>();

  // 비교 토글 핸들러 — 2개 선택 시 모달 자동 오픈
  const handleToggleCompare = (product: ProductViewModel) => {
    const isAlreadySelected = compareItems.some(
      (item) => item.id === product.id,
    );
    toggleCompare(product);
    if (!isAlreadySelected && compareItems.length === 1) openCompare();
  };

  return (
    <div className="flex-1 bg-[#f9f8f6]">
      {showCompare && canCompare && (
        <CompareModal
          compareItems={compareItems as [ProductViewModel, ProductViewModel]}
          onClose={closeCompare}
        />
      )}

      {/* 상단 헤더 */}
      <div className="bg-[#faf8f5] pt-[5px]">
        <div className="px-5 pt-4 pb-3">
          <h1 className="mt-[3px] text-[20px] font-semibold text-[#635446] leading-[1.2]">
            Liked
          </h1>
        </div>
      </div>

      {/* 비교 힌트 바 — 1개 선택 시 */}
      {compareItems.length === 1 && (
        <div className="flex items-center justify-between mx-5 px-4 py-2 rounded-xl bg-white border border-[#e8e4e0]">
          <span className="text-[13px] font-medium text-[#6e6358]">
            비교할 제품을 1개 더 선택하세요
          </span>
          <button
            onClick={clearCompare}
            className="text-xs text-[#a69d92] bg-transparent border-none cursor-pointer"
          >
            취소
          </button>
        </div>
      )}

      {/* 비교 힌트 바 — 2개 선택 완료 */}
      {canCompare && (
        <div className="flex items-center justify-between mx-5 px-4 py-2 rounded-xl bg-[#e9c8b3]">
          <span className="text-[13px] font-medium text-[#fff]">
            2개 제품 선택 완료
          </span>
          <div className="flex gap-2">
            <button
              onClick={clearCompare}
              className="text-[11px] text-white/90 bg-transparent border-none cursor-pointer"
            >
              취소
            </button>
            <button
              onClick={openCompare}
              className="text-xs font-semibold text-[#716b67] bg-white border-none rounded-lg px-3 py-1.5 cursor-pointer"
            >
              비교하기
            </button>
          </div>
        </div>
      )}

      {/* 제품 그리드 */}
      <div className="px-5 py-4">
        {isLoading ? (
          <div className="flex justify-center py-20 text-[13px] text-[#a69d92]">
            불러오는 중...
          </div>
        ) : likedProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-[#e8e4e0] px-5 py-12 mt-2">
            <Heart size={32} className="text-[#d0cbc4] mb-3" />
            <p className="m-0 text-[14px] font-semibold text-[#a69d92]">
              찜한 제품이 없어요
            </p>
            <p className="mt-1.5 mb-0 text-[12px] text-[#c4bcb4] text-center">
              마음에 드는 제품을 찜해보세요
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-7 items-stretch">
            {pagedProducts.map((product, index) => (
              <ProductCard
                key={product.id}
                priority={index === 0}
                id={product.id}
                brand={product.brand}
                name={product.name}
                category={product.category}
                imageUrl={product.imageUrl ?? undefined}
                skinTypes={product.skinTypes}
                effects={product.effects}
                layout="grid"
                showCategory={true}
                categoryInline={true}
                showActions={true}
                isOwned={isOwned(product.id)}
                onToggleOwned={() => handleToggleOwned(product.id)}
                isInCompare={compareItems.some(
                  (item) => item.id === product.id,
                )}
                onToggleCompare={() =>
                  handleToggleCompare({
                    id: product.id,
                    name: product.name,
                    brand: product.brand,
                    imageUrl: product.imageUrl,
                    skinTypes: product.skinTypes,
                    effects: product.effects,
                  })
                }
              />
            ))}
          </div>
        )}
      </div>

      <Pagination
        page={page}
        totalPages={totalPages}
        onChange={(page) => {
          setPage(page);
          window.scrollTo(0, 0);
        }}
      />
    </div>
  );
}
