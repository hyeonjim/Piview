"use client";

import { useState, useRef, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Package,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Heart,
  Scale,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProductDetail,
  useLike,
  useAddMyCos,
  useRemoveMyCos,
  useMyCosQuery,
  useAddDraftItemMutation,
  useRemoveProductFromDraftMutation,
  useDraftQuery,
} from "@/hooks";
import { getEwgColor } from "@/constants/categoryColors";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import { getRoutineSteps } from "@/constants/routineSteps";
import CompareModal from "@/components/common/CompareModal";
import type { ProductViewModel } from "@/types/product/myCos";
import { useMainRoutineQuery } from "@/hooks";
import { useUserStore, selectGender } from "@/stores";

function AllergenIcon() {
  return (
    <div className="flex items-center justify-center shrink-0 self-center w-[20px] h-[20px] rounded-full bg-red-50">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="var(--color-danger)" />
        <rect x="11" y="6.5" width="2" height="7" rx="1" fill="white" />
        <circle cx="12" cy="17" r="1.3" fill="white" />
      </svg>
    </div>
  );
}

function EwgDropIcon({ color }: { color: string }) {
  return (
    <svg width="22" height="26" viewBox="0 0 22 26" fill="none">
      <path
        d="M11 0C11 0 0 12 0 17.5C0 22.2 4.9 25.5 11 25.5C17.1 25.5 22 22.2 22 17.5C22 12 11 0 11 0Z"
        fill={color}
        fillOpacity={0.85}
      />
    </svg>
  );
}

function ProductDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();
  const recommendReason = searchParams.get("reason");

  const {
    data: productData,
    isLoading,
    isError,
  } = useProductDetail(id ? Number(id) : null);

  // 보유 상태 — API 연동
  const { data: myCosData = [] } = useMyCosQuery();
  const { mutate: addMyCos } = useAddMyCos();
  const { mutate: removeMyCos } = useRemoveMyCos();
  const productIdNum = id ? Number(id) : null;
  const myCosItem = myCosData.find(
    (item) => (item.productId ?? item.id) === productIdNum,
  );
  const owned = !!myCosItem;
  const { toggleLike } = useLike();
  // 초기값은 API 응답의 liked, 토글 시 로컬에서 즉시 반전
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const resolvedIsLiked =
    isLiked !== null ? isLiked : (productData?.liked ?? false);

  useEffect(() => {
    // productData 로드되면 초기값 세팅 (아직 토글 안 한 경우만)
    if (productData && isLiked === null) {
      setIsLiked(productData.liked ?? false);
    }
  }, [productData?.liked]);

  const [showRoutineCompare, setShowRoutineCompare] = useState(false);
  const [selectedRoutineProductIndex, setSelectedRoutineProductIndex] =
    useState(0);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const { mutate: addDraftItem } = useAddDraftItemMutation();
  const { mutate: removeDraftItem } = useRemoveProductFromDraftMutation();
  const { data: draftItems = [] } = useDraftQuery();

  // 성별에 따라 올바른 루틴 스텝 선택 (남성: 쉐이빙/올인원 포함)
  const gender = useUserStore(selectGender);
  const routineSteps = getRoutineSteps(gender);

  // 내루틴 비교 — 메인 루틴 API에서 같은 스텝 제품 추출
  // productData.categoryName API 미지원 → ProductCard href로 넘어온 category searchParam 사용
  const { data: mainRoutineData } = useMainRoutineQuery();

  const categoryFromUrl = searchParams.get("category");
  const effectiveCategoryName =
    productData?.categoryName ?? categoryFromUrl ?? null;

  const allMainRoutineProducts: ProductViewModel[] =
    mainRoutineData?.steps.flatMap((step) =>
      step.products.map((rp) => ({
        id: rp.product.productId,
        name: rp.product.name ?? "",
        brand: rp.product.brandName ?? "",
        category: rp.product.categoryName ?? "",
        imageUrl: rp.product.imageUrl ?? null,
        skinTypes: (rp.product.skinTypes ?? []).map(fromSkinTypeEnum),
        effects: rp.product.tags ?? [],
        emoji: "🧴",
      })),
    ) ?? [];

  const sameCategoryRoutineProducts = effectiveCategoryName
    ? (() => {
        // 현재 제품 카테고리가 속한 stepCode
        const currentStepCode = routineSteps.find((step) =>
          step.categories.includes(effectiveCategoryName),
        )?.code;
        if (!currentStepCode) return allMainRoutineProducts; // categoryName 없으면 전체 표시
        // 루틴 제품 중 같은 stepCode에 속한 것만
        return allMainRoutineProducts.filter((p) => {
          const pStepCode = routineSteps.find((step) =>
            step.categories.includes(p.category ?? ""),
          )?.code;
          return pStepCode === currentStepCode;
        });
      })()
    : allMainRoutineProducts;

  const currentProductAsCompare: ProductViewModel | null = productData
    ? {
        id: productData.productId,
        name: productData.productName ?? "",
        brand: productData.brandName ?? "",
        imageUrl: productData.imageUrl,
        emoji: "🧴",
        price: productData.price ?? undefined,
        skinTypes: productData.skinTypes,
        effects: productData.tags,
        ewgSafe: productData.lowCount,
        ewgCaution: productData.mediumCount,
        ewgDanger: productData.highCount,
      }
    : null;

  const selectedRoutineCompare: ProductViewModel | null =
    sameCategoryRoutineProducts.length > 0
      ? sameCategoryRoutineProducts[selectedRoutineProductIndex]
      : null;

  const [activeTab, setActiveTab] = useState<"ingredients" | "skintype">(
    "ingredients",
  );
  const [isIngredientListOpen, setIsIngredientListOpen] = useState(false);
  const [isIngredientTextOpen, setIsIngredientTextOpen] = useState(false);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const ewgSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (!ewgSectionRef.current) return;
      setIsScrollTopVisible(
        ewgSectionRef.current.getBoundingClientRect().top <= 60,
      );
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });
  const routineAdded = draftItems.some(
    (item) => item.product?.productId === productIdNum,
  );

  const handleAddRoutine = () => {
    if (!productData || !productIdNum) return;
    if (routineAdded) {
      removeDraftItem(productIdNum, {
        onSuccess: () => toast(`✓ ${productData.productName} 루틴에서 제거됨`),
      });
      return;
    }
    const matchedStep = routineSteps.find((step) =>
      step.categories.includes(effectiveCategoryName ?? ""),
    );
    const columnId = matchedStep?.columnId ?? 3; // 기본값: PR(토너) columnId
    addDraftItem(
      { columnId, productId: productIdNum },
      {
        onSuccess: () => toast(`✓ ${productData.productName} 루틴에 추가됨!`),
        onError: () =>
          toast.error("루틴 추가에 실패했어요. 다시 시도해 주세요."),
      },
    );
  };

  const handleToggleOwned = () => {
    if (!productIdNum) return;
    if (myCosItem) removeMyCos(myCosItem.id);
    else addMyCos(productIdNum);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-full text-text-muted">
        불러오는 중...
      </div>
    );
  }
  if (isError || !productData || !currentProductAsCompare) {
    return (
      <div className="flex items-center justify-center min-h-full text-text-muted">
        제품 정보를 불러올 수 없어요
      </div>
    );
  }

  const safe = productData.lowCount ?? 0;
  const caution = productData.mediumCount ?? 0;
  const danger = productData.highCount ?? 0;
  const unknown = productData.unknownCount ?? 0;
  const total = safe + caution + danger + unknown;
  const allergenList = productData.allergenIngredients ?? [];
  const dangerIngredients = productData.cautionIngredients ?? [];
  // 피부타입별 점수 — 순서 고정(건성/지성/복합성/수부지) + 한글 변환
  const SKIN_TYPE_ORDER = ["dry", "oily", "combination", "subuji"];
  const SKIN_TYPE_KO: Record<string, string> = {
    dry: "건성",
    oily: "지성",
    combination: "복합성",
    subuji: "수부지",
  };
  const skinTypeScores = SKIN_TYPE_ORDER.filter(
    (key) => productData.skinTypeScores?.[key] !== undefined,
  ).map(
    (key) =>
      [SKIN_TYPE_KO[key] ?? key, productData.skinTypeScores[key]] as [
        string,
        number,
      ],
  );
  const skinTypes = (productData.skinTypes ?? []).map(fromSkinTypeEnum);
  const tags = productData.tags ?? [];
  const ingredients = productData.ingredients ?? [];
  const ingredientsKr = ingredients
    .map((i) => i.nameKo)
    .filter(Boolean) as string[];

  return (
    <div className="flex flex-col min-h-screen relative bg-bg-beige pb-nav">
      {showCompareModal && selectedRoutineCompare && (
        <CompareModal
          compareItems={[currentProductAsCompare, selectedRoutineCompare]}
          onClose={() => setShowCompareModal(false)}
          isRoutineCompare
        />
      )}

      {showRoutineCompare && sameCategoryRoutineProducts.length === 0 && (
        <div
          className="fixed inset-0 z-60 flex flex-col justify-end items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowRoutineCompare(false)}
        >
          <div
            className="relative bg-white rounded-t-2xl flex flex-col"
            style={{ width: "100%", maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E0DDD8]" />
            </div>
            <div className="flex items-center justify-between px-4 py-3 border-b border-[#EDEBE8]">
              <h2 className="m-0 text-base font-bold text-[var(--color-text-primary)]">
                내루틴 비교하기
              </h2>
              <button
                onClick={() => setShowRoutineCompare(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full bg-[var(--color-bg-beige)] border-none cursor-pointer"
              >
                <Scale size={15} className="text-[var(--color-text-hint)]" />
              </button>
            </div>
            <div className="px-6 py-10 flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[var(--color-bg-beige)] flex items-center justify-center mb-1">
                <Scale size={24} className="text-[#C4BEB7]" />
              </div>
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                루틴에 비교할 제품이 없어요
              </p>
              <p className="text-sm text-[var(--color-brand)] text-center leading-relaxed">
                {productData.categoryName} 카테고리의 제품을
                <br />
                루틴에 추가하면 비교할 수 있어요
              </p>
            </div>
            <div className="px-4 pb-8">
              <button
                onClick={() => setShowRoutineCompare(false)}
                className="w-full h-11 rounded-xl bg-[var(--color-bg-beige)] border-none cursor-pointer text-sm font-semibold text-[var(--color-text-hint)]"
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}

      {showRoutineCompare && sameCategoryRoutineProducts.length > 1 && (
        <div
          className="fixed inset-0 z-70 flex flex-col justify-end items-center"
          style={{
            backgroundColor: "rgba(0,0,0,0.45)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowRoutineCompare(false)}
        >
          <div
            className="relative bg-white rounded-t-2xl flex flex-col"
            style={{ width: "100%", maxWidth: "500px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 rounded-full bg-[#E0DDD8]" />
            </div>
            <div className="px-4 py-3 border-b border-[#EDEBE8]">
              <p className="text-base font-bold text-[var(--color-text-primary)]">
                비교할 루틴 제품 선택
              </p>
              <p className="text-xs text-[var(--color-brand)] mt-0.5">
                {productData.categoryName} 카테고리 제품{" "}
                {sameCategoryRoutineProducts.length}개
              </p>
            </div>
            <div className="px-4 py-2 pb-8 flex flex-col gap-1">
              {sameCategoryRoutineProducts.map((rp, index) => (
                <button
                  key={rp.id}
                  onClick={() => setSelectedRoutineProductIndex(index)}
                  className="flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] text-left"
                  style={{
                    borderColor:
                      selectedRoutineProductIndex === index
                        ? "#a2aa7b"
                        : "#E8E4DF",
                    backgroundColor:
                      selectedRoutineProductIndex === index
                        ? "#f0f2e8"
                        : "var(--color-bg-card)",
                  }}
                >
                  <span className="text-2xl">{rp.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {rp.name}
                    </p>
                    <p className="text-xs text-[var(--color-brand)]">
                      {rp.brand}
                    </p>
                  </div>
                  {selectedRoutineProductIndex === index && (
                    <Check
                      size={16}
                      className="text-brand shrink-0"
                      style={{ color: "#a2aa7b" }}
                    />
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowRoutineCompare(false);
                  setShowCompareModal(true);
                }}
                className="mt-2 w-full h-11 rounded-xl border-none cursor-pointer text-sm font-bold text-white"
                style={{ backgroundColor: "#a2aa7b" }}
              >
                비교하기
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between px-4 h-12 bg-bg-beige">
        <button
          onClick={() => router.back()}
          className="size-9 flex items-center justify-center rounded-full bg-white/70 border-none cursor-pointer"
        >
          <ChevronLeft size={22} color="var(--color-product-name)" />
        </button>
        <button
          onClick={() => {
            setIsLiked((prev) => !(prev ?? productData?.liked ?? false));
            toggleLike(id);
          }}
          className="size-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer transition-all active:scale-[0.93]"
        >
          <Heart
            size={22}
            className="transition-all duration-150"
            style={{
              color: resolvedIsLiked ? "#E8715A" : "var(--color-nav-inactive)",
              fill: resolvedIsLiked ? "#E8715A" : "none",
            }}
          />
        </button>
      </div>

      <div className="pb-8">
        {/* 이미지 카드 — 아래 섹션과 동일한 스타일, 이미지보다 살짝 큰 패딩 */}
        <div className="mx-5 mb-3 rounded-2xl bg-white overflow-hidden">
          <div className="relative w-full aspect-3/2">
            {productData.imageUrl ? (
              <img
                src={productData.imageUrl}
                alt={productData.productName ?? ""}
                className="absolute inset-0 w-full h-full object-contain p-4"
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                  (
                    e.target as HTMLImageElement
                  ).nextElementSibling?.removeAttribute("hidden");
                }}
              />
            ) : null}
            <span
              className="absolute inset-0 flex items-center justify-center text-[80px]"
              hidden={!!productData.imageUrl}
            >
              🧴
            </span>
          </div>
        </div>

        <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[16px] text-text-muted font-semibold mb-0.5">
                {productData.brandName}
              </p>
              <h1 className="text-[20px] font-semibold text-text-primary leading-[1.35]">
                {productData.productName}
              </h1>
            </div>
            <button
              onClick={() => {
                if (sameCategoryRoutineProducts.length === 1) {
                  setSelectedRoutineProductIndex(0);
                  setShowCompareModal(true);
                } else {
                  setShowRoutineCompare(true);
                }
              }}
              className="flex items-center gap-1 px-2.5 h-7 rounded-lg border cursor-pointer transition-all active:scale-[0.96] text-[11px] font-semibold shrink-0 border-border bg-white text-text-hint"
            >
              <Scale size={11} />
              내루틴 비교하기
            </button>
          </div>

          {(skinTypes.length > 0 || tags.length > 0) && (
            <div className="flex flex-col gap-1.5 mb-7">
              {skinTypes.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {skinTypes.map((st) => (
                    <span
                      key={st}
                      className="text-[14px] px-2 py-0.5 rounded-[6px] bg-brand-bg text-brand"
                    >
                      {st}
                    </span>
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-2.25 py-0.5 rounded-xl bg-bg-chip text-text-hint border border-border-warm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 flex-wrap">
              {productData.price ? (
                <p className="text-base font-normal text-text-primary">
                  ₩{productData.price.toLocaleString()}
                </p>
              ) : (
                <p className="text-base font-normal text-text-hint">
                  가격 미정
                </p>
              )}
              {productData.volume && (
                <span className="text-base text-text-hint font-normal">
                  / {productData.volume}
                </span>
              )}
            </div>
            <div className="flex gap-1.5 shrink-0">
              {gender !== "WOMEN" && (
                <button
                  onClick={handleAddRoutine}
                  className={`flex items-center justify-center gap-1 w-20 h-8 rounded-xl border-none cursor-pointer transition-all active:scale-[0.98] text-xs font-bold ${routineAdded ? "bg-[#F0F0F0] text-text-muted" : "bg-brand text-white"}`}
                >
                  {routineAdded ? (
                    <>
                      <Check size={11} /> 추가됨
                    </>
                  ) : (
                    <>
                      <Plus size={11} /> 루틴추가
                    </>
                  )}
                </button>
              )}
              <button
                onClick={handleToggleOwned}
                className={`flex items-center justify-center gap-1 w-20 h-8 rounded-xl cursor-pointer transition-all active:scale-[0.98] text-xs font-semibold border ${owned ? "border-brand-light bg-brand-bg text-brand" : "border-border-warm bg-white text-text-hint"}`}
              >
                <Package size={11} /> {owned ? "보유 중" : "보유추가"}
              </button>
            </div>
          </div>
        </div>

        {recommendReason && (
          <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-7 rounded-full flex items-center justify-center bg-brand-bg shrink-0">
                <Sparkles size={14} className="text-brand" />
              </div>
              <p className="font-semibold text-text-sub">추천 이유</p>
            </div>
            <p className="text-xs text-text-primary leading-[1.6] pl-[22px]">
              {recommendReason}
            </p>
          </div>
        )}

        {ingredients.length > 0 && (
          <div
            ref={ewgSectionRef}
            className="mx-5 rounded-2xl bg-white p-4 mb-3"
          >
            <div className="mb-3">
              <p className="text-[16px] font-bold text-text-primary">
                EWG 성분 분석
              </p>
              <p className="text-xs text-text-muted">총 {total}개 성분</p>
            </div>
            <div className="flex h-3 gap-0.5 rounded-full overflow-hidden mb-3">
              <div className="rounded bg-ewg-safe" style={{ flex: safe }} />
              <div
                className="rounded bg-ewg-caution"
                style={{ flex: caution }}
              />
              {danger > 0 && (
                <div
                  className="rounded bg-ewg-danger"
                  style={{ flex: danger }}
                />
              )}
              <div className="rounded bg-[#E0E0E0]" style={{ flex: unknown }} />
            </div>
            <div className="grid grid-cols-4 gap-1 text-center">
              {[
                {
                  label: "1~2등급",
                  sub: "안전",
                  count: safe,
                  color: "var(--color-ewg-safe)",
                },
                {
                  label: "3~6등급",
                  sub: "보통",
                  count: caution,
                  color: "var(--color-ewg-caution)",
                },
                {
                  label: "7~10등급",
                  sub: "주의",
                  count: danger,
                  color: "var(--color-ewg-danger)",
                },
                {
                  label: "등급 미정",
                  sub: "정보없음",
                  count: unknown,
                  color: "#BDBDBD",
                },
              ].map((grade) => (
                <div key={grade.sub}>
                  <p className="text-xs text-text-sub mb-0.5">
                    • {grade.label}
                  </p>
                  <p
                    className="text-lg font-bold"
                    style={{ color: grade.color }}
                  >
                    {grade.count}
                  </p>
                  <p className="text-[14px] text-text-muted mt-0.5">
                    {grade.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {ingredients.length > 0 &&
          (dangerIngredients.length > 0 || allergenList.length > 0) && (
            <div className="mx-5 p-4 rounded-2xl mb-3 bg-[#FFF8F0] border border-[#FFE0B2]">
              {dangerIngredients.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} color="#E65100" />
                    <span className="text-sm font-semibold text-[#E65100]">
                      주의 성분
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dangerIngredients.map((ing) => (
                      <span
                        key={ing}
                        className="text-xs px-2 py-0.5 rounded-[6px] font-normal bg-[#FFF3E0] text-[#BF360C]"
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {allergenList.length > 0 && (
                <div
                  className={
                    dangerIngredients.length > 0
                      ? "mt-3 pt-3 border-t border-dashed border-[#FFCC80]"
                      : ""
                  }
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AllergenIcon />
                    <span className="text-sm font-semibold text-[#C62828]">
                      알레르기 유발 성분
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allergenList.map((name) => (
                      <span
                        key={name}
                        className="text-xs px-2 py-0.5 rounded-[6px] font-normal bg-[#FFEBEE] text-[#B71C1C]"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        <div className="mx-5 my-5">
          {/* 4번: 성분 없으면 탭 숨김 */}
          {ingredients.length > 0 && (
            <div className="flex rounded-xl p-1 bg-[#EEEBE4]">
              {[
                { key: "ingredients" as const, label: "전성분 분석" },
                { key: "skintype" as const, label: "피부타입별" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 h-9 rounded-[10px] border-none cursor-pointer transition-all text-[16px] ${
                    activeTab === key
                      ? "bg-white text-text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                      : "bg-transparent text-text-muted font-semibold"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-5 mb-8">
          {/* 4번: 성분 없을 때 안내 */}
          {ingredients.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 flex flex-col items-center gap-2">
              <p className="text-sm font-semibold text-text-muted">
                성분 정보가 없어요
              </p>
              <p className="text-xs text-text-hint text-center leading-relaxed">
                아직 등록된 성분 정보가 없습니다
              </p>
            </div>
          ) : (
            <>
              {activeTab === "ingredients" && (
                <div className="rounded-2xl bg-white overflow-hidden">
                  {/* 제품 설명 — 피그마 순서: 설명 먼저 */}
                  {productData.description && (
                    <div className="p-4 border-b border-[#F5F5F5]">
                      <p className="font-semibold text-text-sub mb-1.5">
                        제품 설명
                      </p>
                      <p className="text-xs text-text-primary leading-[1.7]">
                        {productData.description}
                      </p>
                    </div>
                  )}
                  {/* 전성분 — 펼치기/접기 */}
                  {ingredientsKr.length > 0 && (
                    <div className="p-4 border-b border-[#F5F5F5]">
                      <div className="flex items-center justify-between mb-1.5">
                        <p className="font-semibold text-text-sub">전성분</p>
                        <button
                          onClick={() =>
                            setIsIngredientTextOpen((prev) => !prev)
                          }
                          className="flex items-center gap-0.5 text-xs text-text-muted bg-transparent border-none cursor-pointer"
                        >
                          {isIngredientTextOpen ? (
                            <>
                              접기 <ChevronUp size={13} />
                            </>
                          ) : (
                            <>
                              펼치기 <ChevronDown size={13} />
                            </>
                          )}
                        </button>
                      </div>
                      <p
                        className="text-xs text-text-primary leading-[1.7]"
                        style={
                          isIngredientTextOpen
                            ? undefined
                            : {
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }
                        }
                      >
                        {ingredientsKr.join(", ")}
                      </p>
                    </div>
                  )}
                  {/* 성분 상세 리스트 */}
                  <div>
                    {(isIngredientListOpen
                      ? ingredients
                      : ingredients.slice(0, 3)
                    ).map((ingredient) => {
                      // 5번: ewgScore 우선, 없으면 ewgGrade로 fallback
                      // 정제수(Water;Aqua) — ewgScore 없을 시 1 하드코딩
                      const isWater =
                        ingredient.nameEn
                          ?.toLowerCase()
                          .replace(/\s/g, "")
                          .includes("water") || ingredient.nameKo === "정제수";
                      const resolvedScore: number | null =
                        ingredient.ewgScore ??
                        (isWater
                          ? 1
                          : ingredient.ewgGrade === "low"
                            ? 1
                            : ingredient.ewgGrade === "medium"
                              ? 4
                              : ingredient.ewgGrade === "high"
                                ? 8
                                : null);
                      const ewgColorInfo = getEwgColor(resolvedScore);

                      // functions 쉼표 분리 → 칩 배열
                      const functionChips = ingredient.functions
                        ? ingredient.functions
                            .split(",")
                            .map((f) => f.trim())
                            .filter(Boolean)
                        : [];

                      return (
                        <div
                          key={`${ingredient.position}-${ingredient.nameKo}`}
                          className="flex items-start gap-3 px-4 py-3 not-last:border-b not-last:border-[#F5F5F5]"
                        >
                          {/* EWG 물방울 + 숫자 */}
                          <div className="flex flex-col items-center shrink-0 w-7">
                            <EwgDropIcon color={ewgColorInfo.barColor} />
                            <span
                              className="text-[10px] font-bold mt-0.5"
                              style={{ color: ewgColorInfo.text }}
                            >
                              {resolvedScore ?? "?"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* 성분명 한글 */}
                            <p className="text-sm font-semibold text-text-primary leading-[1.3]">
                              {ingredient.nameKo}
                            </p>
                            {/* 성분명 영문 */}
                            {ingredient.nameEn && (
                              <p className="text-xs text-text-muted my-0.5">
                                {ingredient.nameEn}
                              </p>
                            )}
                            {/* 기능 칩 — 피그마: "피부컨디셔닝제, 용제" */}
                            {functionChips.length > 0 && (
                              <p className="text-xs text-text-hint leading-[1.6] mt-0.5">
                                {functionChips.join(", ")}
                              </p>
                            )}
                          </div>
                          {ingredient.isAllergen && <AllergenIcon />}
                        </div>
                      );
                    })}
                    {ingredients.length > 3 && (
                      <button
                        onClick={() => setIsIngredientListOpen((prev) => !prev)}
                        className="flex items-center justify-center gap-1 w-full py-3 border-t border-[#F5F5F5] bg-transparent border-x-0 border-b-0 cursor-pointer text-xs text-text-muted"
                      >
                        {isIngredientListOpen ? (
                          <>
                            접기 <ChevronUp size={13} />
                          </>
                        ) : (
                          <>
                            전체 {ingredients.length}개 보기{" "}
                            <ChevronDown size={13} />
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeTab === "skintype" && (
                <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
                  {skinTypeScores.map(([label, score]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-text-primary">{label}</span>
                        <span className="font-bold text-brand">{score}</span>
                      </div>
                      <div className="h-1.5 rounded-[3px] bg-bg-muted-warm overflow-hidden">
                        <div
                          className="h-full rounded-[3px] bg-brand transition-[width] duration-600 ease-in-out"
                          style={{ width: `${score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {isScrollTopVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div
            className="relative w-full pointer-events-none"
            style={{ maxWidth: "500px" }}
          >
            <button
              onClick={scrollToTop}
              className="absolute bottom-6 right-4 flex items-center justify-center size-10 rounded-full bg-white/90 backdrop-blur-[10px] border-none cursor-pointer pointer-events-auto transition-all active:scale-[0.93] shadow-[0_2px_12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]"
            >
              <ChevronUp size={20} color="var(--color-product-name)" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from "react";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailInner />
    </Suspense>
  );
}
