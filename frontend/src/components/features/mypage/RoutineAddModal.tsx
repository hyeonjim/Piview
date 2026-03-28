"use client";

import { useState } from "react";
import { X, Search, Package, Loader2, MessageCircleMore } from "lucide-react";
import ProductCard from "@/components/common/ProductCard";
import CompareModal from "@/components/common/CompareModal";
import { useMutation } from "@tanstack/react-query";
import { getRoutineSteps } from "@/constants/routineSteps";
import { Pagination } from "@/components/common/Pagination";
import {
  useProductSearch,
  useProductFilters,
  useLike,
  useDislikedProductsQuery,
} from "@/hooks";
import { useCompare } from "@/hooks/useCompare";
import {
  useUserStore,
  selectGender,
  selectSkinType,
  useRoutineStore,
} from "@/stores";
import { getCategoryDisplayName } from "@/utils/format";
import { toSkinTypeEnum, concernLabelToDb } from "@/utils/enumConvert";
import { mapRecommendResponse } from "@/utils/productMapper";
import type { MappedProduct } from "@/utils/productMapper";
import { productService } from "@/services/product";
import type { RecommendResponseDto } from "@/types/product";
import type { SkinType } from "@/types/user";

interface RoutineAddModalProps {
  /** 현재 열린 스텝 코드 (CL, PR, SR ...) */
  openStep: string;
  /** 현재 draft에 담긴 productId 목록 — 중복 추가 방지용 */
  draftProductIds: number[];
  /** columnId — POST /api/v1/routines/draft 요청에 사용 */
  columnId: number;
  onClose: () => void;
  /** 선택된 제품의 productId를 전달 — page.tsx에서 draft API 호출 */
  onAdd: (productId: number) => void;
}

export default function RoutineAddModal({
  openStep,
  draftProductIds,
  columnId,
  onClose,
  onAdd,
}: RoutineAddModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [inputValue, setInputValue] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [maxKnownPage, setMaxKnownPage] = useState(1);
  const PAGE_SIZE = 7;

  // 피뷰추천 활성화 여부
  const [isRecommendMode, setIsRecommendMode] = useState(false);
  // 추천 API 전체 응답 — 카테고리명 키 기반 (예: { "클렌징폼": [...], "클렌징밤": [...] })
  const [recommendedData, setRecommendedData] = useState<
    Record<string, RecommendResponseDto[]>
  >({});
  // 추천 제품 ID 집합 — PICK 배지 표시 O(1) 조회용
  const [recommendedProductIdSet, setRecommendedProductIdSet] = useState<
    Set<number>
  >(new Set());

  // 좋아요 API 연동 — toggleLike만 사용 (likeList는 ProductCard 내부에서 처리)
  const { toggleLike } = useLike();
  // 비교하기 상태 관리
  const {
    compareItems,
    toggleCompare,
    showCompare,
    openCompare,
    closeCompare,
    canCompare,
  } = useCompare<MappedProduct>();
  // PICK 배지 추적 — 추천 제품 마킹용
  const markAsRecommended = useRoutineStore((state) => state.markAsRecommended);

  // 성별에 따른 루틴 스텝 가져오기
  const currentGender = useUserStore(selectGender);
  // 추천 API 요청에 필요한 유저 피부 타입 및 피부 고민
  const currentSkinType = useUserStore(selectSkinType);
  // concerns는 store에 label값으로 저장됨 — filterMeta.tags.tag도 label값이므로 직접 매칭 가능
  const userConcerns = useUserStore((state) => state.concerns);
  const routineSteps = getRoutineSteps(currentGender);

  // 기피 제품 ID Set — onAddRoutine 숨김용
  const { data: dislikedItems = [] } = useDislikedProductsQuery();
  const dislikedProductIdSet = new Set(dislikedItems.map((d) => d.productId));

  // 현재 루틴 단계 정보
  const currentStep = routineSteps.find((step) => step.code === openStep);
  const currentLabel = currentStep?.label ?? "";

  // 카테고리 필터 메타데이터 가져오기
  const availableCategories = currentStep?.categories ?? [];

  // 카테고리 표시명 alias — 남성 카테고리를 일반 카테고리명으로 통합 표시
  // key: 백엔드/routineSteps 원본 name, value: 탭에 표시할 이름
  const CATEGORY_DISPLAY_ALIAS: Record<string, string> = {
    "에센스/세럼": "에센스/앰플/세럼", // 남성 에센스 → 일반 에센스 탭으로 합침
  };

  // 탭 표시용 — displayName 기준으로 탭 합산
  // backendNames: 이 탭에 매핑되는 백엔드 응답 키 목록 (라운드로빈 필터링에 사용)
  const uniqueCategoryTabs = availableCategories.reduce<
    {
      name: string;
      categoryId: number;
      categoryIds: number[];
      backendNames: string[];
    }[]
  >((acc, cat) => {
    const displayName = CATEGORY_DISPLAY_ALIAS[cat.name] ?? cat.name;
    const existing = acc.find((t) => t.name === displayName);
    if (existing) {
      existing.categoryIds.push(cat.categoryId);
      if (!existing.backendNames.includes(cat.name)) {
        existing.backendNames.push(cat.name);
      }
    } else {
      acc.push({
        name: displayName,
        categoryId: cat.categoryId,
        categoryIds: [cat.categoryId],
        backendNames: [cat.name],
      });
    }
    return acc;
  }, []);

  // 추천 API의 concernId 조회용으로만 filterMeta 사용
  const { data: filterMeta } = useProductFilters();

  // selectedCategoryId가 없거나 현재 목록에 없으면 첫 번째 카테고리를 기본값으로 파생
  const effectiveCategoryId =
    selectedCategoryId !== null &&
    availableCategories.some((cat) => cat.categoryId === selectedCategoryId)
      ? selectedCategoryId
      : (availableCategories[0]?.categoryId ?? null);

  // 실제 제품 검색 API 연동
  const selectedCategory = availableCategories.find(
    (cat) => cat.categoryId === effectiveCategoryId,
  );

  // 선택된 탭 (uniqueCategoryTabs 기준 — 같은 name 묶음)
  const selectedTab =
    uniqueCategoryTabs.find((tab) =>
      tab.categoryIds.includes(effectiveCategoryId ?? -1),
    ) ??
    uniqueCategoryTabs[0] ??
    null;

  const searchParams = {
    q: searchQuery || undefined,
    bigCategoryId: selectedCategory?.bigCategoryId ?? undefined,
    // 선택된 탭의 모든 categoryId 배열로 전달 (남성 복합 탭 대응)
    categoryId: selectedTab
      ? selectedTab.categoryIds
      : effectiveCategoryId
        ? [effectiveCategoryId]
        : undefined,
    page: isRecommendMode ? 0 : currentPage - 1, // 서버 페이지네이션 (0-indexed)
    size: PAGE_SIZE,
  };

  const { products, isLoading, totalCount, hasNext } =
    useProductSearch(searchParams);

  // 피뷰추천 API 뮤테이션 — POST /recommendations/products
  const recommendationMutation = useMutation({
    mutationFn: () => {
      if (!columnId) {
        return Promise.reject(new Error("columnId가 설정되지 않았습니다."));
      }
      const concernId = userConcerns
        .map(
          (concern) =>
            // store.concerns = label값("속건조"), tag.tag = DB값("수분")
            // → concernLabelToDb로 변환 후 비교
            filterMeta?.tags?.find(
              (tag) => tag.tag === concernLabelToDb(concern),
            )?.tagId,
        )
        .find((id) => id !== undefined);
      return productService.getRecommendations({
        skinType: currentSkinType
          ? toSkinTypeEnum(currentSkinType as SkinType)
          : undefined,
        gender: currentGender ?? undefined,
        ...(concernId !== undefined && { concernId }),
        targetRoutineColId: columnId,
      });
    },
    onSuccess: (data) => {
      // 전체 응답을 카테고리명 키 그대로 저장 — 탭 선택 시 필터링용
      setRecommendedData(data);
      // 전체 추천 제품 ID 집합 — PICK 배지 표시용
      const allProducts = Object.values(data).flat();
      setRecommendedProductIdSet(new Set(allProducts.map((p) => p.productId)));
      setIsRecommendMode(true);
      setCurrentPage(1);
    },
    onError: (error) => {
      console.error("피뷰추천 API 실패:", error);
    },
  });

  // 피뷰추천 버튼 클릭 — 추천 모드 토글
  const handleRecommendationToggle = () => {
    if (isRecommendMode) {
      setIsRecommendMode(false);
      setRecommendedData({});
      setRecommendedProductIdSet(new Set());
      setCurrentPage(1);
    } else {
      recommendationMutation.mutate();
    }
  };

  // 추천 모드 — 선택된 탭의 backendNames에 해당하는 키들만 수집 후 라운드로빈
  // 예) 에센스/앰플/세럼 탭(backendNames: [에센스/앰플/세럼, 에센스/세럼])
  //     → 두 키의 데이터를 균등하게 뽑아 5개 구성
  // 예) 클렌징폼 탭(backendNames: [클렌징폼])
  //     → 해당 키 데이터만 5개 이내 표시
  const RECOMMEND_LIMIT = 5;
  const recommendedProducts: MappedProduct[] = isRecommendMode
    ? (() => {
        // 선택된 탭의 백엔드 키 목록으로 소스 배열 수집
        // backendNames가 없으면(tabName 못 찾은 경우) 전체 키 폴백
        const tabBackendNames = selectedTab?.backendNames ?? [];
        const sources =
          tabBackendNames.length > 0
            ? tabBackendNames
                .map((name) => recommendedData[name])
                .filter(
                  (arr): arr is NonNullable<typeof arr> =>
                    !!arr && arr.length > 0,
                )
            : Object.values(recommendedData);

        if (sources.length === 0) return [];

        // 라운드로빈 인터리브 — 각 소스에서 1개씩 번갈아 뽑아 RECOMMEND_LIMIT까지
        const interleaved: (typeof sources)[0] = [];
        const maxLen = Math.max(...sources.map((s) => s.length));
        for (
          let i = 0;
          i < maxLen && interleaved.length < RECOMMEND_LIMIT;
          i++
        ) {
          for (const source of sources) {
            if (interleaved.length >= RECOMMEND_LIMIT) break;
            if (source[i] !== undefined) interleaved.push(source[i]);
          }
        }
        return interleaved.map(mapRecommendResponse);
      })()
    : [];

  // 추천 모드: 클라이언트 페이지네이션 / 일반 모드: 서버 페이지네이션 (검색 페이지와 동일 패턴)
  const displayProducts = isRecommendMode ? recommendedProducts : products;
  const totalPages = isRecommendMode
    ? Math.ceil(recommendedProducts.length / PAGE_SIZE)
    : totalCount !== null
      ? Math.ceil(totalCount / PAGE_SIZE)
      : hasNext
        ? Math.max(maxKnownPage, currentPage) + 1
        : Math.max(maxKnownPage, currentPage);
  // 추천 모드만 클라이언트 slice — 일반 모드는 서버가 이미 PAGE_SIZE만큼 잘라서 줌
  const pagedProducts = isRecommendMode
    ? recommendedProducts.slice(
        (currentPage - 1) * PAGE_SIZE,
        currentPage * PAGE_SIZE,
      )
    : products;

  const handlePageChange = (p: number) => {
    setCurrentPage(p);
    setMaxKnownPage((prev) => Math.max(prev, p));
  };

  // Enter 확정 시에만 API 쿼리 반영
  const handleSearchConfirm = () => {
    setSearchQuery(inputValue);
    setCurrentPage(1);
    setMaxKnownPage(1);
  };
  const handleSearchClear = () => {
    setInputValue("");
    setSearchQuery("");
    setCurrentPage(1);
    setMaxKnownPage(1);
  };

  const handleCategoryChange = (categoryId: number) => {
    setSelectedCategoryId(categoryId);
    setCurrentPage(1);
    setMaxKnownPage(1);
  };

  return (
    <>
      {/* 비교 모달 — RoutineAddModal 위로 (z-[80]) */}
      {showCompare && canCompare && (
        <CompareModal
          compareItems={compareItems as [MappedProduct, MappedProduct]}
          onClose={closeCompare}
        />
      )}

      {/* 배경 오버레이 — 비교모달 열려있으면 비교모달만 닫고, 아니면 루틴추가모달 닫기 */}
      <div
        className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
        onClick={() => {
          if (showCompare) closeCompare();
          else onClose();
        }}
      />
      <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none py-10 px-5">
        <div className="bg-white flex flex-col pointer-events-auto rounded-[20px] w-full max-w-[420px] max-h-full shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden">
          <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
            {/* 헤더 — 타이틀, 피뷰추천 버튼, 닫기 버튼 */}
            <div className="flex items-center justify-between mt-[15px]">
              <h3 className="text-[14px] font-semibold text-[#656563]">
                {currentLabel}
              </h3>
              {/* 우측 버튼 그룹 */}
              <div className="flex items-center gap-2">
                {/* Piview pick 버튼 — 토글 시 활성화 */}
                <button
                  onClick={handleRecommendationToggle}
                  disabled={recommendationMutation.isPending}
                  className={[
                    "flex items-center gap-1 h-8 px-3 rounded-full cursor-pointer text-[14px] font-semibold transition-all duration-200 disabled:cursor-not-allowed active:scale-[0.96] active:shadow-none",
                    isRecommendMode
                      ? "bg-[#f5a9cb] text-[#ffffff] shadow-[0_2px_5px_rgba(166,157,146,0.55),inset_0_1px_0_rgba(255,255,255,0.18)]"
                      : "bg-[#eec4d8] text-[#fdfdfb] shadow-[0_2px_4px_rgba(200,160,180,0.4),inset_0_1px_0_rgba(255,255,255,0.8)] hover:shadow-[0_3px_6px_rgba(200,160,180,0.55)] hover:bg-[#f5a9cb]",
                  ].join(" ")}
                >
                  {recommendationMutation.isPending ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <span className="text-[15px]">⭐</span>
                  )}
                  피뷰 추천
                </button>
                {/* 닫기 버튼 */}
                <button
                  onClick={onClose}
                  className="flex items-center justify-center w-8 h-8 rounded-full bg-[#F5F2EC] border-none cursor-pointer transition-colors hover:bg-[#EAE5DA]"
                >
                  <X size={14} color="#7A6F5C" />
                </button>
              </div>
            </div>
              {isRecommendMode && (
                <div className="flex items-center gap-3 py-2 mt-3 mb-1 px-2 rounded-xl text-[13px] bg-[#f7f1f8] font-semibold text-[#625c63]">
                  {recommendedProducts.length > 0 ? (
                    <>
                      <MessageCircleMore size={14} className="shrink-0" />
                      사용자 맞춤형 {recommendedProducts.length}개 제품 추천
                      <br />
                      (내제품에 등록된 알러지성분 제품 제외)
                    </>
                  ) : (
                    "추천 결과가 없습니다"
                  )}
                </div>
              )}

            {/* 검색바 — 추천 모드에서는 숨김 */}
            {!isRecommendMode && (
              <div className="relative mt-3 mb-3">
                <Search
                  size={16}
                  color="var(--color-text-stone)"
                  className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
                />
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.nativeEvent.isComposing)
                      handleSearchConfirm();
                  }}
                  placeholder="제품명 또는 브랜드 검색"
                  className={[
                    "w-full h-10 pl-9 rounded-xl border border-border-warm bg-[#FAF8F5] text-xs text-[#2A2A2A] outline-none",
                    inputValue ? "pr-9" : "pr-3",
                  ].join(" ")}
                />
                {inputValue && (
                  <button
                    onClick={handleSearchClear}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-border-warm border-none cursor-pointer"
                  >
                    <X size={12} color="#888" />
                  </button>
                )}
              </div>
            )}

            {/* 카테고리 필터 - 현재 루틴 단계의 소분류만 표시 */}
            {uniqueCategoryTabs.length > 0 && (
              <div className="flex flex-wrap gap-2 p-[5px_0px] min-h-[32px] mb-2">
                {uniqueCategoryTabs.map((tab) => {
                  const isActive = tab.categoryIds.includes(
                    effectiveCategoryId ?? -1,
                  );
                  return (
                    <button
                      key={tab.categoryId}
                      onClick={() => {
                        if (!isActive) handleCategoryChange(tab.categoryId);
                      }}
                      className="category-pill-button"
                      data-active={isActive}
                    >
                      {getCategoryDisplayName(tab.name)}
                    </button>
                  );
                })}
              </div>
            )}

            {/* 로딩 상태 — 일반 검색 로딩 또는 추천 API 로딩 */}
            {(isLoading && !isRecommendMode) ||
            recommendationMutation.isPending ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 text-text-muted">
                <Loader2 size={24} className="animate-spin opacity-50" />
                <p className="text-xs">제품을 불러오는 중...</p>
              </div>
            ) : displayProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-[var(--color-text-stone)]">
                <Package size={32} className="mb-2 opacity-50" />
                <p className="text-xs">
                  {isRecommendMode
                    ? "추천 결과가 없습니다"
                    : "검색 결과가 없습니다"}
                </p>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-4">
                  {pagedProducts.map((product) => {
                    const isInCompare = compareItems.some(
                      (item) => item.id === product.id,
                    );

                    return (
                      <ProductCard
                        key={product.id}
                        id={product.id}
                        name={product.name}
                        brand={product.brand}
                        imageUrl={product.imageUrl ?? undefined}
                        category={product.category}
                        skinTypes={product.skinTypes}
                        effects={product.effects}
                        variant="modal"
                        showCategory={false}
                        imageContainerClassName="mt-6"
                        isRecommended={recommendedProductIdSet.has(product.id)}
                        inRoutine={draftProductIds.includes(product.id)}
                        onAddRoutine={
                          dislikedProductIdSet.has(product.id)
                            ? undefined
                            : () => {
                                onAdd(product.id);
                                // 추천 제품인 경우 store에 마킹 (localStorage 동기화)
                                if (recommendedProductIdSet.has(product.id)) {
                                  markAsRecommended(product.id);
                                }
                              }
                        }
                        onToggleLike={() => toggleLike(product.id)}
                        isInCompare={isInCompare}
                        onToggleCompare={() => {
                          const alreadyIn = compareItems.some(
                            (x) => x.id === product.id,
                          );
                          toggleCompare(product);
                          if (!alreadyIn && compareItems.length === 1)
                            openCompare();
                        }}
                      />
                    );
                  })}
                </div>

                {/* 페이지네이션 — 공통 컴포넌트 (검색 페이지와 동일) */}
                <Pagination
                  page={currentPage}
                  totalPages={totalPages}
                  onChange={handlePageChange}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
