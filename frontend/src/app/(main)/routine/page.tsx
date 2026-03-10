"use client";

import { useState, useRef } from "react";
import {
  Plus,
  Save,
  Wand2,
  ScanLine,
  TrendingUp,
  X,
  Search,
} from "lucide-react";

/* ── 루틴 스텝 정의 ── */
const STEPS = [
  {
    id: "cleanser",
    label: "클렌저",
    category: "클렌저",
    icon: "🫧",
    required: true,
  },
  {
    id: "toner",
    label: "토너/스킨",
    category: "토너",
    icon: "💧",
    required: true,
  },
  {
    id: "serum",
    label: "세럼/에센스",
    category: "세럼",
    icon: "✨",
    required: false,
  },
  {
    id: "cream",
    label: "크림/오일",
    category: "크림",
    icon: "🤍",
    required: true,
  },
  {
    id: "sunscreen",
    label: "선크림",
    category: "선크림",
    icon: "☀️",
    required: true,
  },
  {
    id: "eyecream",
    label: "아이크림",
    category: "아이크림",
    icon: "👁️",
    required: false,
  },
  {
    id: "mask",
    label: "마스크팩",
    category: "마스크",
    icon: "🎭",
    required: false,
  },
];

const CAT_ICONS: Record<string, string> = {
  클렌저: "CL",
  토너: "TO",
  세럼: "SR",
  크림: "CR",
  선크림: "SC",
  아이크림: "EC",
  마스크: "MK",
};

export default function RoutinePage() {
  const [stepOrder, setStepOrder] = useState(STEPS.map((s) => s.id));
  const [routineProducts, setRoutineProducts] = useState<
    Record<string, { name: string; brand: string } | null>
  >({});
  const [showAddModal, setShowAddModal] = useState<string | null>(null);
  const [addSearch, setAddSearch] = useState("");
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [routineName, setRoutineName] = useState("");
  const [homeView, setHomeView] = useState<"routine" | "owned">("routine");
  const dragRef = useRef<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const steps = stepOrder
    .map((id) => STEPS.find((s) => s.id === id))
    .filter(Boolean) as typeof STEPS;
  const routineCount = Object.values(routineProducts).filter(Boolean).length;

  return (
    <>
      <div className="flex flex-col min-h-full overflow-y-auto pb-4 bg-warm-bg">
        {/* ── 프로필 헤더 ── */}
        <div className="bg-bg-surface px-6 pt-6 pb-5">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center shrink-0 bg-brand-bg border-2 border-brand-light"
              style={{ width: "56px", height: "56px", borderRadius: "50%" }}
            >
              <span
                className="text-brand font-bold"
                style={{ fontSize: "12px", letterSpacing: "0.5px" }}
              >
                F
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-text-primary font-bold"
                style={{ fontSize: "18px", letterSpacing: "-0.3px" }}
              >
                User
              </p>
              <p
                className="text-text-faint"
                style={{ fontSize: "12px", marginTop: "2px" }}
              >
                피부 타입을 진단해보세요
              </p>
            </div>
          </div>

          {/* 뷰 토글 */}
          <div
            className="flex mt-4 p-1 bg-bg-base"
            style={{ borderRadius: "12px" }}
          >
            {[
              { key: "routine", label: "내 루틴" },
              { key: "owned", label: "보유제품" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setHomeView(key as "routine" | "owned")}
                className="flex-1 flex items-center justify-center py-2 cursor-pointer transition-all duration-200"
                style={{
                  borderRadius: "10px",
                  backgroundColor: homeView === key ? "white" : "transparent",
                  border: "none",
                  color:
                    homeView === key
                      ? "var(--color-text-primary)"
                      : "var(--color-warm-beige)",
                  fontSize: "12px",
                  fontWeight: homeView === key ? 700 : 500,
                  boxShadow:
                    homeView === key ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
                  letterSpacing: "0.3px",
                  gap: "6px",
                }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* ── 내 루틴 섹션 ── */}
        {homeView === "routine" && (
          <div className="px-6 mt-3">
            <div className="flex items-center justify-between">
              <div>
                <h2
                  className="text-text-primary font-bold"
                  style={{
                    fontSize: "16px",
                    letterSpacing: "1.2px",
                    textTransform: "uppercase",
                  }}
                >
                  내 루틴
                </h2>
                <p
                  className="text-text-faint"
                  style={{ fontSize: "11px", marginTop: "2px" }}
                >
                  {routineCount}/{steps.length}단계 완성 · 길게 눌러 순서 변경
                </p>
              </div>

              <div className="flex shrink-0 gap-1.5">
                {[
                  {
                    label: "OCR",
                    icon: <ScanLine size={11} />,
                    cls: "bg-white border border-border-warm text-text-hint",
                  },
                  {
                    label: "저장",
                    icon: <Save size={11} />,
                    cls: "bg-white border border-border-warm text-text-hint",
                  },
                  {
                    label: "추천",
                    icon: <Wand2 size={11} />,
                    cls: "bg-brand text-white border-0",
                  },
                ].map(({ label, icon, cls }) => (
                  <button
                    key={label}
                    onClick={() => label === "저장" && setShowSaveModal(true)}
                    className={`flex items-center gap-1 px-3 py-1.5 cursor-pointer transition-all duration-200 whitespace-nowrap ${cls}`}
                    style={{
                      borderRadius: "40px",
                      fontSize: "10px",
                      fontWeight: label === "추천" ? 700 : 600,
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                    }}
                  >
                    {icon} {label}
                  </button>
                ))}
              </div>
            </div>

            {/* 루틴 스텝 카드 */}
            <div className="flex flex-col mt-3">
              {steps.map((step, i) => {
                const product = routineProducts[step.id];
                const isOver = dragOverIdx === i;
                return (
                  <div
                    key={step.id}
                    draggable
                    onDragStart={() => {
                      dragRef.current = i;
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverIdx(i);
                    }}
                    onDrop={() => {
                      if (dragRef.current !== null && dragRef.current !== i) {
                        setStepOrder((prev) => {
                          const next = [...prev];
                          const [moved] = next.splice(dragRef.current!, 1);
                          next.splice(i, 0, moved);
                          return next;
                        });
                      }
                      dragRef.current = null;
                      setDragOverIdx(null);
                    }}
                    onDragEnd={() => {
                      dragRef.current = null;
                      setDragOverIdx(null);
                    }}
                    style={{
                      marginBottom: "10px",
                      borderTop: isOver
                        ? "2px solid var(--color-brand)"
                        : "2px solid transparent",
                      transition: "border-top 0.15s",
                      cursor: "grab",
                    }}
                  >
                    {product ? (
                      <div
                        className="bg-white border border-border-warm overflow-hidden"
                        style={{ borderRadius: "16px" }}
                      >
                        <div
                          className="flex items-start relative"
                          style={{ padding: "15px", cursor: "pointer" }}
                        >
                          <div
                            className="bg-bg-surface shrink-0 flex items-center justify-center"
                            style={{
                              width: "80px",
                              height: "80px",
                              borderRadius: "12px",
                            }}
                          >
                            <span style={{ fontSize: "32px" }}>
                              {step.icon}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0 ml-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span
                                className="text-text-faint font-medium"
                                style={{
                                  fontSize: "12px",
                                  letterSpacing: "0.5px",
                                }}
                              >
                                {product.brand}
                              </span>
                              <span
                                className="bg-bg-outer"
                                style={{
                                  fontSize: "10px",
                                  padding: "1px 3px",
                                  borderRadius: "3px",
                                  color: "var(--color-warm-beige)",
                                  fontWeight: 500,
                                  lineHeight: 1.4,
                                  whiteSpace: "nowrap",
                                }}
                              >
                                {step.label}
                              </span>
                            </div>
                            <p
                              className="truncate text-text-primary font-semibold mt-1"
                              style={{
                                fontSize: "16px",
                                letterSpacing: "0.3px",
                                margin: 0,
                                marginTop: "4px",
                              }}
                            >
                              {product.name}
                            </p>
                          </div>
                          <button
                            onClick={() =>
                              setRoutineProducts((prev) => ({
                                ...prev,
                                [step.id]: null,
                              }))
                            }
                            className="absolute flex items-center justify-center border-none cursor-pointer bg-bg-chip"
                            style={{
                              top: "12px",
                              right: "12px",
                              width: "22px",
                              height: "22px",
                              borderRadius: "50%",
                              padding: 0,
                            }}
                          >
                            <span
                              className="text-text-faint font-semibold"
                              style={{ fontSize: "13px", lineHeight: 1 }}
                            >
                              −
                            </span>
                          </button>
                        </div>
                        <button
                          onClick={() => setShowAddModal(step.id)}
                          className="w-full flex items-center justify-center gap-1 cursor-pointer transition-all duration-200 text-brand"
                          style={{
                            paddingTop: "10px",
                            paddingBottom: "10px",
                            backgroundColor: "transparent",
                            border: "none",
                            borderTop: "1px dashed var(--color-border-warm)",
                          }}
                        >
                          <Plus size={13} />
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 600,
                              letterSpacing: "0.3px",
                            }}
                          >
                            제품 추가
                          </span>
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAddModal(step.id)}
                        className="w-full flex items-center gap-3 cursor-pointer transition-all duration-200 bg-white"
                        style={{
                          borderRadius: "16px",
                          border: "1px dashed var(--color-border-dash)",
                          padding: "16px 10px",
                        }}
                      >
                        <div
                          className="bg-bg-surface shrink-0 flex items-center justify-center"
                          style={{
                            width: "44px",
                            height: "44px",
                            borderRadius: "12px",
                          }}
                        >
                          <span
                            className="text-text-faint font-bold"
                            style={{ fontSize: "11px", letterSpacing: "1px" }}
                          >
                            {CAT_ICONS[step.category] || "PR"}
                          </span>
                        </div>
                        <div className="flex-1 text-left">
                          <p
                            className="text-text-hint font-semibold"
                            style={{ fontSize: "16px", letterSpacing: "0.3px" }}
                          >
                            {step.label}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-brand mr-4">
                          <Plus size={14} />
                          <span
                            style={{
                              fontSize: "11px",
                              fontWeight: 700,
                              letterSpacing: "0.5px",
                              textTransform: "uppercase",
                            }}
                          >
                            추가
                          </span>
                        </div>
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 루틴 종합 점수 */}
            {routineCount > 0 && (
              <div
                className="mt-4 p-4 bg-white border border-border-warm"
                style={{ borderRadius: "16px" }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="relative shrink-0 flex items-center justify-center"
                    style={{ width: "56px", height: "56px" }}
                  >
                    <svg
                      width="56"
                      height="56"
                      style={{ position: "absolute" }}
                    >
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="var(--color-bg-outer)"
                        strokeWidth="4"
                      />
                      <circle
                        cx="28"
                        cy="28"
                        r="22"
                        fill="none"
                        stroke="var(--color-brand)"
                        strokeWidth="4"
                        strokeDasharray={`${(routineCount / steps.length) * 138} 138`}
                        strokeLinecap="round"
                        transform="rotate(-90 28 28)"
                      />
                    </svg>
                    <span
                      className="text-brand font-bold"
                      style={{ fontSize: "13px", position: "relative" }}
                    >
                      {Math.round((routineCount / steps.length) * 100)}
                    </span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5 mb-1">
                      <TrendingUp size={13} className="text-brand" />
                      <span
                        className="text-text-primary font-bold"
                        style={{
                          fontSize: "12px",
                          letterSpacing: "0.5px",
                          textTransform: "uppercase",
                        }}
                      >
                        내 루틴 종합 점수
                      </span>
                    </div>
                    <p
                      className="text-warm-beige"
                      style={{ fontSize: "11px", lineHeight: 1.5 }}
                    >
                      루틴을 완성할수록 피부가 건강해져요!
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── 저장 모달 ── */}
      {showSaveModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: "rgba(0,0,0,0.3)" }}
            onClick={() => setShowSaveModal(false)}
          />
          <div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 bg-white p-6"
            style={{
              width: "calc(100% - 48px)",
              maxWidth: "320px",
              borderRadius: "20px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Save size={18} className="text-brand" />
              <h3
                className="text-text-primary font-bold"
                style={{
                  fontSize: "14px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                루틴 저장
              </h3>
            </div>
            <input
              type="text"
              placeholder="예: 겨울 보습 루틴"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              className="w-full outline-none bg-bg-surface border border-border-warm text-text-primary"
              style={{
                height: "44px",
                padding: "0 14px",
                borderRadius: "12px",
                fontSize: "13px",
              }}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 cursor-pointer transition-all bg-bg-surface border border-border text-text-hint font-semibold"
                style={{
                  borderRadius: "40px",
                  fontSize: "12px",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                취소
              </button>
              <button
                onClick={() => setShowSaveModal(false)}
                className="flex-1 py-2.5 cursor-pointer transition-all"
                style={{
                  borderRadius: "40px",
                  backgroundColor: routineName.trim()
                    ? "var(--color-brand)"
                    : "var(--color-border-warm)",
                  color: routineName.trim()
                    ? "#FFFFFF"
                    : "var(--color-text-faint)",
                  fontSize: "12px",
                  fontWeight: 700,
                  border: "none",
                  letterSpacing: "0.5px",
                  textTransform: "uppercase",
                }}
              >
                저장
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── 제품 추가 모달 ── */}
      {showAddModal && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{
              backgroundColor: "rgba(0,0,0,0.5)",
              backdropFilter: "blur(4px)",
            }}
            onClick={() => {
              setShowAddModal(null);
              setAddSearch("");
            }}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ padding: "40px 20px" }}
          >
            <div
              className="bg-white flex flex-col pointer-events-auto"
              style={{
                borderRadius: "20px",
                width: "100%",
                maxWidth: "420px",
                maxHeight: "100%",
                boxShadow: "0px 8px 40px rgba(0,0,0,0.18)",
                overflow: "hidden",
              }}
            >
              <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0">
                <div
                  className="bg-border"
                  style={{ width: "32px", height: "4px", borderRadius: "2px" }}
                />
                <button
                  onClick={() => setShowAddModal(null)}
                  className="border-none bg-transparent cursor-pointer"
                >
                  <X size={20} className="text-text-faint" />
                </button>
              </div>
              <div className="px-6 pb-6 overflow-y-auto flex-1 min-h-0">
                <h3
                  className="text-text-primary font-bold mt-1"
                  style={{
                    fontSize: "14px",
                    letterSpacing: "0.5px",
                    textTransform: "uppercase",
                  }}
                >
                  {STEPS.find((s) => s.id === showAddModal)?.label} 선택
                </h3>
                <div className="relative mt-3 mb-3">
                  <Search
                    size={15}
                    className="text-text-faint absolute left-3 top-1/2 -translate-y-1/2"
                  />
                  <input
                    type="text"
                    placeholder="제품명 또는 브랜드 검색..."
                    value={addSearch}
                    onChange={(e) => setAddSearch(e.target.value)}
                    className="w-full outline-none bg-bg-surface border border-border-warm"
                    style={{
                      height: "40px",
                      paddingLeft: "34px",
                      borderRadius: "12px",
                      fontSize: "13px",
                    }}
                  />
                </div>
                <div className="flex flex-col items-center py-10">
                  <span style={{ fontSize: "40px" }}>🔍</span>
                  <p
                    className="text-text-faint text-center mt-3"
                    style={{ fontSize: "13px" }}
                  >
                    제품을 검색하거나
                    <br />
                    제품 탭에서 추가해보세요
                  </p>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
