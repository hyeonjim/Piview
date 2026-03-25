"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ChevronLeft,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Heart,
  Scale,
  Sparkles,
  Loader2,
  Play,
} from "lucide-react";
import { toast } from "sonner";
import {
  useProductDetail,
  useProductAiSummary,
  useLike,
  useAddMyCos,
  useRemoveMyCos,
  useMyCosQuery,
  useAddDraftItemMutation,
  useRemoveProductFromDraftMutation,
  useDraftQuery,
} from "@/hooks";
import { fromSkinTypeEnum } from "@/utils/enumConvert";

/** EWG 등급 → 배경·텍스트·바 색상 반환 */
function getEwgColor(grade: number | null | undefined): {
  bg: string;
  text: string;
  barColor: string;
} {
  if (grade == null)
    return { bg: "#F5F5F5", text: "#9E9E9E", barColor: "#E0E0E0" };
  if (grade <= 2)
    return { bg: "#E8F5E9", text: "#2E7D32", barColor: "#4CAF50" };
  if (grade <= 6)
    return { bg: "#FFF8E1", text: "#F57F17", barColor: "#FFB300" };
  return { bg: "#FFEBEE", text: "#C62828", barColor: "#F44336" };
}
import { getRoutineSteps } from "@/constants/routineSteps";
import CompareModal from "@/components/common/CompareModal";
import CompareIcon from "@/components/common/CompareIcon";
import { SkinTypeTag } from "@/components/common/ProductCard";
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
    (item) => item.productInfo.productId === productIdNum,
  );
  const owned = !!myCosItem;
  const { toggleLike } = useLike();
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const resolvedIsLiked =
    isLiked !== null ? isLiked : (productData?.liked ?? false);

  const [showRoutineCompare, setShowRoutineCompare] = useState(false);
  const [selectedRoutineProductIndex, setSelectedRoutineProductIndex] =
    useState(0);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const { mutate: addDraftItem } = useAddDraftItemMutation();
  const { mutate: removeDraftItem } = useRemoveProductFromDraftMutation();
  const { data: draftItems = [] } = useDraftQuery();

  const gender = useUserStore(selectGender);
  const routineSteps = getRoutineSteps(gender);

  // AI 요약 — 버튼 클릭 시 refetch()로 수동 호출
  const {
    data: aiSummary,
    isFetching: isAiFetching,
    refetch: fetchAiSummary,
  } = useProductAiSummary(id ? Number(id) : null);

  // 내루틴 비교 — 메인 루틴 API에서 같은 스텝 제품 추출
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
        const currentStepCode = routineSteps.find((step) =>
          step.categories.some((c) => c.name === effectiveCategoryName),
        )?.code;
        if (!currentStepCode) return allMainRoutineProducts;
        return allMainRoutineProducts.filter((p) => {
          const pStepCode = routineSteps.find((step) =>
            step.categories.some((c) => c.name === (p.category ?? "")),
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
      step.categories.some((c) => c.name === (effectiveCategoryName ?? "")),
    );
    const columnId = matchedStep?.columnId ?? 3;
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
    if (myCosItem) removeMyCos(myCosItem.myCosId);
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
  const ANTI_AGING_EXCLUDED_CATEGORIES = new Set([
    "스킨/토너", "로션/에멀젼", "미스트", "토너패드", "선케어", "쉐이빙",
  ]);
  const shouldExcludeAntiAging =
    !!effectiveCategoryName &&
    (ANTI_AGING_EXCLUDED_CATEGORIES.has(effectiveCategoryName) ||
      effectiveCategoryName.startsWith("클렌징"));
  const tags = (productData.tags ?? []).filter(
    (tag) => !(shouldExcludeAntiAging && tag === "안티에이징"),
  );
  const ingredients = productData.ingredients ?? [];
  const ingredientsKr = ingredients
    .map((i) => i.nameKo)
    .filter(Boolean) as string[];

  return (
    <div className="flex flex-col min-h-screen relative bg-[#f9f8f6] pb-nav">
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

      {/* 상단 네비게이션 — 미니멀 화이트 */}
      <div className="flex items-center justify-between px-5 h-12 bg-[#f9f8f6]">
        <button
          onClick={() => router.back()}
          className="size-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer transition-all active:scale-[0.95]"
        >
          <ChevronLeft size={22} color="#2a2118" />
        </button>
        <button
          onClick={() => {
            setIsLiked((prev) => !(prev ?? productData?.liked ?? false));
            toggleLike(id);
          }}
          className="size-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer transition-all active:scale-[0.93]"
        >
          <Heart
            size={24}
            className="transition-all duration-150"
            style={{
              color: resolvedIsLiked ? "#E8715A" : "#d9d5d0",
              fill: resolvedIsLiked ? "#E8715A" : "none",
            }}
          />
        </button>
      </div>

      <div className="pb-8">
        {/* 이미지 카드 — 깔끔한 화이트 배경 */}
        <div className="mx-4 mb-3 rounded-2xl bg-white overflow-hidden" style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 3px 7px rgba(180,155,120,0.09), 0 7px 18px rgba(0,0,0,0.06), 0 14px 32px rgba(180,155,120,0.04)" }}>
          <div className="relative w-full aspect-[2/1]">
            {productData.imageUrl ? (
              <Image
                src={productData.imageUrl}
                alt={productData.productName ?? ""}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-contain p-5"
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

        {/* 제품 정보 섹션 — 깔끔한 화이트 카드 */}
        <div className="mx-4 rounded-2xl bg-white p-5 mb-3 border border-[#f0ede8]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-[13px] text-[#bfb6aa] font-medium mb-1">
                {productData.brandName}
              </p>
              <h1 className="text-[16px] font-semibold text-[#575350] leading-[1.35]">
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
              className="flex items-center gap-1 px-2 h-6.5 rounded-lg border cursor-pointer transition-all active:scale-[0.96] text-[12px] font-medium shrink-0 border-[#dedbd9] bg-[#f7f5f2] text-[#807d7a]"
            >
              <CompareIcon size={13} color="#5c5852" />
              내루틴과 비교하기
            </button>
          </div>

          {(skinTypes.length > 0 || tags.length > 0) && (
            <div className="flex flex-col gap-1 mb-2 mt-3">
              {skinTypes.length > 0 && (
                <div className="flex flex-wrap">
                  {skinTypes.map((st) => (
                    <SkinTypeTag key={st} label={st} />
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block text-[10px] mb-1 mr-1.5 font-medium px-1.5 py-px border rounded-3xl bg-[#fcfcfc] text-[#7a664e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 가격 및 액션 버튼 — 구분선으로 분리 */}
          <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f0ede8]">
            <div className="flex items-baseline gap-1 flex-wrap">
              {productData.price ? (
                <p className="text-[14px] font-semibold text-[#736d66]">
                  ₩{productData.price.toLocaleString()}
                </p>
              ) : (
                <p className="text-[12px] font-normal text-[#bfb6aa]">
                  가격 미정
                </p>
              )}
              {productData.volume && (
                <span className="text-[13px] text-[#bfb6aa] font-normal">
                  / {productData.volume}
                </span>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                  onClick={handleAddRoutine}
                  className={`flex items-center justify-center gap-1 w-22 h-7 rounded-modal border-none cursor-pointer transition-all active:scale-[0.97] text-[13px] font-semibold ${routineAdded ? "bg-(--color-bg-beige) text-(--color-brand)" : "bg-[#f1eae6] text-[#807d7d]"}`}
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
              <button
                onClick={handleToggleOwned}
                className={`flex items-center justify-center gap-1 w-22 h-7 rounded-modal border-none cursor-pointer transition-all active:scale-[0.97] text-[13px] font-semibold ${owned ? "bg-(--color-bg-beige) text-(--color-brand)" : "bg-[#f1eae6] text-[#807d7d]"}`}
              >
                {owned ? (
                  <>
                    <Check size={11} /> 보유중
                  </>
                ) : (
                  <>
                    <Plus size={11} /> 보유추가
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {recommendReason && (
          <div className="mx-4 rounded-2xl bg-white p-5 mb-3 border border-[#f0ede8]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="size-7 rounded-full flex items-center justify-center bg-[#f5f3f0] shrink-0">
                <Sparkles size={14} className="text-[#a69d92]" />
              </div>
              <p className="font-semibold text-[#6e6358] text-[14px]">추천 이유</p>
            </div>
            <p className="text-[13px] text-[#2a2118] leading-[1.7] pl-[22px]">
              {recommendReason}
            </p>
          </div>
        )}

        {/* AI 요약 카드 */}
        <div className="mx-5 rounded-2xl bg-white p-4 my-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[16px] font-semibold text-[#636262]">
              AI 분석
            </p>
            {!aiSummary && (
              <button
                onClick={() => fetchAiSummary()}
                disabled={isAiFetching}
                className="flex items-center gap-1 px-3 h-7 rounded-lg border-2 bg-[#eee7d8] text-[#555454] text-[14px] font-semibold cursor-pointer disabled:opacity-50 transition-all active:scale-[0.96]"
              >
                {isAiFetching ? "분석 중..." : <><Play size={12} fill="currentColor" /> Start</>}
              </button>
            )}
          </div>

          {isAiFetching && (
            <div className="flex items-center justify-center py-6 gap-2 text-text-muted">
              <Loader2 size={18} className="animate-spin opacity-50" />
              <p className="text-xs">AI가 제품을 분석하고 있어요...</p>
            </div>
          )}

          {aiSummary && !isAiFetching && (
            <div className="flex flex-col gap-3">
              {aiSummary.line1AiSummary && (
                <p className="text-xs text-text-primary leading-[1.6]">
                  {aiSummary.line1AiSummary}
                </p>
              )}
              {aiSummary.line2PersonalizedMsg && (
                <p className="text-xs text-brand leading-[1.6] font-semibold">
                  {aiSummary.line2PersonalizedMsg}
                </p>
              )}
              {aiSummary.line3AiSummary && (
                <p className="text-xs text-text-primary leading-[1.6]">
                  {aiSummary.line3AiSummary}
                </p>
              )}
            </div>
          )}

          {!aiSummary && !isAiFetching && (
            <p className="text-xs text-text-muted">
              버튼을 눌러 이 제품의 AI 분석 요약을 확인해보세요.
            </p>
          )}
        </div>

        {ingredients.length > 0 && (
          <div
            ref={ewgSectionRef}
            className="mx-4 rounded-2xl bg-white p-5 mb-3 border border-[#f0ede8]"
            style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}
          >
            <div className="mb-3">
              <p className="text-[15px] font-semibold text-[#58514b]">
                EWG 성분 분석
              </p>
              <p className="text-[12px] text-[#a69d92] mt-0.5">총 {total}개 성분</p>
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
                  <p className="text-[11px] text-[#a69d92] mb-0.5">
                    • {grade.label}
                  </p>
                  <p
                    className="text-[18px] font-bold"
                    style={{ color: grade.color }}
                  >
                    {grade.count}
                  </p>
                  <p className="text-[12px] text-[#bfb6aa] mt-0.5">
                    {grade.sub}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {ingredients.length > 0 &&
          (dangerIngredients.length > 0 || allergenList.length > 0) && (
            <div className="mx-4 p-4 rounded-2xl mb-3 bg-[#FFFAF5] border border-[#f5e6d5]">
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

        <div className="mx-4 my-4">
          {/* 4번: 성분 없으면 탭 숨김 */}
          {ingredients.length > 0 && (
            <div className="flex rounded-xl p-1 bg-[#f0ede8]">
              {[
                { key: "ingredients" as const, label: "전성분 분석" },
                { key: "skintype" as const, label: "피부타입별" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={`flex-1 h-9 rounded-[10px] border-none cursor-pointer transition-all text-[14px] ${
                    activeTab === key
                      ? "bg-white text-[#4d433a] font-semibold shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
                      : "bg-transparent text-[#80776c] font-medium"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="mx-4 mb-8">
          {/* 4번: 성분 없을 때 안내 */}
          {ingredients.length === 0 ? (
            <div className="rounded-2xl bg-white p-6 flex flex-col items-center gap-2 border border-[#f0ede8]">
              <p className="text-[14px] font-medium text-[#a69d92]">
                성분 정보가 없어요
              </p>
              <p className="text-[12px] text-[#bfb6aa] text-center leading-relaxed">
                아직 등록된 성분 정보가 없습니다
              </p>
            </div>
          ) : (
            <>
              {activeTab === "ingredients" && (
                <div className="rounded-2xl bg-white overflow-hidden border border-[#f0ede8]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  {/* 제품 설명 */}
                  {productData.description && (
                    <div className="p-5 border-b border-[#f5f3f0]">
                      <p className="font-semibold text-[#6e6358] text-[14px] mb-2">
                        제품 설명
                      </p>
                      <p className="text-[13px] text-[#2a2118] leading-[1.7]">
                        {productData.description}
                      </p>
                    </div>
                  )}
                  {ingredientsKr.length > 0 && (
                    <div className="p-5 border-b border-[#f5f3f0]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-[#6e6358] text-[14px]">전성분</p>
                        <button
                          onClick={() =>
                            setIsIngredientTextOpen((prev) => !prev)
                          }
                          className="flex items-center gap-0.5 text-[12px] text-[#a69d92] bg-transparent border-none cursor-pointer"
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
                        className="text-[12px] text-[#6e6358] leading-[1.8]"
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
                  <div>
                    {(isIngredientListOpen
                      ? ingredients
                      : ingredients.slice(0, 3)
                    ).map((ingredient) => {
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
                      const functionChips = ingredient.functions
                        ? ingredient.functions
                            .split(",")
                            .map((f) => f.trim())
                            .filter(Boolean)
                        : [];

                      return (
                        <div
                          key={`${ingredient.position}-${ingredient.nameKo}`}
                          className="flex items-start gap-3 px-5 py-3.5 not-last:border-b not-last:border-[#f5f3f0]"
                        >
                          <div className="flex flex-col items-center shrink-0 w-7">
                            <EwgDropIcon color={ewgColorInfo.barColor} />
                            <span
                              className="text-[10px] font-semibold mt-0.5"
                              style={{ color: ewgColorInfo.text }}
                            >
                              {resolvedScore ?? "?"}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            {/* 성분명 한글 */}
                            <p className="text-[13px] font-semibold text-[#2a2118] leading-[1.3]">
                              {ingredient.nameKo}
                            </p>
                            {ingredient.nameEn && (
                              <p className="text-[11px] text-[#bfb6aa] my-0.5">
                                {ingredient.nameEn}
                              </p>
                            )}
                            {/* 기능 칩 */}
                            {functionChips.length > 0 && (
                              <p className="text-[11px] text-[#a69d92] leading-[1.6] mt-0.5">
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
                        className="flex items-center justify-center gap-1 w-full py-3.5 border-t border-[#f5f3f0] bg-transparent border-x-0 border-b-0 cursor-pointer text-[12px] text-[#a69d92]"
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
                <div className="rounded-2xl bg-white p-5 flex flex-col gap-5 border border-[#f0ede8]" style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                  {skinTypeScores.map(([label, score]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[14px] text-[#2a2118] font-medium">{label}</span>
                        <span className="text-[14px] font-semibold text-[#a69d92]">{score}</span>
                      </div>
                      <div className="h-[5px] rounded-full bg-[#f0ede8] overflow-hidden">
                        <div
                          className="h-full rounded-full bg-[#a69d92] transition-[width] duration-600 ease-in-out"
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
              className="absolute bottom-6 right-4 flex items-center justify-center size-10 rounded-full bg-white border border-[#e8e4e0] cursor-pointer pointer-events-auto transition-all active:scale-[0.93]"
              style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.06)" }}
            >
              <ChevronUp size={18} color="#5a504a" />
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
