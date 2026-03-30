"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Minus, Ban } from "lucide-react";
import {
  AGE_GROUPS,
  GENDER_OPTIONS,
  SKIN_TYPES,
  SKIN_CONCERNS,
} from "@/constants";
import { PAGE_SIZE } from "@/constants/pagination";
import { useUserStore } from "@/stores";
import { useUpdateProfile } from "@/hooks/queries/useUserQuery";
import { useDislikedProductsQuery, useRemoveDislikedProduct } from "@/hooks";
import { EmptyState } from "@/components/common";
import { Pagination } from "@/components/common/Pagination";
import ProductCard from "@/components/common/ProductCard";
import ProductSearchModal from "@/components/features/mypage/ProductSearchModal";
import { fromSkinTypeEnum } from "@/utils/enumConvert";
import type { UserProfileUpdateRequest } from "@/types/user";

// ── 공통 선택 버튼 스타일 헬퍼 ────────────────────────────────
// 성별/연령대/피부타입 버튼이 동일한 활성/비활성 패턴을 공유
// → 함수로 추출해 className 중복 제거
function getSelectionButtonClass(isSelected: boolean, extra = ""): string {
  return [
    "flex items-center justify-center transition-all duration-200 cursor-pointer border-[1.5px] font-extrabold",
    // Tailwind v4: @theme의 --color-* 변수가 bg-brand-bg 등 유틸리티로 자동 생성됨
    isSelected
      ? "bg-brand-bg border-brand text-product-name"
      : "bg-bg-card border-[#F0F0F0] text-[#616161]",
    extra,
  ]
    .filter(Boolean)
    .join(" ");
}

export default function SelectPage() {
  const router = useRouter();

  // Zustand 선택자: (state) => state.xxx 형태로 명시적으로 작성
  const user = useUserStore((state) => state.user);
  const storeConcerns = useUserStore((state) => state.concerns);
  const { mutate: updateProfile, isPending, setConcerns } = useUpdateProfile();

  // ── 폼 상태 — 저장된 값이 있으면 초기값으로 pre-fill ─────────
  const [selectedGender, setSelectedGender] = useState<string>(
    user?.gender ?? "WOMEN",
  );
  const [selectedAge, setSelectedAge] = useState<string | null>(
    user?.ageGroup ?? null,
  );
  // user.mySkinType(한글 레이블) → SKIN_TYPES id (폼 pre-fill용)
  const [selectedType, setSelectedType] = useState<string | null>(
    user?.mySkinType
      ? (SKIN_TYPES.find((skinType) => skinType.label === user.mySkinType)?.id ?? null)
      : null,
  );
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(
    storeConcerns,
  );

  // 고민 토글: 이미 선택된 항목이면 제거, 아니면 추가
  const toggleConcern = (concern: string) =>
    setSelectedConcerns((previous) =>
      previous.includes(concern)
        ? previous.filter((item) => item !== concern)
        : [...previous, concern],
    );

  // ── 기피 제품 ──────────────────────────────────────────────────
  const [isAvoidModalOpen, setIsAvoidModalOpen] = useState(false);
  const [avoidPage, setAvoidPage] = useState(1);
  const { data: dislikedItems = [] } = useDislikedProductsQuery();
  const { mutate: removeDisliked } = useRemoveDislikedProduct();
  // 전체 아이템을 PAGE_SIZE 단위로 나눔 (클라이언트 페이지네이션)
  const avoidTotalPages = Math.ceil(dislikedItems.length / PAGE_SIZE) || 1;
  const pagedAvoid = dislikedItems.slice(
    (avoidPage - 1) * PAGE_SIZE,
    avoidPage * PAGE_SIZE,
  );

  // 피부 타입을 선택해야만 완료 가능
  const isValid = selectedType !== null;

  // ── 완료 처리 — PATCH /users/me → 결과 페이지 이동 ────────────
  const handleComplete = () => {
    if (!isValid || isPending) return;

    const profilePayload: UserProfileUpdateRequest = {
      gender: selectedGender as "MEN" | "WOMEN",
      ...(selectedAge && {
        ageGroup: selectedAge as "TEENS" | "TWENTIES" | "THIRTIES" | "FORTIES_PLUS",
      }),
      ...(selectedType && { mySkinType: selectedType }),
      skinProblems: selectedConcerns,
    };

    updateProfile(profilePayload, {
      onSuccess: () => {
        setConcerns(selectedConcerns);
        router.push(`/skin-test/result?type=${selectedType}`);
      },
    });
  };

  return (
    <div className="flex flex-col min-h-full bg-white">
      {/* 스크롤 가능한 콘텐츠 영역 */}
      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-6">
        {/* 뒤로가기 버튼 */}
        <button
          onClick={() => router.push("/skin-test")}
          className="flex items-center gap-1.5 mb-6 text-text-hint bg-transparent border-none cursor-pointer"
        >
          <ArrowLeft size={20} />
        </button>

        <h1 className="text-text-primary font-bold text-[20px] leading-[1.3] tracking-[-0.3px]">
          피부 정보를 입력해주세요
        </h1>

        {/* 성별 선택
         * getSelectionButtonClass: 활성/비활성 Tailwind 클래스를 조건부로 반환 */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[16px]">성별</h2>
          <div className="flex gap-3 mt-3">
            {GENDER_OPTIONS.map((gender) => (
              <button
                key={gender.id}
                onClick={() => setSelectedGender(gender.id)}
                className={getSelectionButtonClass(
                  selectedGender === gender.id,
                  "flex-1 h-13 rounded-xl text-[16px]",
                )}
              >
                {gender.label}
              </button>
            ))}
          </div>
        </section>

        {/* 연령대 선택 */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[16px]">연령대</h2>
          <div className="flex gap-2 mt-3">
            {AGE_GROUPS.map((age) => (
              <button
                key={age.id}
                onClick={() => setSelectedAge(age.id)}
                className={getSelectionButtonClass(
                  selectedAge === age.id,
                  "flex-1 h-10.5 rounded-[10px] text-[16px]",
                )}
              >
                {age.label}
              </button>
            ))}
          </div>
        </section>

        {/* 피부 타입 선택 (2×2 그리드) */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[16px]">피부 타입</h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {SKIN_TYPES.map((type) => (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={getSelectionButtonClass(
                  selectedType === type.id,
                  "h-12.5 rounded-2xl text-[16px] leading-[1.4]",
                )}
              >
                {type.label}
              </button>
            ))}
          </div>
        </section>

        {/* 피부 고민 다중 선택 (태그 형태) */}
        <section className="mt-8">
          <div className="flex items-baseline gap-2">
            <h2 className="text-text-primary font-semibold text-[16px]">피부 고민</h2>
            <span className="text-text-hint text-[14px]">복수 선택 가능</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {SKIN_CONCERNS.map((concern) => {
              const isSelected = selectedConcerns.includes(concern);
              return (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className={getSelectionButtonClass(
                    isSelected,
                    "h-9 px-4 rounded-[30px] text-[14px] font-semibold",
                  )}
                >
                  {concern}
                </button>
              );
            })}
          </div>
        </section>

        {/* 기피 제품 섹션 */}
        <section className="mt-13">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-start gap-1.5">
              {/* Ban 아이콘: 제외/금지를 나타내는 시각적 신호 */}
              <Ban size={16} className="text-danger mt-0.5 shrink-0" />
              <div>
                <h2 className="text-text-primary font-semibold text-[16px]">제외 제품</h2>
                <p className="text-[14px] text-text-primary mt-1">
                  {dislikedItems.length}개 등록됨
                  <br />
                  등록된 제품의 알러지를 포함한 제품은 추천에서 제외됩니다
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsAvoidModalOpen(true)}
              className="text-[13px] px-3 py-1 rounded-full bg-brand/10 text-text-primary font-semibold cursor-pointer border-none transition-colors hover:bg-brand/20"
            >
              + 추가
            </button>
          </div>

          {dislikedItems.length === 0 ? (
            // 빈 상태: 점선 테두리 + EmptyState 컴포넌트
            // border-bg-like: Tailwind v4가 @theme의 --color-bg-like를 자동 인식
            <div className="border border-dashed border-bg-like rounded-2xl py-12 mt-3">
              <EmptyState
                icon={Ban}
                title="등록된 제품이 없습니다"
                description={"트러블을 유발했거나 맞지 않았던\n제품을 등록해보세요"}
              />
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-3 mt-7 [&_p.line-clamp-2]:text-[14px]!">
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
                    {/* 삭제 버튼 오버레이 — 카드 우상단에 고정 */}
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
                onChange={(page) => {
                  setAvoidPage(page);
                }}
              />
            </>
          )}
        </section>
      </div>

      {/* 기피 제품 추가 모달 */}
      {isAvoidModalOpen && (
        <ProductSearchModal
          mode="avoid"
          onClose={() => setIsAvoidModalOpen(false)}
        />
      )}

      {/* 하단 고정 완료 버튼
       * isValid(피부 타입 선택 여부)에 따라 활성/비활성 스타일 전환 */}
      <div className="w-62.5 mx-auto px-6 pb-8 pt-4">
        <button
          onClick={handleComplete}
          disabled={!isValid || isPending}
          className={[
            "w-full h-13 rounded-[32px] font-bold text-[18px] transition-all duration-200 border-none",
            isValid && !isPending
              ? "bg-brand text-white cursor-pointer shadow-[0px_2px_8px_rgba(162,170,123,0.3)]"
              : "bg-product-action-bg text-text-disabled cursor-default",
          ].join(" ")}
        >
          {isPending ? "저장 중..." : "완료"}
        </button>
      </div>
    </div>
  );
}
