"use client";

import { useState } from "react";
import { Package, ShieldAlert, Minus, Ban } from "lucide-react";
import { EmptyState } from "@/components/common";
import { Pagination } from "@/components/common/Pagination";
import ProductCard from "@/components/common/ProductCard";
import ProductSearchModal from "./ProductSearchModal";
import {
  useMyCosWithTags,
  useRemoveMyCos,
  useDislikedProductsWithTags,
  useRemoveDislikedProduct,
  useDraftQuery,
} from "@/hooks";
import { PAGE_SIZE } from "@/constants/pagination";

export default function OwnedTab() {
  // ── 모달 상태 ──────────────────────────────────────────────────
  const [openOwnedModal, setOpenOwnedModal] = useState(false);
  const [openAvoidModal, setOpenAvoidModal] = useState(false);

  // ── 페이지 상태 ────────────────────────────────────────────────
  const [ownedPage, setOwnedPage] = useState(1);
  const [avoidPage, setAvoidPage] = useState(1);

  // ── 루틴 draft 기반 배지 표시 ────────────────────────────────
  // draft에 포함된 productId Set — isInRoutine 판별에 사용
  const { data: draftItems = [] } = useDraftQuery();
  const draftProductIds = new Set(draftItems.map((item) => item.product.productId));

  // ── 보유 제품 (myCos) — 상세 API로 tags 보완 ──────────────────
  const { data: myCosItems = [] } = useMyCosWithTags();
  const { mutate: removeMyCos } = useRemoveMyCos();

  // MyCosItem → ProductCard props 변환
  const ownedProducts = myCosItems.map((item) => ({
    id: item.myCosId, // myCosId — 삭제에 사용
    productId: item.productInfo.productId,
    brand: item.productInfo.brandName,
    name: item.productInfo.name,
    category: item.productInfo.categoryName,
    imageUrl: item.productInfo.imageUrl ?? undefined,
  }));

  const ownedTotalPages = Math.ceil(ownedProducts.length / PAGE_SIZE) || 1;
  const pagedOwned = ownedProducts.slice(
    (ownedPage - 1) * PAGE_SIZE,
    ownedPage * PAGE_SIZE,
  );

  // 루틴 배지 — draft에 포함된 제품인지 확인 (productId 기준)
  const isInRoutine = (productId?: number) =>
    !!productId && draftProductIds.has(productId);

  // ── 기피 제품 (disliked) — 상세 API로 tags 보완 ──────────────
  const { data: dislikedItems = [] } = useDislikedProductsWithTags();
  const { mutate: removeDisliked } = useRemoveDislikedProduct();

  const avoidTotalPages = Math.ceil(dislikedItems.length / PAGE_SIZE) || 1;
  const pagedAvoid = dislikedItems.slice(
    (avoidPage - 1) * PAGE_SIZE,
    avoidPage * PAGE_SIZE,
  );

  return (
    <div className="px-7 pb-10 pt-4 flex flex-col gap-10 bg-category-pill-default-bg">
      {/* ── 보유 제품 섹션 ─────────────────────────────────────── */}
      <section>
        <div className="mb-1">
          <div className="flex items-center justify-between">
            <p className="text-base font-bold text-[#5e5c59]">Owned</p>
            <button
              onClick={() => setOpenOwnedModal(true)}
              className="text-[14px] px-3 py-1 rounded-full bg-brand/10 text-[#636264] font-semibold cursor-pointer border-none transition-colors hover:bg-brand/20"
            >
              + 추가
            </button>
          </div>
          <p className="text-[14px] font-semibold text-[#787879] mt-0.5">
            {ownedProducts.length}개 보유 중
          </p>
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
            <div className="grid grid-cols-3 gap-3 mt-5 items-stretch [&_p.line-clamp-2]:text-[14px]!">
              {pagedOwned.map((product) => (
                <div key={product.id} className="relative h-full flex flex-col">
                  <ProductCard
                    id={product.id}
                    href={product.category
                      ? `/product/${product.productId}?category=${encodeURIComponent(product.category)}`
                      : `/product/${product.productId}`}
                    brand={product.brand}
                    name={product.name}
                    category={product.category}
                    imageUrl={product.imageUrl}
                    layout="grid"
                    showLike={false}
                    inRoutine={isInRoutine(product.productId)}
                  />
                  {/* 삭제 버튼 오버레이 */}
                  <button
                    onClick={() => removeMyCos(product.id)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center rounded-full cursor-pointer z-10 transition-colors hover:bg-white"
                    aria-label="보유 제품 삭제"
                  >
                    <Minus size={16} className="text-text-muted" />
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
        <div className="mb-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <p className="text-base font-bold text-[#db1c1c]">Avoid</p>
              <Ban size={14} className="text-[#db1c1c]" />
            </div>
            <button
              onClick={() => setOpenAvoidModal(true)}
              className="text-[14px] px-3 py-1 rounded-full bg-brand/10 text-[#636264] font-semibold cursor-pointer border-none transition-colors hover:bg-brand/20"
            >
              + 추가
            </button>
          </div>
          <p className="text-[14px] font-semibold text-[#787879] mt-0.5">
            {dislikedItems.length}개 등록됨
            <br />등록된 제품의 알러지성분을 가진 제품은 추천에서 제외됩니다
          </p>
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
            <div className="grid grid-cols-3 gap-3 mt-5 items-stretch [&_p.line-clamp-2]:text-[14px]!">
              {pagedAvoid.map((item) => (
                <div key={item.dislikedProductId} className="relative h-full flex flex-col">
                  <ProductCard
                    id={item.productId}
                    brand={item.brandName}
                    name={item.productName}
                    category={item.categoryName}
                    imageUrl={item.imageUrl ?? undefined}
                    layout="grid"
                    showLike={false}
                  />
                  {/* 삭제 버튼 오버레이 */}
                  <button
                    onClick={() => removeDisliked(item.dislikedProductId)}
                    className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center cursor-pointer z-10 transition-colors"
                    aria-label="기피 제품 삭제"
                  >
                    <Minus size={16} />
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
