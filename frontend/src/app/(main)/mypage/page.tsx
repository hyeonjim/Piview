"use client";

/**
 * app/(main)/mypage/page.tsx
 *
 * 변경사항:
 *  1. "피부 진단 시작하기" → router.push("/skin-test")
 *  2. 루틴 스텝 "+ 추가" 클릭 → 해당 카테고리 추천 제품 모달
 */

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Settings, Plus, Leaf, Package, Check, X, Search, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Button from "@/components/common/Button";
import { EmptyState } from "@/components/common";
import { MYPAGE_ROUTINE_STEPS } from "@/constants";
import { CATEGORY_COLORS, SKIN_FUNCTION_COLORS, SKIN_TYPE_TAG_COLORS } from "@/constants/categoryColors";

const P = "#A2AA7B", PBG = "#F0F2E8", PLT = "#C5CBA8", TEXT = "#1A1A1A", MUTED = "#AFAFAF";

const STEP_CATS: Record<string, string[]> = {
  CL: ["클렌저", "폼/젤/밤/오일"],
  PR: ["스킨/토너", "토너", "미스트", "패드"],
  SR: ["에센스/앰플/세럼", "세럼", "에센스", "세럼/에센스"],
  LT: ["로션/에멀젼", "로션"],
  CR: ["크림", "페이스오일"],
  SC: ["선크림/스틱", "선크림"],
};

interface SP { id:string; brand:string; name:string; category:string; emoji:string; skinTypes:string[]; effects:string[]; matchScore:number; }
const STEP_PRODUCTS: SP[] = [
  { id:"c1",  brand:"아벤느",     name:"클린스 포밍 젤",                   category:"클렌저",        emoji:"🫧", skinTypes:["민감성"],        effects:["진정","수분"],                   matchScore:78 },
  { id:"c2",  brand:"세타필",     name:"젠틀 스킨 클렌저",                 category:"폼/젤/밤/오일", emoji:"🧴", skinTypes:["건성","민감성"],  effects:["수분","진정"],                   matchScore:82 },
  { id:"t1",  brand:"아누아",     name:"어성초 77 토너",                   category:"스킨/토너",     emoji:"💧", skinTypes:["지성","복합성"],  effects:["여드름","피지","진정"],           matchScore:92 },
  { id:"t2",  brand:"미샤",       name:"[니어스킨] 트러블컷 프레시 토너", category:"스킨/토너",     emoji:"💦", skinTypes:["지성","복합성"],  effects:["여드름","피지","블랙헤드","진정"],matchScore:88 },
  { id:"t3",  brand:"피터스",     name:"0.5% 바하토너",                   category:"스킨/토너",     emoji:"🌊", skinTypes:["지성","수부지"],  effects:["여드름","미백","피지","블랙헤드"],matchScore:85 },
  { id:"t4",  brand:"라운드랩",   name:"1025 독도 토너",                  category:"스킨/토너",     emoji:"🌿", skinTypes:["민감성","건성"],  effects:["수분","진정"],                   matchScore:87 },
  { id:"s1",  brand:"코스알엑스",  name:"달팽이 뮤신 96 에센스",           category:"세럼/에센스",   emoji:"✨", skinTypes:["복합성","건성"],  effects:["수분","안티에이징","진정"],       matchScore:95 },
  { id:"s2",  brand:"이니스프리",  name:"그린티 씨드 세럼",                category:"세럼",          emoji:"🌱", skinTypes:["건성","복합성"],  effects:["수분","영양"],                   matchScore:88 },
  { id:"s3",  brand:"넘버즈인",   name:"1번 비타민C 세럼",                 category:"세럼",          emoji:"🍋", skinTypes:["건성"],           effects:["미백","색소침착","안티에이징"],   matchScore:83 },
  { id:"cr1", brand:"피지오겔",   name:"AI 크림",                         category:"크림",          emoji:"🤍", skinTypes:["민감성","건성"],  effects:["수분","진정","아토피"],           matchScore:90 },
  { id:"cr2", brand:"이니스프리",  name:"그린티 씨드 크림",                category:"크림",          emoji:"💚", skinTypes:["건성","복합성"],  effects:["수분","영양"],                   matchScore:86 },
  { id:"sc1", brand:"아누아",     name:"어성초 선크림 SPF50+",             category:"선크림",        emoji:"☀️", skinTypes:["지성","복합성"],  effects:["피지","진정"],                   matchScore:91 },
  { id:"sc2", brand:"라로슈포제", name:"안티헬리오스 XL SPF50+",           category:"선크림",        emoji:"🌤️", skinTypes:["민감성"],         effects:["진정"],                          matchScore:86 },
];

export default function MyPage() {
  const router = useRouter();
  const [tab, setTab]     = useState<"routine"|"owned">("routine");
  const [routine, setRoutine] = useState<Record<string, SP|null>>(
    Object.fromEntries(MYPAGE_ROUTINE_STEPS.map((s) => [s.code, null]))
  );
  const [openStep, setOpenStep] = useState<string|null>(null);
  const [addSearch, setAddSearch] = useState("");
  const [isPiview, setIsPiview]   = useState(false);
  const [toast, setToast]         = useState("");

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(""), 2500); };
  const openModal = (code: string) => { setOpenStep(code); setAddSearch(""); setIsPiview(false); };
  const closeModal = () => { setOpenStep(null); setAddSearch(""); setIsPiview(false); };

  const filledCount = Object.values(routine).filter(Boolean).length;

  const modalProducts = useMemo(() => {
    if (!openStep) return [];
    const cats = STEP_CATS[openStep] ?? [];
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

  const addToRoutine = (product: SP) => {
    setRoutine((prev) => ({ ...prev, [openStep!]: product }));
    showToast(`✓ ${product.name} 루틴에 추가됨!`);
    closeModal();
  };

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

        {/* ✅ Fix 1 */}
        <Button variant="primary" fullWidth size="md" className="mt-4" onClick={() => router.push("/skin-test")}>
          피부 진단 시작하기
        </Button>

        <div className="flex mt-3 bg-bg-surface rounded-xl p-1">
          {(["routine","owned"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition-all ${tab===t?"bg-bg-card text-text-primary shadow-sm":"text-text-muted"}`}>
              {t==="routine"?<><Leaf size={14}/> 내 루틴</>:<><Package size={14}/> 보유제품</>}
            </button>
          ))}
        </div>
      </div>

      {/* 루틴 탭 */}
      {tab==="routine" && (
        <div className="px-5 pt-4 flex flex-col gap-2 pb-24">
          <div className="flex items-start justify-between mb-1">
            <div>
              <p className="text-base font-bold text-text-primary">내 루틴</p>
              <p className="text-xs text-text-muted">{filledCount}/6단계 완성</p>
            </div>
            <div className="flex gap-1.5">
              {(["OCR","저장","추천"] as const).map((a,i) => (
                <button key={a} className={`flex items-center gap-1 text-xs px-2.5 py-1.5 rounded-badge border font-medium ${i===2?"bg-brand text-white border-brand":"border-border text-text-secondary"}`}>
                  {a==="OCR"?"⇄ ":a==="저장"?"📋 ":"✦ "}{a}
                </button>
              ))}
            </div>
          </div>

          {MYPAGE_ROUTINE_STEPS.map((step) => {
            const filled = routine[step.code];
            return (
              <div key={step.code} className="bg-bg-card border rounded-2xl px-4 py-3 transition-all"
                style={{ borderColor: filled ? `${P}30` : "#F0F0F0" }}>
                {filled ? (
                  <div className="flex items-center gap-3">
                    <div className="shrink-0 flex items-center justify-center rounded-xl"
                      style={{ width:52, height:52, backgroundColor:"#F8F6F0", fontSize:"26px" }}>
                      {filled.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                        <span style={{ fontSize:"11px", color:MUTED }}>{filled.brand}</span>
                        {CATEGORY_COLORS[filled.category] && (
                          <span style={{ fontSize:"10px", padding:"1px 6px", borderRadius:4, backgroundColor:CATEGORY_COLORS[filled.category].chip, color:CATEGORY_COLORS[filled.category].accent, fontWeight:500 }}>
                            {filled.category}
                          </span>
                        )}
                      </div>
                      <p className="truncate" style={{ fontSize:"14px", fontWeight:600, color:TEXT }}>{filled.name}</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {filled.effects.slice(0,3).map((fn) => {
                          const fc = SKIN_FUNCTION_COLORS[fn];
                          return fc ? <span key={fn} style={{ fontSize:"10px", padding:"1px 5px", borderRadius:4, backgroundColor:fc.chip, color:fc.accent, fontWeight:500 }}>{fn}</span> : null;
                        })}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 shrink-0">
                      <button onClick={() => openModal(step.code)} style={{ fontSize:"11px", color:P, fontWeight:600, padding:"3px 10px", borderRadius:8, border:`1px solid ${P}40`, backgroundColor:PBG }}>변경</button>
                      <button onClick={() => setRoutine((p) => ({ ...p, [step.code]:null }))} style={{ fontSize:"11px", color:MUTED, fontWeight:500, padding:"3px 10px", borderRadius:8, border:"1px solid #E0E0E0", backgroundColor:"white" }}>삭제</button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-bg-surface flex items-center justify-center text-xs font-bold text-text-muted shrink-0">
                      {step.code}
                    </div>
                    <p className="flex-1 text-sm font-medium text-text-primary">{step.label}</p>
                    {/* ✅ Fix 2 */}
                    <button onClick={() => openModal(step.code)} className="flex items-center gap-1 text-xs font-medium" style={{ color:P }}>
                      <Plus size={13}/> 추가
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* 보유제품 탭 */}
      {tab==="owned" && (
        <div className="px-5 pb-24 pt-4">
          <div className="mb-3">
            <p className="text-base font-bold text-text-primary">보유제품</p>
            <p className="text-xs text-text-muted">0개 보유 중</p>
          </div>
          <div className="border-2 border-dashed border-border rounded-2xl py-12">
            <EmptyState icon={Package} title="보유한 제품이 없습니다" description={'제품 상세에서 "보유중" 버튼을 눌러\n제품을 등록해보세요'} />
          </div>
        </div>
      )}

      {/* 토스트 */}
      {toast && (
        <div className="fixed top-16 left-1/2 z-[60] -translate-x-1/2 pointer-events-none"
          style={{ padding:"10px 18px", borderRadius:40, backgroundColor:"rgba(40,40,40,0.88)", color:"white", fontSize:"13px", fontWeight:600, boxShadow:"0 4px 20px rgba(0,0,0,0.25)", backdropFilter:"blur(8px)", whiteSpace:"nowrap" }}>
          {toast}
        </div>
      )}

      {/* ✅ Fix 2: 스텝별 추천 제품 모달 */}
      {openStep && (
        <>
          <div className="fixed inset-0 z-40" style={{ backgroundColor:"rgba(0,0,0,0.5)", backdropFilter:"blur(4px)" }} onClick={closeModal} />
          <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none" style={{ padding:"40px 20px" }}>
            <div className="bg-white flex flex-col pointer-events-auto"
              style={{ borderRadius:20, width:"100%", maxWidth:420, maxHeight:"100%", boxShadow:"0 8px 40px rgba(0,0,0,0.18)", overflow:"hidden" }}>
              <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0" style={{ scrollbarWidth:"none" }}>

                {/* 헤더 */}
                <div className="flex items-center justify-between" style={{ marginTop:15 }}>
                  <h3 style={{ fontSize:"14px", fontWeight:700, color:"#2A2A2A", letterSpacing:"0.5px", textTransform:"uppercase" }}>
                    {currentLabel} 선택
                  </h3>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setIsPiview((v) => !v)}
                      className="flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      style={{ padding:"5px 12px", borderRadius:20, fontSize:"12px", fontWeight:700, backgroundColor:isPiview?P:"#F8F6F0", color:isPiview?"white":P, border:isPiview?"none":`1.5px solid ${P}` }}>
                      <Sparkles size={13}/> 피뷰추천
                    </button>
                    <button onClick={closeModal} className="flex items-center justify-center cursor-pointer"
                      style={{ width:28, height:28, borderRadius:"50%", backgroundColor:"#F0EDE8", border:"none" }}>
                      <X size={14} color="#888"/>
                    </button>
                  </div>
                </div>

                {/* 검색 */}
                <div className="relative mt-3 mb-3">
                  <Search size={16} color="#A09080" className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"/>
                  <input type="text" value={addSearch} onChange={(e) => setAddSearch(e.target.value)}
                    placeholder="제품명 또는 브랜드 검색"
                    style={{ width:"100%", height:40, paddingLeft:36, paddingRight:addSearch?36:12, borderRadius:12, border:"1px solid #E8E0D0", backgroundColor:"#FAF8F5", fontSize:"13px", color:"#2A2A2A", outline:"none" }}/>
                  {addSearch && (
                    <button onClick={() => setAddSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center justify-center cursor-pointer"
                      style={{ width:20, height:20, borderRadius:"50%", backgroundColor:"#E8E0D0", border:"none" }}>
                      <X size={12} color="#888"/>
                    </button>
                  )}
                </div>

                {isPiview && (
                  <div className="flex items-center gap-1.5 mb-2" style={{ fontSize:"12px", color:P, fontWeight:600 }}>
                    <Sparkles size={13}/> 피뷰가 추천하는 {currentLabel} 제품
                  </div>
                )}

                {/* 제품 목록 */}
                {displayProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-10" style={{ color:"#A09080" }}>
                    <Package size={32} style={{ marginBottom:8, opacity:0.5 }}/>
                    <p style={{ fontSize:"13px" }}>해당 카테고리에 제품이 없습니다</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {displayProducts.map((product, idx) => {
                      const isAdded = Object.values(routine).some((r) => r?.id === product.id);
                      const catC = CATEGORY_COLORS[product.category];
                      return (
                        <div key={product.id} style={{ borderRadius:14, padding:12, backgroundColor:isAdded?PBG:"white", border:`1px solid ${isAdded?PLT:"#E8E0D0"}` }}>
                          {isPiview && (
                            <div className="inline-flex items-center gap-1 mb-2"
                              style={{ padding:"2px 8px", borderRadius:8, fontSize:"11px", fontWeight:700, backgroundColor:idx<3?P:"#B0A890", color:"white" }}>
                              {(["🥇","🥈","🥉"][idx]??"✦")} {idx+1}위
                            </div>
                          )}
                          <div className="flex items-center gap-3">
                            <div className="shrink-0 flex items-center justify-center rounded-xl"
                              style={{ width:60, height:60, backgroundColor:"#F8F6F0", fontSize:"28px" }}>
                              {product.emoji}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
                                <span style={{ fontSize:"12px", color:MUTED }}>{product.brand}</span>
                                {catC && <span style={{ fontSize:"10px", padding:"1px 6px", borderRadius:4, backgroundColor:catC.chip, color:catC.accent, fontWeight:500 }}>{product.category}</span>}
                              </div>
                              <p className="truncate" style={{ fontSize:"14px", fontWeight:600, color:"#2A2A2A" }}>{product.name}</p>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.skinTypes.map((st) => {
                                  const c = SKIN_TYPE_TAG_COLORS[st] ?? { bg:"#F0EDE8", text:"#7A7060" };
                                  return <span key={st} style={{ fontSize:"10px", padding:"1px 6px", borderRadius:4, backgroundColor:c.bg, color:c.text, fontWeight:600 }}>{st}</span>;
                                })}
                              </div>
                              <div className="flex flex-wrap gap-1 mt-1">
                                {product.effects.slice(0,3).map((fn) => {
                                  const fc = SKIN_FUNCTION_COLORS[fn];
                                  return fc ? <span key={fn} style={{ fontSize:"10px", padding:"1px 5px", borderRadius:4, backgroundColor:fc.chip, color:fc.accent, fontWeight:500 }}>{fn}</span> : null;
                                })}
                              </div>
                            </div>
                            <div className="flex flex-col items-center shrink-0">
                              <span style={{ fontSize:"15px", fontWeight:700, color:P }}>{product.matchScore}</span>
                              <span style={{ fontSize:"9px", color:MUTED, letterSpacing:"0.3px" }}>SCORE</span>
                            </div>
                          </div>
                          <div className="flex gap-2 mt-2.5">
                            <button onClick={() => addToRoutine(product)} disabled={isAdded}
                              className="flex items-center justify-center gap-1 flex-1 cursor-pointer transition-all active:scale-[0.97]"
                              style={{ height:32, borderRadius:40, border:"none", backgroundColor:isAdded?PBG:P, color:isAdded?P:"#fff", fontSize:"13px", fontWeight:700 }}>
                              {isAdded?<><Check size={11}/> 루틴추가됨</>:<><Plus size={11}/> 루틴추가</>}
                            </button>
                            <Link href={`/product/${product.id}`} onClick={closeModal}>
                              <button className="flex items-center justify-center cursor-pointer active:scale-[0.97]"
                                style={{ height:32, padding:"0 12px", borderRadius:40, border:"1px solid #E8E0D0", backgroundColor:"white", fontSize:"12px", color:MUTED, fontWeight:500 }}>
                                상세보기
                              </button>
                            </Link>
                          </div>
                        </div>
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
