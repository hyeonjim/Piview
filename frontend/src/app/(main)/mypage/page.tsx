"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  useDraftQuery,
  useAddDraftItemMutation,
  useMyCosQuery,
  useRemoveMyCos,
  useUserQuery,
} from "@/hooks";
import RoutineTab from "@/components/features/mypage/RoutineTab";
import RoutineAddModal from "@/components/features/mypage/RoutineAddModal";
import OwnedTab from "@/components/features/mypage/OwnedTab";
import AvoidProductModal from "@/components/features/mypage/AvoidProductModal";
import { useRoutineStore } from "@/stores";
import { useUserStore, selectSkinType, selectGender } from "@/stores";
import { useSearchStore } from "@/stores/useSearchStore";
import { useRecommendStore } from "@/stores/useRecommendStore";
import { useLikeStore } from "@/stores";
import { authService } from "@/services/auth";
import type { ProductViewModel } from "@/types/product/myCos";
import { fromSkinTypeEnum } from "@/utils/enumConvert";

export default function MyPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"routine" | "owned">("routine");

  // 페이지 로드 시 user 정보 조회 + Zustand store 동기화
  useUserQuery();
  const userName = useUserStore((store) => store.user?.name ?? "User");
  const profileImageUrl = useUserStore((store) => store.user?.imageUrl ?? null);

  // 개발 도구 - 성별별 루틴 확인용 (나중에 삭제 예정)
  const currentGender = useUserStore(selectGender);
  const toggleGender = useUserStore((store) => store.toggleGenderForTest);

  const savedSkinType = useUserStore(selectSkinType);
  const savedConcerns = useUserStore((store) => store.concerns);
  const savedAvoidContents = useUserStore((store) => store.avoidContents);
  const hasSkinProfile = !!savedSkinType;

  const handleLogout = async () => {
    try {
      await authService.logout();
    } finally {
      // 유저
      useUserStore.getState().clearUser();
      // 검색/추천/찜 — 다른 계정 로그인 시 이전 상태 잔존 방지
      useSearchStore.getState().setSearchQuery("");
      useSearchStore.getState().resetFilter();
      useRecommendStore.getState().setSearchQuery("");
      useRecommendStore.getState().resetFilter();
      useLikeStore.getState().initFromServer([]);
      useLikeStore.getState().setPage(1);
      router.push("/splash");
    }
  };

  // ── 루틴 Draft API 연동 ────────────────────────────────────────────
  // 현재 draft에 담긴 productId 목록 — RoutineAddModal 중복 방지용
  const { data: draftItems = [] } = useDraftQuery();
  const draftProductIds = draftItems
    .filter((item) => item.product && item.product.productId)
    .map((item) => item.product.productId);

  // 단일 제품 추가 — POST /api/v1/routines/draft
  const { mutate: addDraftItem } = useAddDraftItemMutation();

  // ── 모달 상태 ────────────────────────────────────────────────────────
  // 열린 스텝 코드 + columnId (RoutineTab → RoutineAddModal로 전달)
  const [openStep, setOpenStep] = useState<string | null>(null);
  const [openColumnId, setOpenColumnId] = useState<number>(0);

  useEffect(() => {
    document.body.style.overflow = openStep ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openStep]);

  /**
   * RoutineTab에서 + 추가 버튼 클릭 시 호출
   * stepCode → 모달 타이틀에 사용, columnId → draft API 요청에 사용
   */
  const handleOpenModal = (stepCode: string, columnId: number) => {
    setOpenStep(stepCode);
    setOpenColumnId(columnId);
  };

  /**
   * RoutineAddModal에서 제품 선택 시 호출
   * POST /api/v1/routines/draft → draft 캐시 자동 갱신
   */
  const handleAddToRoutine = (productId: number) => {
    if (!openStep) return;
    console.log("🔍 루틴 추가 요청:", { columnId: openColumnId, productId, stepCode: openStep });
    addDraftItem(
      { columnId: openColumnId, productId },
      {
        onSuccess: () => {
          toast("✓ 루틴에 추가되었습니다!");
          setOpenStep(null);
        },
        onError: (error) => {
          console.error("❌ 루틴 추가 실패:", error);
          toast("제품 추가에 실패했습니다. 다시 시도해주세요.");
        },
      },
    );
  };

  // ── OwnedTab (내 화장대) ────────────────────────────────────────────
  const { data: myCosRawData, isLoading: myCosLoading } = useMyCosQuery();
  const myCosItems = Array.isArray(myCosRawData) ? myCosRawData : [];
  const { mutate: removeMyCos } = useRemoveMyCos();

  // MyCosItem → ProductViewModel 변환 (OwnedTab props 호환)
  const ownedProducts: ProductViewModel[] = myCosItems.map((item) => ({
    id: item.id,
    brand: item.brand,
    name: item.productName,
    category: item.category,
    imageUrl: item.imageUrl,
    skinTypes: [
      item.topSkinType ? fromSkinTypeEnum(item.topSkinType) : null,
      item.top2SkinType ? fromSkinTypeEnum(item.top2SkinType) : null,
    ].filter(Boolean) as string[],
    effects: [],
  }));

  const handleRemoveOwned = (productId: string | number) => {
    const myCosId =
      typeof productId === "number" ? productId : Number(productId);
    if (!isNaN(myCosId)) removeMyCos(myCosId);
  };

  // ── 기피 제품 — ⚠️ API 연동 시 서버 상태로 교체 ──────────────────────
  const [avoidProducts, setAvoidProducts] = useState<ProductViewModel[]>([]);
  const [openAvoidModal, setOpenAvoidModal] = useState(false);
  const [avoidSearch, setAvoidSearch] = useState("");

  const handleToggleAvoid = (product: ProductViewModel) => {
    setAvoidProducts((previousProducts) =>
      previousProducts.some(
        (previousProduct) => previousProduct.id === product.id,
      )
        ? previousProducts.filter(
            (previousProduct) => previousProduct.id !== product.id,
          )
        : [...previousProducts, product],
    );
  };

  // OwnedTab에서 루틴 props로 사용하는 localRoutine (OwnedTab 인터페이스 호환 유지)
  // OwnedTab이 LocalProduct[] 기반인 동안만 사용, 이후 OwnedTab API 연동 시 제거
  const routineForOwnedTab = useRoutineStore((state) => state.localRoutine);

  return (
    <div className="flex-1 bg-[#F5F2EC]">
      {/* 프로필 헤더 */}
      <div className="pt-3.75 px-5 pb-5 relative border-b border-border">
        <div className="flex items-center gap-4">
          {/* 아바타 — 카카오 프로필 이미지 또는 기본 그라디언트 배경 */}
          <div
            className="w-18 h-18 rounded-full flex items-center justify-center shadow-[0_2px_12px_rgba(166,157,146,0.25)] shrink-0 overflow-hidden"
            style={
              !profileImageUrl
                ? {
                    background:
                      "linear-gradient(135deg, #D9D5D0 0%, #BFB6AA 100%)",
                  }
                : undefined
            }
          >
            {profileImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImageUrl}
                alt="프로필 이미지"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-[22px] font-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* 이름 + 설정/로그아웃 버튼 행 */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-[20px] font-bold text-text-primary tracking-[-0.3px]">
                  {userName}님
                </p>
                {/* 개발 도구 - 성별 스위칭 버튼 (나중에 삭제 예정) */}
                <button
                  onClick={toggleGender}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-amber-50 border border-amber-200 text-[12px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                  aria-label="성별 토글 (개발용)"
                >
                  <Wrench size={12} />
                  {currentGender === "MEN" ? "Men" : "Women"}
                </button>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link href="/mypage/settings">
                  <button
                    className="flex items-center justify-center w-[34px] h-[34px] rounded-full bg-brand/12 border border-brand/20 cursor-pointer"
                    aria-label="설정"
                  >
                    <Settings size={15} className="text-brand-dark" />
                  </button>
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1 text-[12px] font-semibold text-text-faint bg-transparent border-none cursor-pointer py-1 px-0.5"
                >
                  <LogOut size={13} />
                  로그아웃
                </button>
              </div>
            </div>

            {/* 피부 프로필 태그 영역 */}
            {!hasSkinProfile ? (
              <p className="mt-[3px] text-[13px] font-medium text-brand">
                피부 타입을 진단해보세요
              </p>
            ) : (
              <div className="flex flex-wrap gap-1 mt-4">
                {/* 피부 타입 배지 */}
                <span className="text-[16px] py-0.5 px-2 rounded-full bg-[#E8E3DC] text-[#5A504A] font-semibold">
                  {savedSkinType}
                </span>
                {/* 피부 고민 배지 */}
                {savedConcerns.map((concern, index) => (
                  <span
                    key={`${concern}-${index}`}
                    className="text-[14px] py-0.5 px-2 rounded-full bg-[#EEF0E8] text-[#6B7257] font-medium"
                  >
                    {concern}
                  </span>
                ))}
                {/* 기피 성분 배지 */}
                {savedAvoidContents.map((item, index) => (
                  <span
                    key={`${item.avoidContent}-${index}`}
                    className="text-sm font-medium py-0.5 px-2 rounded-full bg-[#F5EDE8] text-[#8C5A4A]"
                  >
                    {item.avoidContent}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 탭 스위처 */}
      <div className="bg-[#fbfaf8] sticky top-0 z-10 border-b border-border flex">
        {(["routine", "owned"] as const).map((tabType) => (
          <button
            key={tabType}
            onClick={() => setActiveTab(tabType)}
            className={`relative flex-1 pt-3 pb-2.75 text-base flex items-center justify-center gap-1.5 cursor-pointer bg-transparent border-none transition-colors duration-200 -mb-px ${
              activeTab === tabType
                ? "font-semibold text-text-primary"
                : "font-normal text-text-faint"
            }`}
          >
            {tabType === "routine" ? <>내 루틴</> : <>내 화장대</>}
            {/* 선택 인디케이터 — 하단 라인 */}
            <span
              className={`absolute bottom-0 left-0 right-0 h-[2.5px] rounded-t-full transition-all duration-200 ${
                activeTab === tabType
                  ? "bg-brand opacity-100"
                  : "bg-transparent opacity-0"
              }`}
            />
          </button>
        ))}
      </div>

      {/* 탭 콘텐츠 */}
      {activeTab === "routine" && (
        <RoutineTab onOpenModal={handleOpenModal} />
      )}
      {activeTab === "owned" &&
        (myCosLoading ? (
          <div className="flex justify-center py-20 text-brand text-sm font-normal">
            불러오는 중...
          </div>
        ) : (
          <OwnedTab
            routine={routineForOwnedTab}
            ownedProducts={ownedProducts}
            avoidProducts={avoidProducts}
            onRemoveOwned={handleRemoveOwned}
            onRemoveAvoid={(productId) => {
              const numericId =
                typeof productId === "number" ? productId : Number(productId);
              setAvoidProducts((previousProducts) =>
                previousProducts.filter(
                  (previousProduct) => previousProduct.id !== numericId,
                ),
              );
            }}
            onOpenAvoidModal={() => {
              setOpenAvoidModal(true);
              setAvoidSearch("");
            }}
          />
        ))}

      {/* 제품 추가 모달 — openStep이 있을 때만 렌더링 */}
      {openStep && (
        <RoutineAddModal
          openStep={openStep}
          columnId={openColumnId}
          draftProductIds={draftProductIds}
          onClose={() => setOpenStep(null)}
          onAdd={handleAddToRoutine}
        />
      )}

      {openAvoidModal && (
        <AvoidProductModal
          avoidProducts={avoidProducts}
          avoidSearch={avoidSearch}
          onSearchChange={setAvoidSearch}
          onClose={() => setOpenAvoidModal(false)}
          onToggle={handleToggleAvoid}
        />
      )}
    </div>
  );
}
