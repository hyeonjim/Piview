"use client";

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Settings, Plus, Leaf, Package, X, Search, Sparkles, TrendingUp,
} from "lucide-react";
import { Toast } from "@/components/common/Toast";
import { useToast } from "@/hooks";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common";
import ProductCard from "@/components/common/ProductCard";
import { MYPAGE_ROUTINE_STEPS, ROUTINE_STEPS } from "@/constants/routineSteps";
import { CATEGORY_COLORS, SKIN_FUNCTION_COLORS } from "@/constants/categoryColors";
import { getRoutineEvaluation, getScoreBarColor } from "@/constants/routineEvaluation";
import { STEP_PRODUCTS } from "@/constants/_mock/mypageProducts";
import { useLocalRoutineStore, type LocalProduct } from "@/stores/useLocalRoutineStore";

export default function MyPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"routine" | "owned">("routine");

  const { routine, setStepProduct } = useLocalRoutineStore();

  // 페이지 마운트 시 localStorage에서 루틴 복구
  useEffect(() => {
    useLocalRoutineStore.persist.rehydrate();
  }, []);
  const [openStep,  setOpenStep]  = useState<string | null>(null);
  const [addSearch, setAddSearch] = useState("");
  const [isPiview,  setIsPiview]  = useState(false);
  const { toastMsg, showToast } = useToast();

  // 모달 열릴 때 body 스크롤 차단 — BottomNav가 z-50이라 모달이 뒤로 숨는 문제 방지
  useEffect(() => {
    if (openStep) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [openStep]);

  const openModal  = (code: string) => { setOpenStep(code); setAddSearch(""); setIsPiview(false); };
  const closeModal = ()              => { setOpenStep(null); setAddSearch(""); setIsPiview(false); };

  const filledProducts = useMemo(
    () => Object.values(routine).filter((p): p is LocalProduct => !!p),
    [routine],
  );
  const filledCount = filledProducts.length;

  const routineScores = useMemo(
    () => filledProducts.filter((p) => p.matchScore > 0).map((p) => p.matchScore),
    [filledProducts],
  );
  const avgScore =
    routineScores.length > 0
      ? Math.round(routineScores.reduce((a, b) => a + b, 0) / routineScores.length)
      : 0;
  const evaluation  = getRoutineEvaluation(avgScore, routineScores.length);
  const scoreColor  = getScoreBarColor(avgScore);
  const CIRCUMFERENCE = 138;
  const strokeDash  = routineScores.length > 0 ? (avgScore / 100) * CIRCUMFERENCE : 0;

  const modalProducts = useMemo(() => {
    if (!openStep) return [];
    // ROUTINE_STEPS의 categories를 직접 참조 — STEP_CATS 불필요
    const cats = ROUTINE_STEPS.find((s) => s.code === openStep)?.categories ?? [];
    return STEP_PRODUCTS.filter((p) => cats.some((c) => p.category === c || p.category.includes(c)));
  }, [openStep]);

  const displayProducts = useMemo(() => {
    let list = modalProducts;
    if (addSearch) {
      const q = addSearch.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
    }
    const sorted = [...list].sort((a, b) => b.matchScore - a.matchScore);
    return isPiview ? sorted.slice(0, 5) : sorted;
  }, [modalProducts, addSearch, isPiview]);

  const addToRoutine = (product: LocalProduct) => {
    setStepProduct(openStep!, product);
    showToast(`✓ ${product.name} 루틴에 추가됨!`);
    closeModal();
  };

  const removeFromRoutine = (code: string) => setStepProduct(code, null);

  const currentLabel = MYPAGE_ROUTINE_STEPS.find((s) => s.code === openStep)?.label ?? "";

  return (
    <div className="flex flex-col min-h-full bg-bg-base">
      {/* 프로필 */}
      <div className="px-5 pt-5 pb-4 bg-bg-card">
        <div className="flex items-center gap-3">
          <Avatar className="w-14 h-14 bg-bg-surface border border-border">
            <AvatarFallback className="text-text-muted font-semibold text-lg bg-bg-surface">F</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold text-text-primary">User</p>
            <p className="text-xs text-text-muted mt-0.5">피부 타입을 진단해보세요</p>
          </div>
          <Link href="/mypage/settings" className="w-9 h-9 flex items-center justify-center rounded-full border border-border">
            <Settings size={16} className="text-text-muted" />
          </Link>
        </div>

        <Button variant="primary" fullWidth size="md" className="mt-4" onClick={() => router.push("/skin-test")}>
          피부 진단 시작하기
        </Button>

        <div className="flex mt-3 bg-bg-surface rounded-xl p-1">
          {(["routine", "owned"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                tab === t ? "bg-bg-card text-text-primary shadow-sm" : "text-text-muted"
              }`}
            >
              {t === "routine" ? <><Leaf size={14} /> 내 루틴</> : <><Package size={14} /> 보유제품</>}
            </button>
          ))}
        </div>
      </div>

      {/* 루틴 탭 */}
      {tab === "routine" && (
        <div className="px-5 pt-4 flex flex-col gap-2 pb-24">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-base font-bold text-text-primary">내 루틴</p>
              <p className="text-xs text-text-muted">{filledCount}/6단계 완성</p>
            </div>
            <div className="flex gap-1.5">
              {(["OCR", "저장", "추천"] as const).map((a, i) => (
                <button
                  key={a}
                  className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-badge border font-medium ${
                    i === 2 ? "bg-brand text-white border-brand" : "border-border text-text-secondary"
                  }`}
                >
                  {a === "OCR" ? "⇄ " : a === "저장" ? "📋 " : "✦ "}{a}
                </button>
              ))}
            </div>
          </div>

          {MYPAGE_ROUTINE_STEPS.map((step) => {
            const filled = routine[step.code];
            return (
              <div
                key={step.code}
                className="bg-bg-card border rounded-2xl px-4 py-3 transition-all"
                style={{ borderColor: filled ? "rgba(162,170,123,0.19)" : "#F0F0F0" }}
              >
                {filled ? (
                  <div className="flex items-center gap-3">
                    <div
                      className="shrink-0 flex items-center justify-center rounded-xl text-[26px]"
                      style={{ width: 52, height: 52, backgroundColor: "#F8F6F0" }}
                    >
                      {filled.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span className="text-[11px] text-text-muted">{filled.brand}</span>
                        {CATEGORY_COLORS[filled.category] && (
                          <span
                            className="text-[10px] px-1.5 py-[1px] rounded-[4px] font-medium"
                            style={{
                              backgroundColor: CATEGORY_COLORS[filled.category].chip,
                              color: CATEGORY_COLORS[filled.category].accent,
                            }}
                          >
                            {filled.category}
                          </span>
                        )}
                      </div>
                      <p className="truncate text-sm font-semibold text-text-primary">{filled.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filled.effects.slice(0, 3).map((fn) => {
                          const fc = SKIN_FUNCTION_COLORS[fn];
                          return fc ? (
                            <span
                              key={fn}
                              className="text-[10px] px-[5px] py-[1px] rounded-[4px] font-medium"
                              style={{ backgroundColor: fc.chip, color: fc.accent }}
                            >
                              {fn}
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => openModal(step.code)}
                        className="text-[11px] font-semibold text-brand px-[10px] py-[3px] rounded-lg border border-brand/25 bg-brand-bg cursor-pointer"
                      >
                        변경
                      </button>
                      <button
                        onClick={() => removeFromRoutine(step.code)}
                        className="text-[11px] font-medium text-text-muted px-[10px] py-[3px] rounded-lg border border-border bg-white cursor-pointer"
                      >
                        삭제
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                      {step.code}
                    </div>
                    <p className="flex-1 text-sm font-medium text-text-primary">{step.label}</p>
                    <button
                      onClick={() => openModal(step.code)}
                      className="flex items-center gap-1 text-xs font-medium text-brand cursor-pointer border-none bg-transparent"
                    >
                      <Plus size={13} /> 추가
                    </button>
                  </div>
                )}
              </div>
            );
          })}

          {/* 루틴 종합 점수 카드 */}
          {filledCount > 0 && (
            <div
              className="mt-2 p-4 bg-bg-card border rounded-2xl"
              style={{ borderColor: `${scoreColor}30` }}
            >
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 flex items-center justify-center" style={{ width: 56, height: 56 }}>
                  <svg width="56" height="56" className="absolute">
                    <circle cx="28" cy="28" r="22" fill="none" stroke="#F0EDE8" strokeWidth="4" />
                    <circle
                      cx="28" cy="28" r="22" fill="none"
                      stroke={scoreColor} strokeWidth="4"
                      strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                      strokeLinecap="round"
                      transform="rotate(-90 28 28)"
                      style={{ transition: "stroke-dasharray 0.6s ease" }}
                    />
                  </svg>
                  <span className="relative z-[1] text-[13px] font-bold" style={{ color: scoreColor }}>{avgScore}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1">
                    <TrendingUp size={13} style={{ color: scoreColor }} />
                    <span className="text-xs font-bold text-text-primary tracking-[0.5px] uppercase">
                      내 루틴 종합 점수
                    </span>
                  </div>
                  <p className="text-[11px] text-[#8A7B64] leading-[1.5] break-keep">{evaluation.text}</p>
                </div>
              </div>
              <div className="flex gap-2 mt-3 items-end">
                {MYPAGE_ROUTINE_STEPS.map((step) => {
                  const prod = routine[step.code];
                  if (!prod) return null;
                  const bc = getScoreBarColor(prod.matchScore);
                  return (
                    <div key={step.code} className="flex flex-col items-center gap-0.5">
                      <span className="text-[9px] font-bold" style={{ color: bc }}>{prod.matchScore}</span>
                      <div
                        className="w-1.5 rounded-[3px] transition-[height] duration-[400ms] ease-in-out"
                        style={{ height: Math.max(8, (prod.matchScore / 100) * 32), backgroundColor: bc }}
                      />
                      <span className="text-[8px] text-text-muted tracking-[0.3px]">{step.code}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 보유제품 탭 */}
      {tab === "owned" && (
        <div className="px-5 pb-24 pt-4">
          <div className="mb-3">
            <p className="text-base font-bold text-text-primary">보유제품</p>
            <p className="text-xs text-text-muted">0개 보유 중</p>
          </div>
          <div className="border-2 border-dashed border-border rounded-2xl py-12">
            <EmptyState
              icon={Package}
              title="보유한 제품이 없습니다"
              description={'제품 상세에서 "보유중" 버튼을 눌러\n제품을 등록해보세요'}
            />
          </div>
        </div>
      )}

      <Toast msg={toastMsg} />

      {/* 스텝별 추천 제품 모달 */}
      {openStep && (
        <>
          <div
            className="fixed inset-0 z-[60] bg-[rgba(0,0,0,0.5)] backdrop-blur-[4px]"
            onClick={closeModal}
          />
          <div className="fixed inset-0 z-[70] flex items-center justify-center pointer-events-none py-10 px-5">
            <div className="bg-white flex flex-col pointer-events-auto rounded-[20px] w-full max-w-[420px] max-h-full shadow-[0_8px_40px_rgba(0,0,0,0.18)] overflow-hidden">
              <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
                <div className="flex items-center justify-between mt-[15px]">
                  <h3 className="text-sm font-bold text-[#2A2A2A] tracking-[0.5px] uppercase">
                    {currentLabel} 선택
                  </h3>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsPiview((v) => !v)}
                      className={`flex items-center gap-1 cursor-pointer transition-all active:scale-95 px-3 py-[5px] rounded-[20px] text-xs font-bold border-none ${
                        isPiview ? "bg-brand text-white" : "bg-[#F8F6F0] text-brand border border-brand"
                      }`}
                    >
                      <Sparkles size={13} /> 피뷰추천
                    </button>
                    <button
                      onClick={closeModal}
                      className="flex items-center justify-center w-7 h-7 rounded-full bg-[#F0EDE8] border-none cursor-pointer"
                    >
                      <X size={14} color="#888" />
                    </button>
                  </div>
                </div>

                {/* 검색 */}
                <div className="relative mt-3 mb-3">
                  <Search size={16} color="#A09080" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    placeholder="제품명 또는 브랜드 검색"
                    className="w-full h-10 pl-9 pr-3 rounded-xl border border-border-warm bg-[#FAF8F5] text-xs text-[#2A2A2A] outline-none"
                    style={{ paddingRight: addSearch ? 36 : 12 }}
                  />
                  {addSearch && (
                    <button
                      onClick={() => setAddSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center w-5 h-5 rounded-full bg-border-warm border-none cursor-pointer"
                    >
                      <X size={12} color="#888" />
                    </button>
                  )}
                </div>

                {isPiview && (
                  <div className="flex items-center gap-1.5 mb-2 text-xs text-brand font-semibold">
                    <Sparkles size={13} /> 피뷰가 추천하는 {currentLabel} 제품
                  </div>
                )}

                {displayProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10 text-[#A09080]">
                    <Package size={32} className="mb-2 opacity-50" />
                    <p className="text-xs">해당 카테고리에 제품이 없습니다</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {displayProducts.map((product, idx) => {
                      const isAdded = !!routine[openStep!] && routine[openStep!]?.id === product.id;

                      return (
                        <ProductCard
                          key={product.id}
                          id={product.id}
                          name={product.name}
                          brand={product.brand}
                          emoji={product.emoji}
                          category={product.category}
                          skinTypes={product.skinTypes}
                          effects={product.effects}
                          variant="modal"
                          rankingIndex={idx}
                          showRanking={isPiview}
                          isRecommended={isPiview}
                          actions={{
                            onAddRoutine: () => addToRoutine(product),
                            inRoutine: isAdded,
                          }}
                          showDetailButton={true}
                          onDetailClick={closeModal}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
