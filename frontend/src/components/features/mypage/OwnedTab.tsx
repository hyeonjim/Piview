"use client";

import { useState } from "react";
import { Package, ShieldAlert, Minus } from "lucide-react";
import { EmptyState } from "@/components/common";
import { Pagination } from "@/components/common/Pagination";
import ProductCard from "@/components/common/ProductCard";
import ProductSearchModal from "./ProductSearchModal";
import {
  useMyCosQuery,
  useRemoveMyCos,
  useDislikedProductsQuery,
  useRemoveDislikedProduct,
} from "@/hooks";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import { PAGE_SIZE } from "@/constants/pagination";
import type { LocalProduct } from "@/stores";

interface OwnedTabProps {
  // 루틴 등록 배지 표시용
  routine: Record<string, LocalProduct[]>;
}

export default function OwnedTab({ routine }: OwnedTabProps) {
  // ── 모달 상태 ──────────────────────────────────────────────────
  const [openOwnedModal, setOpenOwnedModal] = useState(false);
  const [openAvoidModal, setOpenAvoidModal] = useState(false);

  // ── 페이지 상태 ────────────────────────────────────────────────
  const [ownedPage, setOwnedPage] = useState(1);
  const [avoidPage, setAvoidPage] = useState(1);

  // ── 보유 제품 (myCos) ──────────────────────────────────────────
  const { data: myCosItems = [] } = useMyCosQuery();
  const { mutate: removeMyCos } = useRemoveMyCos();

  // MyCosItem → ProductCard props 변환
  const ownedProducts = myCosItems.map((item) => ({
    id: item.id, // myCosId — 삭제에 사용
    productId: item.productId,
    brand: item.brand,
    name: item.productName,
    category: item.category,
    imageUrl: item.imageUrl ?? undefined,
    skinTypes: [
      item.topSkinType ? fromSkinTypeEnum(item.topSkinType) : null,
      item.top2SkinType ? fromSkinTypeEnum(item.top2SkinType) : null,
    ].filter(Boolean) as string[],
  }));

  const ownedTotalPages = Math.ceil(ownedProducts.length / PAGE_SIZE) || 1;
  const pagedOwned = ownedProducts.slice(
    (ownedPage - 1) * PAGE_SIZE,
    ownedPage * PAGE_SIZE,
  );

  // 루틴 배지 — 루틴에 포함된 제품인지 확인 (productId 기준)
  const isInRoutine = (productId?: number) => {
    if (!productId) return false;
    return Object.values(routine)
      .flat()
      .some((routineProduct) => String(routineProduct.id) === String(productId));
  };

  // ── 기피 제품 (disliked) ───────────────────────────────────────
  const { data: dislikedItems = [] } = useDislikedProductsQuery();
  const { mutate: removeDisliked } = useRemoveDislikedProduct();

  const avoidTotalPages = Math.ceil(dislikedItems.length / PAGE_SIZE) || 1;
  const pagedAvoid = dislikedItems.slice(
    (avoidPage - 1) * PAGE_SIZE,
    avoidPage * PAGE_SIZE,
  );

  return (
    <div className="px-4 pb-24 pt-4 flex flex-col gap-20">
      {/* ── 보유 제품 섹션 ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <div>
            <p className="text-base font-bold text-text-primary">Owned Products</p>
            <p className="text-xs text-text-muted mt-0.5">
              {ownedProducts.length}개 보유 중
            </p>
          </div>
          <button
            onClick={() => setOpenOwnedModal(true)}
            className="text-[13px] px-3 py-1 rounded-full bg-brand/10 text-brand font-semibold cursor-pointer border-none transition-colors hover:bg-brand/20"
          >
            + 추가
          </button>
        </div>

        {ownedProducts.length === 0 ? (
          <div className="border border-dashed border-border rounded-2xl py-12 mt-3">
            <EmptyState
              icon={Package}
              title="보유한 제품이 없습니다"
              description={"제품 상세에서 보유중 버튼을 눌러\n제품을 등록해보세요"}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mt-3 [&_p.line-clamp-2]:text-[14px]!">
              {pagedOwned.map((product) => (
                <div key={product.id} className="relative">
                  <ProductCard
                    id={product.id}
                    href={product.category
                      ? `/product/${product.productId}?category=${encodeURIComponent(product.category)}`
                      : `/product/${product.productId}`}
                    brand={product.brand}
                    name={product.name}
                    category={product.category}
                    imageUrl={product.imageUrl}
                    skinTypes={product.skinTypes}
                    layout="grid"
                    showLike={false}
                    inRoutine={isInRoutine(product.productId)}
                  />
                  {/* 루틴 배지 — 카드 우상단 오버레이 */}
                  {isInRoutine(product.productId) && (
                    <span className="absolute top-2 right-8 text-[10px] px-1.5 py-px rounded-[4px] font-bold bg-brand-bg text-brand z-10">
                      루틴
                    </span>
                  )}
                  {/* 삭제 버튼 오버레이 */}
                  <button
                    onClick={() => removeMyCos(product.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 shadow-sm border border-border cursor-pointer z-10 transition-colors hover:bg-white"
                    aria-label="보유 제품 삭제"
                  >
                    <Minus size={11} className="text-text-muted" />
                  </button>
                </div>
              ))}
            </div>
            <Pagination
              page={ownedPage}
              totalPages={ownedTotalPages}
              onChange={(page) => { setOwnedPage(page); }}
            />
          </>
        )}
      </section>

      {/* ── 기피 제품 섹션 ─────────────────────────────────────── */}
      <section>
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-start gap-1.5">
            <ShieldAlert size={16} className="text-danger mt-0.5 shrink-0" />
            <div>
              <p className="text-base font-bold text-text-primary">Avoid Products</p>
              <p className="text-xs text-text-muted mt-0.5">
                {dislikedItems.length}개 등록됨
              </p>
            </div>
          </div>
          <button
            onClick={() => setOpenAvoidModal(true)}
            className="text-[13px] px-3 py-1 rounded-full bg-bg-like text-danger font-semibold cursor-pointer border-none transition-colors hover:opacity-80"
          >
            + 추가
          </button>
        </div>

        {dislikedItems.length === 0 ? (
          <div
            className="border border-dashed rounded-2xl py-12 mt-3"
            style={{ borderColor: "var(--color-bg-like)" }}
          >
            <EmptyState
              icon={ShieldAlert}
              title="등록된 제품이 없습니다"
              description={"트러블을 유발했거나 맞지 않았던\n제품을 등록해보세요"}
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-3 gap-3 mt-3 [&_p.line-clamp-2]:text-[14px]!">
              {pagedAvoid.map((item) => (
                <div key={item.dislikedProductId} className="relative">
                  <ProductCard
                    id={item.dislikedProductId}
                    brand={item.brandName}
                    name={item.productName}
                    category={item.categoryName}
                    imageUrl={item.imageUrl ?? undefined}
                    skinTypes={[
                      item.topSkinType ? fromSkinTypeEnum(item.topSkinType) : null,
                      item.top2SkinType ? fromSkinTypeEnum(item.top2SkinType) : null,
                    ].filter(Boolean) as string[]}
                    layout="grid"
                    showLike={false}
                  />
                  {/* 삭제 버튼 오버레이 */}
                  <button
                    onClick={() => removeDisliked(item.dislikedProductId)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full bg-white/90 shadow-sm border border-border cursor-pointer z-10 transition-colors hover:bg-white"
                    aria-label="기피 제품 삭제"
                  >
                    <Minus size={11} className="text-danger" />
                  </button>
                </div>
              ))}
            </div>
            <Pagination
              page={avoidPage}
              totalPages={avoidTotalPages}
              onChange={(page) => { setAvoidPage(page); }}
            />
          </>
        )}
      </section>

      {/* ── 모달 ───────────────────────────────────────────────── */}
      {openOwnedModal && (
        <ProductSearchModal
          mode="owned"
          onClose={() => setOpenOwnedModal(false)}
        />
      )}
      {openAvoidModal && (
        <ProductSearchModal
          mode="avoid"
          onClose={() => setOpenAvoidModal(false)}
        />
      )}
    </div>
  );
}
