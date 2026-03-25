"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Wrench } from "lucide-react";
import { toast } from "sonner";
import {
  useDraftQuery,
  useAddDraftItemMutation,
  useUserQuery,
} from "@/hooks";
import RoutineTab from "@/components/features/mypage/RoutineTab";
import RoutineAddModal from "@/components/features/mypage/RoutineAddModal";
import OwnedTab from "@/components/features/mypage/OwnedTab";
import { useUserStore, selectSkinType, selectGender } from "@/stores";
import { useSearchStore } from "@/stores/useSearchStore";
import { useRecommendStore } from "@/stores/useRecommendStore";
import { useLikeStore } from "@/stores";

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
    addDraftItem(
      { columnId: openColumnId, productId },
      {
        onSuccess: () => {
          toast("✓ 루틴에 추가되었습니다!");
          setOpenStep(null);
        },
        onError: () => {
          toast("제품 추가에 실패했습니다. 다시 시도해주세요.");
        },
      },
    );
  };

  return (
    <div className="flex-1 bg-[#F5F2EC]">
      <div className="pt-3.75 px-5 pb-5 relative border-b border-border">
        <div className="flex items-center gap-4">
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
              <span className="text-[20px] font-semibold text-white">
                {userName.charAt(0).toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <p className="text-[20px] font-bold text-[#555454] tracking-[-0.3px]">
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
              </div>
            </div>

            {/* 피부 프로필 태그 영역 */}
            {!hasSkinProfile ? (
              <p className="mt-[3px] text-[13px] font-medium text-brand">
                피부 타입을 진단해보세요
              </p>
            ) : (
              <div className="flex flex-wrap gap-1 mt-2">
                {/* 피부 타입 배지 — ProductCard SkinTypeTag 배경색 스타일 */}
                <span className="text-[12px] py-0.5 px-2 rounded-full border bg-[#e9ded3] text-[#514a42] font-semibold">
                  {savedSkinType}
                </span>
                {/* 피부 고민 배지 — ProductCard EffectTag 스타일 */}
                {savedConcerns.map((concern, index) => (
                  <span
                    key={`${concern}-${index}`}
                    className="text-[12px] py-0.5 px-2 rounded-full border bg-[#f0eded] text-[#7a664e] font-semibold"
                  >
                    {concern}
                  </span>
                ))}
                {/* 기피 성분 배지 */}
                {savedAvoidContents.map((item, index) => (
                  <span
                    key={`${item.avoidContent}-${index}`}
                    className="text-[12px] font-medium py-0.5 px-2 rounded-full bg-[#F5EDE8] text-[#8C5A4A]"
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
                ? "font-semibold text-[#535353]"
                : "font-semibold text-text-faint"
            }`}
          >
            {tabType === "routine" ? <>My routine</> : <>My product</>}
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
      {activeTab === "owned" && (
        <OwnedTab />
      )}

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

    </div>
  );
}
