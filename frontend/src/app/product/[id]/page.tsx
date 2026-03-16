"use client";

import React, { useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ChevronLeft,
  Package,
  Check,
  Plus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
} from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import { getMockProductById } from "@/constants/_mock/product";
import { getEwgColor } from "@/constants/categoryColors";
import { isAllergenIngredient } from "@/constants/allergens";

// ── 스타일 상수 ──────────────────────────────────────────────────────
const EWG_BAR_CONTAINER = { height: 8, gap: 2 };
const EWG_BAR_RADIUS = 4;
const EWG_UNKNOWN_COLOR = "#E0E0E0";
const CAUTION_CHIP_STYLE = { backgroundColor: "#FFF3E0", color: "#BF360C" };
const ALLERGEN_CHIP_STYLE = { backgroundColor: "#FFEBEE", color: "#B71C1C" };
const INGRED_DIVIDER = "1px solid #F5F5F5";

// ── 알레르기 아이콘 — 따뜻한 베이지 테마에 어울리는 잎+경고 스타일 ──
function AllergenIcon() {
  return (
    <div
      className="flex items-center justify-center shrink-0 self-center"
      style={{
        width: "28px",
        height: "28px",
        borderRadius: "8px",
        backgroundColor: "rgba(230, 81, 0, 0.08)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
        {/* 잎 모양 몸통 */}
        <path
          d="M12 2C7 2 3 7 3 12c0 3.5 2 6.5 5 8l1-3c-1.5-1-2.5-2.8-2.5-5 0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6c0 2.2-1 4-2.5 5l1 3c3-1.5 5-4.5 5-8 0-5-4-10-9-10z"
          fill="#E65100"
          fillOpacity="0.18"
          stroke="#E65100"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
        {/* 경고 느낌표 */}
        <rect x="11" y="8" width="2" height="5" rx="1" fill="#E65100" />
        <circle cx="12" cy="16" r="1.1" fill="#E65100" />
      </svg>
    </div>
  );
}

// ── 물방울 EWG 아이콘 ───────────────────────────────────────────────
function DropIcon({ color }: { color: string }) {
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

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  // ⚠️ API 연동 시 → productService.getProduct(id) 로 교체
  const productData = getMockProductById(id);

  const [owned, setOwned] = useState(false);
  const [routineAdded, setRoutineAdded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "ingredients" | "purpose" | "skintype"
  >("ingredients");
  const [ingredOpen, setIngredOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { toastMessage, showToast } = useToast();

  const handleScroll = useCallback(() => {
    if (scrollRef.current) setShowScrollTop(scrollRef.current.scrollTop > 300);
  }, []);

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

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

      {/* 헤더 */}
      <div className="sticky top-0 z-20 flex items-center px-4 h-9 bg-bg-beige">
        <button
          onClick={() => router.back()}
          className="w-9 h-9 flex items-center justify-center rounded-full bg-white/70 border-none cursor-pointer"
        >
          <ChevronLeft size={22} color="#1A1A1A" />
        </button>
      </div>

      {/* 스크롤 영역 */}
      <div
        className="flex-1 overflow-y-auto pb-8"
        ref={scrollRef}
        onScroll={handleScroll}
      >
        {/* 이미지 */}
        <div className="mx-5 mb-4 flex items-center justify-center h-[240px] rounded-[20px] bg-[#EDEAE2]">
          <span className="text-[80px]">{productData.emoji ?? "🧴"}</span>
        </div>

        {/* 제품 기본 정보 */}
        <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
          {/* 브랜드 + 제품명 */}
          <p className="text-base text-text-muted font-medium mb-0.5">
            {productData.brand}
          </p>
          <h1 className="text-[19px] font-semibold text-text-primary leading-[1.35] mb-3">
            {productData.name}
          </h1>

          {/* 피부타입 태그 (1행) + 피부기능 태그 (2행) — 2줄 나란히 */}
          {(productData.skinType1 ||
            productData.skinType2 ||
            productData.tags.length > 0) && (
            <div className="flex flex-col gap-1.5 mb-3">
              {/* 1행: 피부타입 태그 */}
              {(productData.skinType1 || productData.skinType2) && (
                <div className="flex flex-wrap gap-1.5">
                  {[productData.skinType1, productData.skinType2]
                    .filter(Boolean)
                    .map((skinType) => (
                      <span
                        key={skinType}
                        className="text-xs px-2 py-[2px] rounded-[6px] bg-brand-bg text-brand font-semibold"
                      >
                        {skinType}
                      </span>
                    ))}
                </div>
              )}
              {/* 2행: 피부기능 태그 */}
              {productData.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {productData.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs px-[9px] py-[2px] rounded-xl bg-bg-chip text-text-hint border border-border-warm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 가격 */}
          {productData.price && (
            <p className="text-base font-normal text-text-primary mb-3">
              ₩{productData.price.toLocaleString()} /
              {productData.volume && (
                <span className="text-base text-text-hint font-normal ml-1.5">
                  {productData.volume}
                </span>
              )}
            </p>
          )}

          {/* 액션 버튼 — 작게 구현 */}
          <div className="flex gap-2">
            <button
              onClick={handleAddRoutine}
              disabled={routineAdded}
              className={`flex-1 flex items-center justify-center gap-1.5 h-[34px] rounded-xl border-none cursor-pointer transition-all active:scale-[0.98] text-xs font-bold ${
                routineAdded
                  ? "bg-[#F0F0F0] text-text-muted"
                  : "bg-brand text-white"
              }`}
            >
              {routineAdded ? (
                <>
                  <Check size={12} /> 루틴추가됨
                </>
              ) : (
                <>
                  <Plus size={12} /> 루틴추가
                </>
              )}
            </button>
            <button
              onClick={() => setOwned((prev) => !prev)}
              className={`flex items-center justify-center gap-1.5 h-[34px] px-3 rounded-xl cursor-pointer transition-all active:scale-[0.98] text-xs font-semibold border ${
                owned
                  ? "border-brand-light bg-brand-bg text-brand"
                  : "border-border-warm bg-white text-text-hint"
              }`}
            >
              <Package size={12} /> {owned ? "보유 중" : "보유추가"}
            </button>
          </div>
        </div>

        {/* EWG 성분 분석 */}
        <div className="mx-5 rounded-2xl bg-white p-4 mb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center bg-ewg-safe-bg">
                <span className="text-ewg-safe text-sm font-bold">✓</span>
              </div>
              <div>
                <p className="text-sm font-bold text-text-primary m-0">
                  EWG 성분 분석
                </p>
                <p className="text-xs text-text-muted m-0">총 {total}개 성분</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-text-muted m-0">안전 비율</p>
              <p className="text-[22px] font-extrabold text-ewg-safe m-0">
                {safePercent}%
              </p>
            </div>
          </div>

          <div
            className="flex rounded-full overflow-hidden mb-3"
            style={EWG_BAR_CONTAINER}
          >
            <div
              style={{
                flex: safe,
                backgroundColor: "var(--color-ewg-safe)",
                borderRadius: EWG_BAR_RADIUS,
              }}
            />
            <div
              style={{
                flex: caution,
                backgroundColor: "var(--color-ewg-caution)",
                borderRadius: EWG_BAR_RADIUS,
              }}
            />
            {danger > 0 && (
              <div
                style={{
                  flex: danger,
                  backgroundColor: "var(--color-ewg-danger)",
                  borderRadius: EWG_BAR_RADIUS,
                }}
              />
            )}
            <div
              style={{
                flex: unknown,
                backgroundColor: EWG_UNKNOWN_COLOR,
                borderRadius: EWG_BAR_RADIUS,
              }}
            />
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
                <p className="text-xs text-text-sub mb-0.5">• {grade.label}</p>
                <p className="text-lg font-bold m-0" style={{ color: grade.color }}>
                  {grade.count}
                </p>
                <p className="text-[10px] text-text-muted mt-0.5">{grade.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 주의 성분 + 알레르기 카드 */}
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
                      className="text-xs px-[10px] py-[3px] rounded-[6px] font-medium"
                      style={CAUTION_CHIP_STYLE}
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
                  {/* 알레르기 경고 아이콘 — 잎+느낌표 스타일 */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                    <path
                      d="M12 2C7 2 3 7 3 12c0 3.5 2 6.5 5 8l1-3c-1.5-1-2.5-2.8-2.5-5 0-3.3 2.5-6 5.5-6s5.5 2.7 5.5 6c0 2.2-1 4-2.5 5l1 3c3-1.5 5-4.5 5-8 0-5-4-10-9-10z"
                      fill="#C62828"
                      fillOpacity="0.2"
                      stroke="#C62828"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    <rect x="11" y="8" width="2" height="5" rx="1" fill="#C62828" />
                    <circle cx="12" cy="16" r="1.1" fill="#C62828" />
                  </svg>
                  <span className="text-sm font-semibold text-[#C62828]">
                    알레르기 유발 성분
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {allergenList.map((name) => (
                    <span
                      key={name}
                      className="text-xs px-[10px] py-[3px] rounded-[6px] font-medium"
                      style={ALLERGEN_CHIP_STYLE}
                    >
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 탭 */}
        <div className="mx-5 mb-2">
          <div className="flex rounded-xl p-1 bg-[#EEEBE4]">
            {[
              { key: "ingredients" as const, label: "전성분 분석" },
              { key: "purpose" as const, label: "목적별 점수" },
              { key: "skintype" as const, label: "피부타입별" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`flex-1 h-9 rounded-[10px] border-none cursor-pointer transition-all text-xs ${
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
          {/* 전성분 분석 */}
          {activeTab === "ingredients" && (
            <div className="rounded-2xl bg-white overflow-hidden">
              {productData.description && (
                <div className="p-4 border-b border-[#F5F5F5]">
                  <p className="text-xs font-semibold text-text-sub mb-1.5">
                    제품 설명
                  </p>
                  <p className="text-xs text-text-primary leading-[1.6]">
                    {productData.description}
                  </p>
                </div>
              )}

              <div className="p-4 border-b border-[#F5F5F5]">
                <button
                  className="flex items-center justify-between w-full bg-transparent border-none cursor-pointer p-0"
                  onClick={() => setIngredOpen((prev) => !prev)}
                >
                  <span className="text-xs font-semibold text-text-sub">
                    전성분
                  </span>
                  <div className="flex items-center gap-1 text-xs text-text-muted">
                    {ingredOpen ? "접기" : "펼치기"}
                    {ingredOpen ? (
                      <ChevronUp size={14} />
                    ) : (
                      <ChevronDown size={14} />
                    )}
                  </div>
                </button>
                <p
                  className="text-[12px] text-[#424242] leading-[1.7] mt-2 overflow-hidden"
                  style={{
                    display: "-webkit-box",
                    WebkitLineClamp: ingredOpen
                      ? ("unset" as unknown as number)
                      : 2,
                    WebkitBoxOrient: "vertical" as const,
                  }}
                >
                  {productData.ingredientsKr.join(", ")}
                </p>
              </div>

              <div>
                {productData.ingredientDetails.map((ingredient, index) => {
                  const ewg = getEwgColor(ingredient.ewgGrade);
                  const isAllergen = isAllergenIngredient(ingredient.name);
                  return (
                    <div
                      key={ingredient.name}
                      className="flex items-start gap-3 px-4 py-3"
                      style={{
                        borderBottom:
                          index < productData.ingredientDetails.length - 1
                            ? INGRED_DIVIDER
                            : "none",
                      }}
                    >
                      <div className="flex flex-col items-center shrink-0 w-7">
                        <DropIcon color={ewg.barColor} />
                        <span
                          className="text-[10px] font-bold mt-0.5"
                          style={{ color: ewg.text }}
                        >
                          {ingredient.ewgGrade != null
                            ? ingredient.ewgGrade
                            : "?"}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-text-primary m-0 leading-[1.3]">
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
                      {isAllergen && <AllergenIcon />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 목적별 점수 */}
          {activeTab === "purpose" && (
            <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
              {purposeScores.map(([label, score]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-text-primary">{label}</span>
                    <span className="text-xs font-bold text-brand">
                      {score}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-[3px] bg-[var(--color-bg-muted-warm)] overflow-hidden">
                    <div
                      className="h-full rounded-[3px] bg-brand transition-[width] duration-[600ms] ease-in-out"
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

          {/* 피부타입별 */}
          {activeTab === "skintype" && (
            <div className="rounded-2xl bg-white p-4 flex flex-col gap-4">
              {skinTypeScores.map(([label, score]) => (
                <div key={label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-text-primary">{label}</span>
                      {label === productData.skinType1 && (
                        <span className="text-[10px] px-2 py-[1px] rounded-[20px] bg-brand text-white font-semibold">
                          내 피부
                        </span>
                      )}
                    </div>
                    <span className="text-xs font-bold text-brand">
                      {score}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-[3px] bg-[var(--color-bg-muted-warm)] overflow-hidden">
                    <div
                      className="h-full rounded-[3px] bg-brand transition-[width] duration-[600ms] ease-in-out"
                      style={{ width: `${score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 위로가기 버튼 */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="absolute bottom-24 right-4 flex items-center justify-center w-10 h-10 rounded-full bg-white/90 backdrop-blur-[10px] border-none cursor-pointer z-20 transition-all active:scale-[0.93] shadow-[0_2px_12px_rgba(0,0,0,0.15),0_0_0_1px_rgba(0,0,0,0.05)]"
        >
          <ChevronUp size={20} color="#1A1A1A" />
        </button>
      )}
    </div>
  );
}
