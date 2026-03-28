"use client";

import { Suspense, useState, useRef, useEffect } from "react";
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
  MessageSquareText,
  Loader2,
  MessageSquareWarning,
  Ban,
} from "lucide-react";
import { motion, AnimatePresence, type Variants } from "framer-motion";
import { toast } from "sonner";
import {
  useProductDetail,
  useProductAiSummary,
  useLike,
  useAddMyCos,
  useRemoveMyCos,
  useMyCosQuery,
  useDislikedProductsQuery,
  useAddDraftItemMutation,
  useRemoveProductFromDraftMutation,
  useDraftQuery,
  useMainRoutineQuery,
} from "@/hooks";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import { shouldExcludeAntiAging } from "@/utils/productMapper";
import { trackEvent } from "@/utils/trackEvent";
import { getRoutineSteps } from "@/constants/routineSteps";
import CompareModal from "@/components/common/CompareModal";
import CompareIcon from "@/components/common/CompareIcon";
import EWGIndicator from "@/components/common/EWGIndicator";
import { SkinTypeTag } from "@/components/common/ProductCard";
import type { ProductViewModel } from "@/types/product/myCos";
import { useUserStore, selectGender } from "@/stores";

/** EWG 등급 → 바 색상 반환 */
function getEwgBarColor(grade: number | null | undefined): string {
  if (grade == null) return "#E0E0E0";
  if (grade <= 2) return "var(--color-ewg-safe)";
  if (grade <= 6) return "var(--color-ewg-caution)";
  return "var(--color-ewg-danger)";
}

/** 성분의 EWG 점수 결정 — ewgScore 우선, 없으면 ewgGrade 문자열로 추정, 정제수는 1로 고정 */
function resolveIngredientEwgScore(ingredient: {
  ewgScore?: number | null;
  ewgGrade?: string | null;
  nameKo?: string | null;
  nameEn?: string | null;
}): number | null {
  if (ingredient.ewgScore != null) return ingredient.ewgScore;
  const isWater =
    ingredient.nameEn?.toLowerCase().replace(/\s/g, "").includes("water") ||
    ingredient.nameKo === "정제수";
  if (isWater) return 1;
  if (ingredient.ewgGrade === "low") return 1;
  if (ingredient.ewgGrade === "medium") return 4;
  if (ingredient.ewgGrade === "high") return 8;
  return null;
}

/** 알레르기 유발 성분 표시 아이콘 */
function AllergenIcon({ size = 14 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center shrink-0 self-center rounded-full">
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="var(--color-danger)" />
        <rect x="11" y="6.5" width="2" height="7" rx="1" fill="white" />
        <circle cx="12" cy="17" r="1.3" fill="white" />
      </svg>
    </div>
  );
}

/** EWG 점수를 물방울 모양으로 표시하는 아이콘 */
function EwgDropIcon({ color, score }: { color: string; score: number | null }) {
  return (
    <div
      className="flex items-center justify-center w-7 h-7 text-white font-bold shrink-0"
      style={{
        backgroundColor: color,
        /* 물방울 모양 — border-radius 단축 표기로 구현 불가 */
        borderRadius: "20% 50% 50% 50%",
        fontSize: score !== null && score >= 10 ? "10px" : "13px",
      }}
    >
      {score ?? "?"}
    </div>
  );
}

// AI 카드 전체 — 3D 입체감 + 아래서 위로 fade in
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, rotateX: 6 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    rotateX: 0,
    transition: { duration: 0.55, ease: [0.23, 1, 0.32, 1] },
  },
};

// 컨텐츠 줄 — stagger 부모
const listVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.15 } },
};

// 각 줄 — fade + 살짝 위로 + scale
const itemVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.97 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } },
};


/** 피부타입별 점수 표시 순서 */
const SKIN_TYPE_ORDER = ["dry", "oily", "combination", "subuji"];



function ProductDetailInner() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

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

  // 기피 제품 여부 — true이면 루틴추가 버튼 숨김
  const { data: dislikedItems = [] } = useDislikedProductsQuery();
  const isDisliked = dislikedItems.some((d) => d.productId === productIdNum);

  const { toggleLike } = useLike();
  const [isLiked, setIsLiked] = useState<boolean | null>(null);
  const resolvedIsLiked = isLiked !== null ? isLiked : (productData?.liked ?? false);

  const [showRoutineCompare, setShowRoutineCompare] = useState(false);
  const [selectedRoutineProductIndex, setSelectedRoutineProductIndex] = useState(0);
  const [showCompareModal, setShowCompareModal] = useState(false);

  const { mutate: addDraftItem } = useAddDraftItemMutation();
  const { mutate: removeDraftItem } = useRemoveProductFromDraftMutation();
  const { data: draftItems = [] } = useDraftQuery();

  const gender = useUserStore(selectGender);
  const routineSteps = getRoutineSteps(gender);

  // 내 알러지 성분 이름 Set — O(1) 조회용
  const myAllergyNames = new Set(
    useUserStore((s) => s.avoidContents).map((a) => a.avoidContent),
  );

  // AI 요약 — 상세 페이지 진입 시 자동 호출
  const {
    data: aiSummary,
    isLoading: isAiLoading,
    isError: isAiError,
  } = useProductAiSummary(id ? Number(id) : null);

  // 내루틴 비교 — 메인 루틴 API에서 같은 스텝 제품 추출
  const { data: mainRoutineData } = useMainRoutineQuery();

  const categoryFromUrl = searchParams.get("category");
  const effectiveCategoryName =
    productData?.categoryName ?? categoryFromUrl ?? null;

  const allMainRoutineProducts: ProductViewModel[] =
    mainRoutineData?.steps.flatMap((step) =>
      step.products.map((routineProduct) => ({
        id: routineProduct.product.productId,
        name: routineProduct.product.name ?? "",
        brand: routineProduct.product.brandName ?? "",
        category: routineProduct.product.categoryName ?? "",
        imageUrl: routineProduct.product.imageUrl ?? null,
        skinTypes: (routineProduct.product.skinTypes ?? []).map(fromSkinTypeEnum),
        effects: routineProduct.product.tags ?? [],
        emoji: "🧴",
      })),
    ) ?? [];

  const sameCategoryRoutineProducts = effectiveCategoryName
    ? (() => {
        const currentStepCode = routineSteps.find((step) =>
          step.categories.some((category) => category.name === effectiveCategoryName),
        )?.code;
        if (!currentStepCode) return allMainRoutineProducts;
        return allMainRoutineProducts.filter((product) => {
          const productStepCode = routineSteps.find((step) =>
            step.categories.some((category) => category.name === (product.category ?? "")),
          )?.code;
          return productStepCode === currentStepCode;
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

  const [activeTab, setActiveTab] = useState<"ingredients" | "skintype">("ingredients");
  const [isIngredientListOpen, setIsIngredientListOpen] = useState(false);
  const [isIngredientTextOpen, setIsIngredientTextOpen] = useState(false);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);
  const ewgSectionRef = useRef<HTMLDivElement>(null);

  // VIEW_PRODUCT 이벤트 — 상세 데이터 로드 완료 시 1회 전송
  useEffect(() => {
    if (productIdNum && !isLoading && !isError) {
      trackEvent("VIEW_PRODUCT", productIdNum);
    }
  }, [productIdNum, isLoading, isError]);

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
      step.categories.some((category) => category.name === (effectiveCategoryName ?? "")),
    );
    const columnId = matchedStep?.columnId ?? 3;
    addDraftItem(
      { columnId, productId: productIdNum },
      {
        onSuccess: () => toast(`✓ ${productData.productName} 루틴에 추가됨!`),
        onError: () => toast.error("루틴 추가에 실패했어요. 다시 시도해 주세요."),
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

  const allergenList = productData.allergenIngredients ?? [];
  const dangerIngredients = productData.cautionIngredients ?? [];

  const skinTypeScores = SKIN_TYPE_ORDER.filter(
    (key) => productData.skinTypeScores?.[key] !== undefined,
  ).map(
    (key) =>
      [fromSkinTypeEnum(key), productData.skinTypeScores[key]] as [string, number],
  );

  const skinTypes = (productData.skinTypes ?? []).map(fromSkinTypeEnum);

  const tags = (productData.tags ?? []).filter(
    (tag) => !(shouldExcludeAntiAging(effectiveCategoryName ?? undefined) && tag === "안티에이징"),
  );

  const ingredients = productData.ingredients ?? [];
  const ingredientsKorean = ingredients
    .map((ingredient) => ingredient.nameKo)
    .filter(Boolean) as string[];

  return (
    <div className="flex flex-col min-h-screen relative bg-[#f9f8f6] pb-nav">
      {showCompareModal && selectedRoutineCompare && (
        <CompareModal
          compareItems={[selectedRoutineCompare, currentProductAsCompare]}
          onClose={() => setShowCompareModal(false)}
          isRoutineCompare
        />
      )}

      {/* 루틴 비교 — 비교할 제품이 없을 때 안내 바텀시트 */}
      {showRoutineCompare && sameCategoryRoutineProducts.length === 0 && (
        <div
          className="fixed inset-0 z-60 flex flex-col justify-end items-center bg-black/45 backdrop-blur-sm"
          onClick={() => setShowRoutineCompare(false)}
        >
          <div
            className="relative bg-white rounded-t-2xl flex flex-col w-full max-w-app"
            onClick={(event) => event.stopPropagation()}
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

      {/* 루틴 비교 — 비교할 제품이 여러 개일 때 선택 바텀시트 */}
      {showRoutineCompare && sameCategoryRoutineProducts.length > 1 && (
        <div
          className="fixed inset-0 z-70 flex flex-col justify-end items-center bg-black/45 backdrop-blur-sm"
          onClick={() => setShowRoutineCompare(false)}
        >
          <div
            className="relative bg-white rounded-t-2xl flex flex-col w-full max-w-app"
            onClick={(event) => event.stopPropagation()}
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
            <div className="px-15 py-5 pb-8 flex flex-col gap-1">
              {sameCategoryRoutineProducts.map((routineProduct, index) => (
                <button
                  key={routineProduct.id}
                  onClick={() => setSelectedRoutineProductIndex(index)}
                  className={`flex items-center gap-3 px-3 py-3 rounded-xl border cursor-pointer transition-all active:scale-[0.98] text-left ${
                    selectedRoutineProductIndex === index
                      ? "border-[#a2aa7b] bg-product-routine-badge-bg"
                      : "border-[#E8E4DF] bg-(--color-bg-card)"
                  }`}
                >
                  {/* 제품 이미지 — 없으면 이모지 폴백 */}
                  {routineProduct.imageUrl ? (
                    <Image
                      src={routineProduct.imageUrl}
                      alt={routineProduct.name}
                      width={60}
                      height={60}
                      className="rounded-lg object-cover shrink-0"
                    />
                  ) : (
                    <span className="text-2xl">{routineProduct.emoji}</span>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-text-primary">
                      {routineProduct.brand}
                    </p>                    
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                      {routineProduct.name}
                    </p>
                  </div>
                  {selectedRoutineProductIndex === index && (
                    <Check size={16} className="text-[#a2aa7b] shrink-0" />
                  )}
                </button>
              ))}
              <button
                onClick={() => {
                  setShowRoutineCompare(false);
                  setShowCompareModal(true);
                }}
                className="mt-2 w-60 h-11 rounded-xl border-none cursor-pointer text-sm font-bold text-white bg-[#c5cba5] self-center"
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
            setIsLiked((previous) => !(previous ?? productData?.liked ?? false));
            toggleLike(id);
          }}
          className="size-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer transition-all active:scale-[0.93]"
        >
          <Heart
            size={24}
            className="transition-all duration-150"
            style={{
              color: resolvedIsLiked ? "#f69d8d" : "#d9d5d0",
              fill: resolvedIsLiked ? "#f69d8d" : "none",
            }}
          />
        </button>
      </div>

      <div className="pb-8">
        {/* 제품 이미지 카드 */}
        <div
          className="mx-4 mb-3 rounded-2xl bg-white overflow-hidden"
          style={{ boxShadow: "0 1px 2px rgba(0,0,0,0.04), 0 3px 7px rgba(180,155,120,0.09), 0 7px 18px rgba(0,0,0,0.06), 0 14px 32px rgba(180,155,120,0.04)" }}
        >
          <div className="relative w-full aspect-[2/1]">
            {productData.imageUrl ? (
              <Image
                src={productData.imageUrl}
                alt={productData.productName ?? ""}
                fill
                sizes="(max-width: 640px) 100vw, 640px"
                className="object-contain p-5"
              />
            ) : (
              <span className="absolute inset-0 flex items-center justify-center text-[80px]">
                🧴
              </span>
            )}
          </div>
        </div>

        {/* 제품 정보 섹션 */}
        <div className="mx-4 rounded-2xl bg-white p-5 mb-3 border border-[#f0ede8] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
          <div className="flex items-start justify-between gap-2">
            <div>
              {effectiveCategoryName && (
                <span className="text-[12px] text-[#8b8276] bg-[#f5f2ef] px-1.5 py-0.5 rounded-full font-semibold mb-2 inline-block">
                  {effectiveCategoryName}
                </span>
              )}
              <p className="text-[14px] text-[#80715e] font-semibold">
                {productData.brandName}
              </p>
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
              className="flex items-center gap-1 px-3 h-7 rounded-lg cursor-pointer transition-all active:scale-[0.96] text-[14px] font-normal shrink-0 bg-[#eff6fa] text-[#686a6c]"
            >
              <CompareIcon size={13} color="#5c5852" />
              내루틴과 비교하기
            </button>
          </div>
          <h1 className="text-[17px] font-bold text-[#797572] mb-2">
            {productData.productName}
          </h1>

          {(skinTypes.length > 0 || tags.length > 0) && (
            <div className="flex flex-col gap-1 mb-3 mt-3">
              {skinTypes.length > 0 && (
                <div className="flex flex-wrap">
                  {skinTypes.map((skinType) => (
                    <SkinTypeTag key={skinType} label={skinType} />
                  ))}
                </div>
              )}
              {tags.length > 0 && (
                <div className="flex flex-wrap">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-block text-[12px] mb-1 mr-1.5 font-medium px-1.5 py-px border rounded-3xl bg-[#fcfcfc] text-[#7a664e]"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 가격 및 액션 버튼 */}
          <div className="flex items-center justify-between gap-2 pt-4 border-t border-[#f0ede8]">
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
                <span className="text-[14px] text-[#a99b89] font-normal">
                  / {productData.volume}
                </span>
              )}
            </div>
            <div className="flex gap-2 shrink-0">
              {!isDisliked && (
                <button
                  onClick={handleAddRoutine}
                  className={`flex items-center justify-center gap-1 w-22 h-7 rounded-modal border-none cursor-pointer transition-all active:scale-[0.97] text-[13px] font-semibold ${routineAdded ? "bg-(--color-bg-beige) text-[#9b9a99]" : "bg-[#f7eae3] text-[#636260]"}`}
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
                className={`flex items-center justify-center gap-1 w-22 h-7 rounded-modal border-none cursor-pointer transition-all active:scale-[0.97] text-[13px] font-semibold ${owned ? "bg-(--color-bg-beige) text-[#9b9a99]" : "bg-[#f7eae3] text-[#636260]"}`}
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


        {/* AI 요약 카드 — 상세 진입 시 자동 로드 (입체감 효과) */}
        <motion.div
          variants={cardVariants}
          initial="hidden"
          animate="visible"
          className="mx-4 rounded-2xl p-5 my-5 border border-2 border-[#dde6ef] bg-[#f8fafb]"
          style={{
            boxShadow: "0 1px 0 rgba(255,255,255,0.9) inset, 0 4px 16px rgba(115, 142, 174, 0.14), 0 1px 4px rgba(115, 142, 174, 0.08)",
          }}
        >
          <div className="flex items-center gap-2 mb-5">
            <div className="size-6 rounded-lg flex items-center justify-center bg-[#b8cbdb]">
              <MessageSquareText size={12} className="text-white" />
            </div>
            <p className="text-[16px] font-bold text-[#5a5d60]">AI 분석</p>
          </div>

          {isAiLoading && (
            <div className="flex items-center justify-center py-6 gap-2 text-text-muted">
              <Loader2 size={18} className="animate-spin opacity-50" />
              <p className="text-xs">AI가 제품을 분석하고 있어요...</p>
            </div>
          )}

          {isAiError && !isAiLoading && (
            <p className="text-xs text-text-muted">
              AI 분석을 불러오지 못했어요.
            </p>
          )}

          <AnimatePresence>
            {aiSummary && !isAiLoading && (
              <motion.div
                variants={listVariants}
                initial="hidden"
                animate="visible"
                className="flex flex-col gap-2.5"
              >
                {aiSummary.line1AiSummary && (
                  <motion.p variants={itemVariants} className="text-[15px] text-[#454c52] leading-[1.7]">
                    {aiSummary.line1AiSummary}
                    <br />{aiSummary.line2PersonalizedMsg}
                  </motion.p>
                )}
                {aiSummary.line3AiSummary && (
                  <motion.div
                    className="mt-2 rounded-xl bg-[#fcfbfb] border border-[#f5dfdf] px-3 py-2.5"
                  >
                    <p className="text-[14px] text-[#aa4646] leading-[1.6] flex items-start gap-1.5">
                      <MessageSquareWarning size={14} className="shrink-0 mt-0.5" />
                      {aiSummary.line3AiSummary}
                    </p>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* EWG 성분 분석 카드 */}
        {ingredients.length > 0 && (
          <div
            ref={ewgSectionRef}
            className="mx-4 rounded-2xl bg-white p-5 mb-3 border border-[#f0ede8] shadow-[0_1px_3px_rgba(0,0,0,0.02)]"
          >
            <EWGIndicator
              variant="detail"
              safe={productData.lowCount ?? 0}
              caution={productData.mediumCount ?? 0}
              danger={productData.highCount ?? 0}
              unknown={productData.unknownCount ?? 0}
            />
          </div>
        )}

        {/* 주의 성분 / 알레르기 유발 성분 카드 */}
        {ingredients.length > 0 &&
          (dangerIngredients.length > 0 || allergenList.length > 0) && (
            <div className="mx-4 p-4 rounded-2xl mb-3 bg-[#f9f9f8] border border-[#f2ede7]">
              {dangerIngredients.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle size={14} color="#E65100" />
                    <span className="text-sm font-semibold text-[#E65100]">
                      주의 성분
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {dangerIngredients.map((ingredientName) => (
                      <span
                        key={ingredientName}
                        className="text-xs px-2 py-0.5 rounded-[6px] font-normal bg-[#fbf5eb] text-[#BF360C]"
                      >
                        {ingredientName}
                      </span>
                    ))}
                  </div>
                </>
              )}
              {allergenList.length > 0 && (
                <div
                  className={
                    dangerIngredients.length > 0
                      ? "mt-3 pt-3 border-t border-solid border-[#f0e8db]"
                      : ""
                  }
                >
                  <div className="flex items-center gap-2 mb-2">
                    <AllergenIcon />
                    <span className="text-sm font-semibold text-[#C62828] flex items-center gap-1">
                      알레르기 유발 성분(보유한 알러지는 <Ban size={13} /> 표시)
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {allergenList.map((name) => (
                      <span
                        key={name}
                        className="text-xs px-2 py-0.5 rounded-[6px] font-normal bg-[#fcf2f3] text-[#af1717] inline-flex items-center gap-1"
                      >
                        {myAllergyNames.has(name) && (
                          <Ban size={10} />
                        )}
                        {name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        {/* 탭 — 성분 없으면 숨김 */}
        <div className="mx-4 my-4">
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
          {/* 성분 정보 없을 때 안내 */}
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
                <div className="rounded-2xl bg-white overflow-hidden border border-[#f0ede8] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  {/* 제품 설명 */}
                  {productData.description && (
                    <div className="p-5 border-b border-[#f5f3f0]">
                      <p className="font-bold text-[#474441] text-[14px] mb-2">
                        제품 설명
                      </p>
                      <p className="text-[13px] text-[#2a2118] font-medium leading-[1.7]">
                        {productData.description.split("-").map((line, index) => (
                          <span key={index}>
                            {index > 0 && <><br />-</>}
                            {line}
                          </span>
                        ))}
                      </p>
                    </div>
                  )}
                  {/* 전성분 텍스트 */}
                  {ingredientsKorean.length > 0 && (
                    <div className="p-5 border-b border-[#f5f3f0]">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-bold text-[#474441] text-[14px]">전성분</p>
                        <button
                          onClick={() => setIsIngredientTextOpen((previous) => !previous)}
                          className="flex items-center gap-0.5 text-[13px] text-[#514d49] bg-transparent border-none cursor-pointer"
                        >
                          {isIngredientTextOpen ? (
                            <>접기 <ChevronUp size={13} /></>
                          ) : (
                            <>펼치기 <ChevronDown size={13} /></>
                          )}
                        </button>
                      </div>
                      {/* webkit-line-clamp — Tailwind line-clamp-2로 구현 */}
                      <p className={`text-[13px] text-[#313030] leading-[1.8] ${isIngredientTextOpen ? "" : "line-clamp-2"}`}>
                        {ingredientsKorean.join(", ")}
                      </p>
                    </div>
                  )}
                  {/* 성분 목록 */}
                  <div>
                    {(isIngredientListOpen ? ingredients : ingredients.slice(0, 3)).map((ingredient) => {
                      const resolvedScore = resolveIngredientEwgScore(ingredient);
                      const ewgBarColor = getEwgBarColor(resolvedScore);
                      const functionChips = ingredient.functions
                        ? ingredient.functions
                            .split(",")
                            .map((functionText) => functionText.trim())
                            .filter(Boolean)
                        : [];

                      return (
                        <div
                          key={`${ingredient.position}-${ingredient.nameKo}`}
                          className="flex items-start gap-3 px-5 py-3.5 not-last:border-b not-last:border-[#f5f3f0]"
                        >
                          <div className="flex flex-col items-center shrink-0 w-7">
                            <EwgDropIcon color={ewgBarColor} score={resolvedScore} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[14px] font-semibold text-[#45403a] leading-[1.6] flex items-center gap-1">
                              {ingredient.nameKo && myAllergyNames.has(ingredient.nameKo) && (
                                <Ban size={13} className="shrink-0 text-[#af1717]" />
                              )}
                              {ingredient.nameKo}
                            </p>
                            {ingredient.nameEn && (
                              <p className="text-[12px] text-[#aea08e] mb-0.5">
                                {ingredient.nameEn}
                              </p>
                            )}
                            {functionChips.length > 0 && (
                              <p className="text-[13px] text-[#656360] font-medium leading-[1.6] mt-0.5">
                                {functionChips.join(", ")}
                              </p>
                            )}
                          </div>
                          {ingredient.isAllergen && <AllergenIcon size={20} />}
                        </div>
                      );
                    })}
                    {ingredients.length > 3 && (
                      <button
                        onClick={() => setIsIngredientListOpen((previous) => !previous)}
                        className="flex items-center justify-center gap-1 w-full py-3.5 border-t border-[#f5f3f0] bg-transparent border-x-0 border-b-0 cursor-pointer text-[12px] text-[#a69d92]"
                      >
                        {isIngredientListOpen ? (
                          <>접기 <ChevronUp size={13} /></>
                        ) : (
                          <>전체 {ingredients.length}개 보기 <ChevronDown size={13} /></>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              )}

              {/* 피부타입별 점수 탭 */}
              {activeTab === "skintype" && (
                <div className="rounded-2xl bg-white p-5 flex flex-col gap-5 border border-[#f0ede8] shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                  {skinTypeScores.map(([label, score]) => (
                    <div key={label}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[14px] text-[#2a2118] font-medium">{label}</span>
                        <span className="text-[14px] font-semibold text-[#a69d92]">{score}</span>
                      </div>
                      <div className="h-[5px] rounded-full bg-[#f0ede8] overflow-hidden">
                        {/* width가 동적이라 style 사용 */}
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

      {/* 스크롤 상단 이동 버튼 */}
      {isScrollTopVisible && (
        <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pointer-events-none">
          <div className="relative w-full max-w-app pointer-events-none">
            <button
              onClick={scrollToTop}
              className="absolute bottom-6 right-4 flex items-center justify-center size-10 rounded-full bg-white border border-[#e8e4e0] cursor-pointer pointer-events-auto transition-all active:scale-[0.93] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
            >
              <ChevronUp size={18} color="#5a504a" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailInner />
    </Suspense>
  );
}
