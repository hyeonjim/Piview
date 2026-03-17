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
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import { useLikeStore } from "@/stores/useLikeStore";
import { getMockProductById } from "@/constants/_mock/product";
import { getEwgColor } from "@/constants/categoryColors";
import { isAllergenIngredient } from "@/constants/allergens";

// 알레르기 성분 아이콘 — 빨간 원형 경고 스타일
function AllergenIcon() {
  return (
    <div className="flex items-center justify-center shrink-0 self-center size-6 rounded-full bg-red-50">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#EF4444" />
        <rect x="11" y="6.5" width="2" height="7" rx="1" fill="white" />
        <circle cx="12" cy="17" r="1.3" fill="white" />
      </svg>
    </div>
  );
}

// EWG 등급 물방울 아이콘
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
  // 맞춤추천 페이지에서 전달된 추천 이유 — 전체목록에서 진입 시 null
  const recommendReason = searchParams.get("reason");
  // ⚠️ API 연동 시 → productService.getProduct(id) 로 교체
  const productData = getMockProductById(id);

  const [owned, setOwned] = useState(false);
  const [routineAdded, setRoutineAdded] = useState(false);
  // ProductCard와 동일한 전역 찜 상태 — ⚠️ API 연동 시 likeService로 교체
  const { isLiked: getIsLiked, toggleLike } = useLikeStore();
  const isLiked = getIsLiked(productData.id);
  // ⚠️ API 연동 시 서버 상태로 교체
  const [inCompare, setInCompare] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "ingredients" | "purpose" | "skintype"
  >("ingredients");
  const [isIngredientListOpen, setIsIngredientListOpen] = useState(false);
  const [isScrollTopVisible, setIsScrollTopVisible] = useState(false);

  // EWG 카드가 화면 상단에 도달하면 위로가기 버튼 표시
  const ewgSectionRef = useRef<HTMLDivElement>(null);
  const { toastMessage, showToast } = useToast();

  // 루트 레이아웃이 min-h-screen으로 늘어나므로 window가 스크롤됨
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

  const handleAddRoutine = () => {
    if (routineAdded) return;
    setRoutineAdded(true);
    showToast(`✓ ${productData.name} 루틴에 추가됨!`);
  };

  const { total, safe, caution, danger, unknown, safePercent } =
    productData.ewg;
  const allergenList = productData.ingredientsKr.filter((ingredientName) =>
    isAllergenIngredient(ingredientName),
  );
  const purposeScores = Object.entries(productData.purposeScores);
  const skinTypeScores = Object.entries(productData.skinTypeScores);

  return (
    <div className="flex flex-col min-h-full relative bg-bg-beige">
      <Toast msg={toastMessage} />

      {/* 헤더 — 고정 해제 */}
      <div className="flex items-center justify-between px-4 h-12 bg-bg-beige">
        <button
          onClick={() => router.back()}
          className="size-9 flex items-center justify-center rounded-full bg-white/70 border-none cursor-pointer"
        >
          <ChevronLeft size={22} color="#1A1A1A" />
        </button>

        {/* 좋아요 버튼 — ProductCard의 useLikeStore와 동일한 전역 상태 */}
        <button
          onClick={() => toggleLike(productData.id)}
          className="size-9 flex items-center justify-center rounded-full bg-transparent border-none cursor-pointer transition-all active:scale-[0.93]"
        >
          <Heart
            size={22}
            className="transition-all duration-150"
            style={{
              color: isLiked ? "#E8715A" : "#C4BEB7",
              fill: isLiked ? "#E8715A" : "none",
            }}
          />
        </button>
      </div>

      {/* 콘텐츠 영역 */}
      <div className="flex-1 pb-8">
        {/* 제품 대표 이미지 */}
        <div className="mx-5 mb-4 flex items-center justify-center h-60 rounded-modal bg-[#EDEAE2]">
          <span className="text-[80px]">{productData.emoji ?? "🧴"}</span>
        </div>

        {/* 제품 기본 정보 카드 */}
        <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
          {/* 브랜드·제품명 + 내루틴 비교하기 버튼 */}
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex-1 min-w-0">
              <p className="text-[16px] text-text-muted font-medium mb-0.5">
                {productData.brand}
              </p>
              <h1 className="text-[20px] font-semibold text-text-primary leading-[1.35]">
                {productData.name}
              </h1>
            </div>

            {/* 내루틴 비교하기 버튼 */}
            <button
              onClick={() => setInCompare((prev) => !prev)}
              className={`flex items-center gap-1 px-2.5 h-7 rounded-lg border cursor-pointer transition-all active:scale-[0.96] text-[11px] font-semibold shrink-0 ${
                inCompare
                  ? "border-brand bg-brand text-white"
                  : "border-border bg-white text-text-hint"
              }`}
            >
              내루틴 비교하기
            </button>
          </div>

          {/* 피부타입 태그 (1행) + 피부기능 태그 (2행) */}
          {(productData.skinType1 ||
            productData.skinType2 ||
            productData.tags.length > 0) && (
            <div className="flex flex-col gap-1.5 mb-7">
              {(productData.skinType1 || productData.skinType2) && (
                <div className="flex flex-wrap gap-1.5">
                  {[productData.skinType1, productData.skinType2]
                    .filter(Boolean)
                    .map((skinType) => (
                      <span
                        key={skinType}
                        className="text-[14px] px-2 py-0.5 rounded-[6px] bg-brand-bg text-brand"
                      >
                        {skinType}
                      </span>
                    ))}
                </div>
              )}
              {productData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {productData.tags.map((tag) => (
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

          {/* 가격·용량 + 액션 버튼 한 줄 */}
          <div className="flex items-center justify-between gap-2">
            {productData.price ? (
              <p className="text-base font-normal text-text-primary">
                ₩{productData.price.toLocaleString()} /
                {productData.volume && (
                  <span className="text-base text-text-hint font-normal ml-1.5">
                    {productData.volume}
                  </span>
                )}
              </p>
            ) : (
              <div />
            )}

            {/* 루틴추가·보유추가 — 가격 오른쪽 끝 */}
            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={handleAddRoutine}
                disabled={routineAdded}
                className={`flex items-center justify-center gap-1 w-20 h-8 rounded-xl border-none cursor-pointer transition-all active:scale-[0.98] text-xs font-bold ${
                  routineAdded
                    ? "bg-[#F0F0F0] text-text-muted"
                    : "bg-brand text-white"
                }`}
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
                onClick={() => setOwned((prev) => !prev)}
                className={`flex items-center justify-center gap-1 w-20 h-8 rounded-xl cursor-pointer transition-all active:scale-[0.98] text-xs font-semibold border ${
                  owned
                    ? "border-brand-light bg-brand-bg text-brand"
                    : "border-border-warm bg-white text-text-hint"
                }`}
              >
                <Package size={11} /> {owned ? "보유 중" : "보유추가"}
              </button>
            </div>
          </div>
        </div>

        {/* 추천 이유 카드 — 맞춤추천에서 진입 시에만 표시 */}
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

        {/* EWG 성분 분석 카드 */}
        <div ref={ewgSectionRef} className="mx-5 rounded-2xl bg-white p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="size-7 rounded-full flex items-center justify-center bg-ewg-safe-bg">
                <span className="text-ewg-safe text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-[16px] font-bold text-text-primary">
                  EWG 성분 분석
                </p>
                <p className="text-xs text-text-muted">총 {total}개 성분</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted">안전 비율</p>
              <p className="text-[22px] font-extrabold text-ewg-safe">
                {safePercent}%
              </p>
            </div>
          </div>

          {/* EWG 비율 바 — flex 값은 동적이라 style 유지 */}
          <div className="flex h-3 gap-0.5 rounded-full overflow-hidden mb-3">
            <div className="rounded bg-ewg-safe" style={{ flex: safe }} />
            <div className="rounded bg-ewg-caution" style={{ flex: caution }} />
            {danger > 0 && (
              <div className="rounded bg-ewg-danger" style={{ flex: danger }} />
            )}
            <div className="rounded bg-[#E0E0E0]" style={{ flex: unknown }} />
          </div>

          {/* EWG 등급 요약 */}
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
                <p className="text-xs text-text-sub mb-0.5">• {grade.label}</p>
                {/* color는 동적 값이라 style 유지 */}
                <p className="text-lg font-bold" style={{ color: grade.color }}>
                  {grade.count}
                </p>
                <p className="text-[14px] text-text-muted mt-0.5">
                  {grade.sub}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* 주의 성분 + 알레르기 유발 성분 카드 */}
        {(productData.cautionIngredients.length > 0 ||
          allergenList.length > 0) && (
          <div className="mx-5 p-4 rounded-2xl mb-3 bg-[#FFF8F0] border border-[#FFE0B2]">
            {productData.cautionIngredients.length > 0 && (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} color="#E65100" />
                  <span className="text-sm font-semibold text-[#E65100]">
                    주의 성분
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {productData.cautionIngredients.map((ingredient) => (
                    <span
                      key={ingredient}
                      className="text-xs px-2 py-0.5 rounded-[6px] font-normal bg-[#FFF3E0] text-[#BF360C]"
                    >
                      {ingredient}
                    </span>
                  ))}
                </div>
              </>
            )}

            {allergenList.length > 0 && (
              <div
                className={
                  productData.cautionIngredients.length > 0
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

        {/* 탭 바 */}
        <div className="mx-5 my-5">
          <div className="flex rounded-xl p-1 bg-[#EEEBE4]">
            {[
              { key: "ingredients" as const, label: "전성분 분석" },
              { key: "purpose" as const, label: "목적별 점수" },
              { key: "skintype" as const, label: "피부타입별" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 h-9 rounded-[10px] border-none cursor-pointer transition-all text-[16px] ${
                  activeTab === key
                    ? "bg-white text-text-primary font-bold shadow-[0_1px_4px_rgba(0,0,0,0.1)]"
                    : "bg-transparent text-text-muted font-medium"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* 탭 콘텐츠 */}
        <div className="mx-5 mb-8">
          {/* 전성분 분석 탭 */}
          {activeTab === "ingredients" && (
            <div className="rounded-2xl bg-white overflow-hidden">
              {productData.description && (
                <div className="p-4 border-b border-[#F5F5F5]">
                  <p className=" font-semibold text-text-sub mb-1.5">
                    제품 설명
                  </p>
                  <p className="text-xs text-text-primary leading-[1.6]">
                    {productData.description}
                  </p>
                </div>
              )}

              {/* 전성분 펼치기/접기 */}
              <div className="p-4 border-b border-[#F5F5F5]">
                <button
                  className="flex items-center justify-between w-full bg-transparent border-none cursor-pointer p-0"
                  onClick={() => setIsIngredientListOpen((prev) => !prev)}
                >
                  <span className="font-semibold text-text-sub">전성분</span>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    {isIngredientListOpen ? "접기" : "펼치기"}
                    {isIngredientListOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </div>
                </button>
                {/* -webkit-line-clamp은 Tailwind로 표현 불가 — style 유지 */}
                <p
                  className="text-[12px] text-[#424242] leading-[1.7] mt-2 overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: isIngredientListOpen
                      ? ("unset" as unknown as number)
                      : 2,
                    WebkitBoxOrient: "vertical" as const,
                  }}
                >
                  {productData.ingredientsKr.join(", ")}
                </p>
              </div>

              {/* 성분 목록 */}
              <div>
                {productData.ingredientDetails.map((ingredient) => {
                  const ewgColorInfo = getEwgColor(ingredient.ewgGrade);
                  const hasAllergenWarning = isAllergenIngredient(
                    ingredient.name,
                  );
                  return (
                    <div
                      key={ingredient.name}
                      className="flex items-start gap-3 px-4 py-3 not-last:border-b not-last:border-[#F5F5F5]"
                    >
                      <div className="flex flex-col items-center shrink-0 w-7">
                        <EwgDropIcon color={ewgColorInfo.barColor} />
                        {/* ewgColorInfo.text는 동적 값이라 style 유지 */}
                        <span
                          className="text-[10px] font-bold mt-0.5"
                          style={{ color: ewgColorInfo.text }}
                        >
                          {ingredient.ewgGrade != null
                            ? ingredient.ewgGrade
                            : "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary leading-[1.3]">
                          {ingredient.name}
                        </p>
                        {ingredient.nameEn && (
                          <p className="text-xs text-text-muted my-0.5">
                            {ingredient.nameEn}
                          </p>
                        )}
                        {ingredient.funcs && ingredient.funcs.length > 0 && (
                          <p className="text-xs text-text-hint leading-[1.5]">
                            {ingredient.funcs.join(", ")}
                          </p>
                        )}
                      </div>
                      {hasAllergenWarning && <AllergenIcon />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 목적별 점수 탭 */}
          {activeTab === "purpose" && (
            <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
              {purposeScores.map(([label, score]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className=" text-text-primary">{label}</span>
                    <span className="font-bold text-brand">{score}</span>
                  </div>
                  <div className="h-1.5 rounded-[3px] bg-bg-muted-warm overflow-hidden">
                    {/* width는 동적 값이라 style 유지 */}
                    <div
                      className="h-full rounded-[3px] bg-brand transition-[width] duration-600 ease-in-out"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
              <p className="text-xs text-text-hint leading-[1.6] px-3 py-2.5 rounded-[10px] bg-bg-surface mt-1">
                ⓘ 점수는 해당 목적에 관련 성분의 함유량과 효능을 기반으로
                산출됩니다. 80점 이상은 해당 목적에 매우 적합합니다.
              </p>
            </div>
          )}

          {/* 피부타입별 점수 탭 */}
          {activeTab === "skintype" && (
            <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
              {skinTypeScores.map(([label, score]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className=" text-text-primary">{label}</span>
                      {label === productData.skinType1 && (
                        <span className="text-[10px] px-2 py-[1px] rounded-[20px] bg-brand text-white font-semibold">
                          내 피부
                        </span>
                      )}
                    </div>
                    <span className=" font-bold text-brand">{score}</span>
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
        </div>
      </div>

      {/* 위로가기 버튼 — BottomNav와 동일한 패턴으로 페이지 컨테이너 안에 고정 */}
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
              <ChevronUp size={20} color="#1A1A1A" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// useSearchParams 사용으로 인해 Suspense 필요
import { Suspense } from "react";

export default function ProductDetailPage() {
  return (
    <Suspense fallback={null}>
      <ProductDetailInner />
    </Suspense>
  );
}
