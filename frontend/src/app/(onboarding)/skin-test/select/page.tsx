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


export default function SelectPage() {
  const router = useRouter();

  // Zustand store에서 현재 유저 정보 읽기 (pre-fill용)
  const user = useUserStore((s) => s.user);
  const storeConcerns = useUserStore((s) => s.concerns);
  const { mutate: updateProfile, isPending, setConcerns } = useUpdateProfile();

  // ── 폼 상태 — 저장된 값이 있으면 초기값으로 pre-fill ─────────────
  const [selectedGender, setSelectedGender] = useState<string>(
    user?.gender ?? "WOMEN",
  );
  const [selectedAge, setSelectedAge] = useState<string | null>(
    user?.ageGroup ?? null,
  );
  // user.mySkinType(한글 레이블) → SKIN_TYPES id (폼 pre-fill용)
  const [selectedType, setSelectedType] = useState<string | null>(
    user?.mySkinType
      ? (SKIN_TYPES.find((t) => t.label === user.mySkinType)?.id ?? null)
      : null,
  );
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>(
    storeConcerns,
  );
  const toggleConcern = (concern: string) =>
    setSelectedConcerns((previous) =>
      previous.includes(concern)
        ? previous.filter((item) => item !== concern)
        : [...previous, concern],
    );

  // ── 기피 제품 ──────────────────────────────────────────────────
  const [openAvoidModal, setOpenAvoidModal] = useState(false);
  const [avoidPage, setAvoidPage] = useState(1);
  const { data: dislikedItems = [] } = useDislikedProductsQuery();
  const { mutate: removeDisliked } = useRemoveDislikedProduct();
  const avoidTotalPages = Math.ceil(dislikedItems.length / PAGE_SIZE) || 1;
  const pagedAvoid = dislikedItems.slice(
    (avoidPage - 1) * PAGE_SIZE,
    avoidPage * PAGE_SIZE,
  );

  const isValid = selectedType !== null;

  // "완료" 버튼 클릭 — PATCH /users/me로 프로필 저장 후 결과 페이지 이동
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
        // ⚠️ ERD 확정 후 mySkinProblems에서 string 배열 파싱 방식으로 교체
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

        {/* 페이지 제목 */}
        <h1 className="text-text-primary font-bold text-[22px] leading-[1.3] tracking-[-0.3px]">
          피부 정보를
          <br />
          입력해주세요
        </h1>

        {/* 성별 선택 */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[15px]">성별</h2>
          <div className="flex gap-3 mt-3">
            {GENDER_OPTIONS.map((gender) => {
              const isSelected = selectedGender === gender.id;
              return (
                <button
                  key={gender.id}
                  onClick={() => setSelectedGender(gender.id)}
                  className="flex-1 h-[52px] rounded-xl flex items-center justify-center transition-all duration-200 cursor-pointer text-[16px]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "var(--color-bg-card)",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                    fontWeight: 800,
                    color: isSelected ? "var(--color-product-name)" : "#616161",
                  }}
                >
                  {gender.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 연령대 선택 */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[15px]">
            연령대
          </h2>
          <div className="flex gap-2 mt-3">
            {AGE_GROUPS.map((age) => {
              const isSelected = selectedAge === age.id;
              return (
                <button
                  key={age.id}
                  onClick={() => setSelectedAge(age.id)}
                  className="flex-1 h-[42px] rounded-[10px] transition-all duration-200 cursor-pointer text-[16px]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "var(--color-bg-card)",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                    color: isSelected ? "var(--color-product-name)" : "#616161",
                    fontWeight: 800,
                  }}
                >
                  {age.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 피부 타입 선택 */}
        <section className="mt-8">
          <h2 className="text-text-primary font-semibold text-[15px]">
            피부 타입
          </h2>
          <div className="grid grid-cols-2 gap-3 mt-3">
            {SKIN_TYPES.map((type) => {
              const isSelected = selectedType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setSelectedType(type.id)}
                  className="h-[50px] rounded-2xl flex items-center justify-center transition-all duration-200 cursor-pointer text-[16px] leading-[1.4]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "var(--color-bg-card)",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#F0F0F0"}`,
                    fontWeight: 800,
                    color: isSelected ? "var(--color-product-name)" : "#616161",
                  }}
                >
                  {type.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 피부 고민 선택 */}
        <section className="mt-8">
          <div className="flex items-baseline gap-2">
            <h2 className="text-text-primary font-semibold text-[15px]">
              피부 고민
            </h2>
            <span className="text-text-hint text-[14px]">복수 선택 가능</span>
          </div>
          <div className="flex flex-wrap gap-2 mt-3">
            {SKIN_CONCERNS.map((concern) => {
              const isSelected = selectedConcerns.includes(concern);
              return (
                <button
                  key={concern}
                  onClick={() => toggleConcern(concern)}
                  className="h-9 px-4 rounded-[30px] transition-all duration-150 cursor-pointer text-[14px]"
                  style={{
                    backgroundColor: isSelected
                      ? "var(--color-brand-bg)"
                      : "var(--color-bg-card)",
                    border: `1.5px solid ${isSelected ? "var(--color-brand)" : "#E0E0E0"}`,
                    color: isSelected ? "var(--color-product-name)" : "#616161",
                    fontWeight: 600,
                  }}
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
              <Ban size={16} className="text-danger mt-0.5 shrink-0" />
              <div>
                <h2 className="text-text-primary font-semibold text-[15px]">Avoid Products</h2>
                <p className="text-xs text-text-muted mt-0.5">{dislikedItems.length}개 등록됨</p>
              </div>
            </div>
            <button
              onClick={() => setOpenAvoidModal(true)}
              className="text-[13px] px-3 py-1 rounded-full bg-brand/10 text-brand font-semibold cursor-pointer border-none transition-colors hover:bg-brand/20"
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

      </div>

      {/* 기피 제품 추가 모달 */}
      {openAvoidModal && (
        <ProductSearchModal
          mode="avoid"
          onClose={() => setOpenAvoidModal(false)}
        />
      )}

      {/* 하단 고정 버튼 영역 */}
      <div className="w-[250px] mx-auto px-6 pb-8 pt-4">
        <button
          onClick={handleComplete}
          disabled={!isValid || isPending}
          className="w-full h-[52px] rounded-[32px] font-bold text-[18px] transition-all duration-200 border-none"
          style={{
            backgroundColor:
              isValid && !isPending
                ? "var(--color-brand)"
                : "var(--color-product-action-bg)",
            color:
              isValid && !isPending
                ? "var(--color-bg-card)"
                : "var(--color-text-disabled)",
            cursor: isValid && !isPending ? "pointer" : "default",
            boxShadow:
              isValid && !isPending
                ? "0px 2px 8px rgba(162,170,123,0.3)"
                : "none",
          }}
        >
          {isPending ? "저장 중..." : "완료"}
        </button>
      </div>
    </div>
  );
}
