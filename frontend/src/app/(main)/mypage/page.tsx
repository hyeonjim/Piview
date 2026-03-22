"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, LogOut, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  useSyncRoutineDraft,
  useMyCosQuery,
  useRemoveMyCos,
  useUserQuery,
} from "@/hooks";
import RoutineTab from "@/components/features/mypage/RoutineTab";
import RoutineAddModal from "@/components/features/mypage/RoutineAddModal";
import OwnedTab from "@/components/features/mypage/OwnedTab";
import AvoidProductModal from "@/components/features/mypage/AvoidProductModal";
import { useRoutineStore, type LocalProduct } from "@/stores";
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

  const {
    localRoutine: routine,
    addStepProduct,
    removeStepProduct,
  } = useRoutineStore();

  useEffect(() => {
    useRoutineStore.persist.rehydrate();
  }, []);

  const [openStep, setOpenStep] = useState<string | null>(null);

  useEffect(() => {
    document.body.style.overflow = openStep ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [openStep]);

  useSyncRoutineDraft();

  const handleAddToRoutine = (product: LocalProduct) => {
    if (!openStep) return;
    addStepProduct(openStep, product);
    toast(`✓ ${product.name} 루틴에 추가됨!`);
    setOpenStep(null);
  };

  const handleRemoveFromRoutine = (stepCode: string, productId: string) =>
    removeStepProduct(stepCode, productId);

  // ── 보유제품 API 연동 ─────────────────────────────────────────
  // 서버 응답이 배열이 아닌 경우(래핑된 객체 등) 방어 처리
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
    effects: [], // MyCosItem doesn't have effects - will be populated from tags when needed
  }));

  const handleRemoveOwned = (productId: string | number) => {
    const myCosId =
      typeof productId === "number" ? productId : Number(productId);
    if (!isNaN(myCosId)) removeMyCos(myCosId);
  };

  // ── 기피 제품 — ⚠️ API 연동 시 서버 상태로 교체 ──────────────
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
              // 카카오 프로필 이미지 표시
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profileImageUrl}
                alt="프로필 이미지"
                className="w-full h-full object-cover"
              />
            ) : (
              // 기본 아바타 — 이름의 첫 글자 표시
              <span className="text-[22px] font-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* 이름 + 설정/로그아웃 버튼 행 */}
            <div className="flex items-center justify-between">
              {/* 이름 + 성별 토글 버튼 */}
              <div className="flex items-center gap-2">
                {/* 20px → font-semibold: 디스플레이 크기, 세리프는 600이 더 균형적 */}
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
                {/* 12px 소형 텍스트 → font-semibold: 작은 크기 가독성 보완 */}
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
        <RoutineTab
          routine={routine}
          onOpenModal={(stepCode) => setOpenStep(stepCode)}
          onRemove={handleRemoveFromRoutine}
        />
      )}
      {activeTab === "owned" &&
        (myCosLoading ? (
          <div className="flex justify-center py-20 text-brand text-sm font-normal">
            불러오는 중...
          </div>
        ) : (
          <OwnedTab
            routine={routine}
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

      {openStep && (
        <RoutineAddModal
          openStep={openStep}
          routine={routine}
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
